import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { isLanguageCode, labelOf } from "@/app/ear-hub/languages";

export const runtime = "nodejs";
// 議事録の要約は入力が長く、既定の10秒では足りない。
export const maxDuration = 60;

// 一番安いモデルを既定にする。品質を上げたいときは EARHUB_MODEL で差し替える。
const MODEL = process.env.EARHUB_MODEL ?? "claude-haiku-4-5";
const ACCESS_CODE = process.env.EARHUB_ACCESS_CODE ?? "";

/**
 * 従量課金のキーをブラウザに置けないのでサーバー経由にしている。
 * その結果このエンドポイントは誰でも叩けるので、支払いを守る上限をここに置く。
 * サーバーレスではインスタンスごとのメモリなので厳密な制限にはならない。
 * 最終的な歯止めはコンソール側の利用上限で、ここはその前段の粗いフィルタ。
 */
const TRANSLATE_MAX_CHARS = 800;
const SUMMARIZE_MAX_CHARS = 24_000;
const REQUESTS_PER_MINUTE = 40;
const DAILY_CHAR_BUDGET = Number(process.env.EARHUB_DAILY_CHAR_BUDGET ?? 400_000);

/**
 * モデルによって受け付けるパラメータが違い、対応していないものを送ると400になる。
 * EARHUB_MODEL で差し替えられるようにしてある以上、送る前にここで判定する。
 */
const startsWithAny = (prefixes: string[]) => prefixes.some((prefix) => MODEL.startsWith(prefix));

// output_config.effort は 4.6 世代以降だけ。Haiku 4.5 に送るとエラーになる。
const SUPPORTS_EFFORT = startsWithAny([
  "claude-opus-5",
  "claude-opus-4-8",
  "claude-opus-4-7",
  "claude-opus-4-6",
  "claude-sonnet-5",
  "claude-sonnet-4-6",
  "claude-fable-5",
]);

// サーバー側のフォールバックは Opus 5 / Fable 5 系だけが受け付ける。
const SUPPORTS_SERVER_FALLBACK = startsWithAny(["claude-opus-5", "claude-fable-5"]);

type Bucket = { minuteStart: number; count: number };
const buckets = new Map<string, Bucket>();
let budgetDay = "";
let budgetUsed = 0;

function clientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

function takeRateLimit(key: string) {
  const now = Date.now();

  if (buckets.size > 500) {
    for (const [id, bucket] of buckets) {
      if (now - bucket.minuteStart > 120_000) buckets.delete(id);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now - bucket.minuteStart > 60_000) {
    buckets.set(key, { minuteStart: now, count: 1 });
    return true;
  }
  if (bucket.count >= REQUESTS_PER_MINUTE) return false;
  bucket.count += 1;
  return true;
}

function takeDailyBudget(chars: number) {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== budgetDay) {
    budgetDay = today;
    budgetUsed = 0;
  }
  if (budgetUsed + chars > DAILY_CHAR_BUDGET) return false;
  budgetUsed += chars;
  return true;
}

function textOf(content: Anthropic.Beta.BetaContentBlock[]) {
  return content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}

/** フォールバックを付けられるモデルのときだけ付ける。他のモデルでは400になる。 */
function fallbackParams() {
  if (!SUPPORTS_SERVER_FALLBACK) return {};
  return {
    betas: ["server-side-fallback-2026-07-01" as const],
    fallbacks: "default" as const,
  };
}

/** 思考の深さ。対応していないモデルには送らない。 */
function effortParams(effort: "low" | "medium") {
  return SUPPORTS_EFFORT ? { output_config: { effort } } : {};
}

let cachedClient: Anthropic | null = null;

// キーが無い環境で読み込まれただけで落ちないよう、最初の呼び出しまで作らない。
function anthropic() {
  cachedClient ??= new Anthropic();
  return cachedClient;
}

function translatePrompt(from: string, to: string) {
  return [
    `あなたは会話の同時通訳エンジンです。入力された${from}の発話を${to}に訳します。`,
    "- 訳文だけを出力する。前置き、注釈、原文の再掲、引用符は出力しない。",
    "- 挨拶や相槌も省略せずに訳す。",
    "- 音声認識の出力なので誤認識と言い差しを含む。文脈から最も自然な発話として解釈して訳す。",
    "- 訳しようがない断片のときだけ「(聞き取れませんでした)」と出力する。",
  ].join("\n");
}

const SUMMARIZE_PROMPT = [
  "あなたは会議の議事録作成者です。音声認識された文字起こしを読み、日本語の議事録にまとめます。",
  "文字起こしは話者が分離されておらず、誤認識と言い差しを含みます。文脈から補って読み、確信が持てない内容は断定しないでください。",
  "次の見出しをこの順でMarkdownで出力します。該当する内容がない見出しには「なし」とだけ書きます。",
  "## 要約",
  "## 決定事項",
  "## ToDo",
  "## 保留・確認事項",
  "議事録本文だけを出力し、前置きや感想は書かないでください。",
].join("\n");

async function translate(text: string, fromLabel: string, toLabel: string) {
  const response = await anthropic().beta.messages.create({
    ...fallbackParams(),
    model: MODEL,
    max_tokens: 1000,
    // 会話に割り込む速さが要るので、思考は浅くする。
    ...effortParams("low"),
    system: translatePrompt(fromLabel, toLabel),
    messages: [{ role: "user", content: text }],
  });
  if (response.stop_reason === "refusal") return null;
  return textOf(response.content);
}

async function summarize(transcript: string) {
  // 入力が長いのでストリームで受けてHTTPタイムアウトを避ける。
  const stream = anthropic().beta.messages.stream({
    ...fallbackParams(),
    model: MODEL,
    max_tokens: 4000,
    ...effortParams("medium"),
    system: SUMMARIZE_PROMPT,
    messages: [{ role: "user", content: transcript }],
  });
  const response = await stream.finalMessage();
  if (response.stop_reason === "refusal") return null;
  return textOf(response.content);
}

function fail(status: number, error: string, message: string) {
  return NextResponse.json({ error, message }, { status });
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return fail(503, "not_configured", "ANTHROPIC_API_KEY が設定されていません。");
  }

  if (ACCESS_CODE && request.headers.get("x-earhub-code") !== ACCESS_CODE) {
    return fail(401, "access_code_required", "アクセスコードが必要です。");
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "invalid_body", "リクエストの形式が正しくありません。");
  }

  if (!takeRateLimit(clientKey(request))) {
    return fail(429, "rate_limited", "短時間の呼び出しが多すぎます。少し待ってから再開してください。");
  }

  try {
    if (body.task === "translate") {
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text) return fail(400, "empty_text", "翻訳する文が空です。");
      if (text.length > TRANSLATE_MAX_CHARS) {
        return fail(413, "too_long", `1回に翻訳できるのは${TRANSLATE_MAX_CHARS}文字までです。`);
      }
      if (!isLanguageCode(body.from) || !isLanguageCode(body.to)) {
        return fail(400, "invalid_language", "対応していない言語です。");
      }
      if (!takeDailyBudget(text.length)) {
        return fail(429, "budget_exceeded", "本日の利用量の上限に達しました。");
      }

      const result = await translate(text, labelOf(body.from), labelOf(body.to));
      if (result === null) return fail(422, "refused", "この発話は翻訳できませんでした。");
      return NextResponse.json({ text: result }, { headers: { "Cache-Control": "no-store" } });
    }

    if (body.task === "summarize") {
      const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
      if (!transcript) return fail(400, "empty_text", "文字起こしが空です。");
      if (transcript.length > SUMMARIZE_MAX_CHARS) {
        return fail(
          413,
          "too_long",
          `1回にまとめられるのは${SUMMARIZE_MAX_CHARS}文字までです。長い会議は分割してください。`,
        );
      }
      if (!takeDailyBudget(transcript.length)) {
        return fail(429, "budget_exceeded", "本日の利用量の上限に達しました。");
      }

      const result = await summarize(transcript);
      if (result === null) return fail(422, "refused", "この内容はまとめられませんでした。");
      return NextResponse.json({ text: result }, { headers: { "Cache-Control": "no-store" } });
    }

    return fail(400, "unknown_task", "対応していない処理です。");
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return fail(503, "bad_key", "APIキーが受け付けられませんでした。");
    }
    if (error instanceof Anthropic.RateLimitError) {
      return fail(429, "upstream_rate_limited", "APIの上限に達しました。少し待ってから再開してください。");
    }
    if (error instanceof Anthropic.APIError) {
      return fail(502, "upstream_error", `APIがエラーを返しました (${error.status})。`);
    }
    return fail(500, "unexpected", "処理に失敗しました。");
  }
}
