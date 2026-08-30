import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "hitobito Tools" },
  description: "暮らしや学びの中にある「あと少し」を助ける、小さなWebツールのポータル。",
  alternates: { canonical: "https://tools.hitobito.jp/" },
};

const tools = [
  {
    href: "https://habitegg.hitobito.jp",
    tag: "LIFE / HABIT",
    title: "Habit Egg",
    text: "習慣を続けると、卵が育つ。毎日の小さな行動を、かわいい相棒の成長に変える習慣アプリ。",
    accent: "lime",
    status: "公開中",
    icon: "🥚",
  },
  {
    href: "https://life1.hitobito.jp",
    tag: "LIFE / LOG",
    title: "LIFE +1",
    text: "減ったものではなく、人生に増えたものを見る。今日も人生の累計最高記録を確認するライフログ。",
    accent: "lime",
    status: "NEW",
    icon: "+1",
  },
  {
    href: "https://chinese.hitobito.jp",
    tag: "LEARNING",
    title: "瞬間作文",
    text: "日本語を見て、すぐ中国語・英語にする。文型からアドバンス語彙まで、スキマ時間で反射的な語学力を鍛える学習アプリ。",
    accent: "orange",
    status: "公開中",
    icon: "語",
  },
].filter((tool) => Boolean(tool.href));

export default function ToolsHome() {
  return (
    <main>
      <nav className="nav" aria-label="メインナビゲーション">
        <Link href="https://tools.hitobito.jp/" className="brand" aria-label="hitobito Tools トップ">
          <span>hitobito</span> <i>Tools</i>
        </Link>
        <div className="nav-links">
          <a className="nav-link" href="#tools">
            TOOLS <span aria-hidden="true">↓</span>
          </a>
          <a className="nav-link games-link" href="https://games.hitobito.jp/">
            GAMES <span aria-hidden="true">↗</span>
          </a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">SMALL TOOLS, REAL CHANGE.</p>
          <h1>
            毎日を、
            <br />
            <em>ちょっと</em>便利に。
          </h1>
          <p className="lead">
            hitobito Toolsは、暮らしや学びの中にある「あと少し」を助ける、小さな道具のポータルです。
          </p>
          <a className="primary" href="#tools">
            道具を見てみる <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="hero-art" aria-label="道具が集まる庭のイラスト">
          <div className="sun" />
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="orb orb-three" />
          <div className="hill hill-back" />
          <div className="hill hill-front" />
          <div className="egg">
            <div className="egg-face">•ᴗ•</div>
          </div>
          <div className="spark s1">✦</div>
          <div className="spark s2">✳</div>
        </div>
      </section>

      <section id="tools" className="tools-section">
        <div className="section-head">
          <p className="eyebrow">AVAILABLE TOOLS</p>
          <h2>今つかえる道具</h2>
          <p>仕事、暮らし、学びに使うものをここにまとめています。</p>
        </div>

        <div className="tool-grid">
          {tools.map((tool) => (
            <a
              className={`tool-card ${tool.accent}`}
              href={tool.href}
              key={tool.title}
              aria-label={`${tool.title}を開く`}
            >
              <div className="card-top">
                <span className="tool-tag">{tool.tag}</span>
                <span className="status">{tool.status}</span>
              </div>
              <div className="mini-icon" aria-hidden="true">
                {tool.icon}
              </div>
              <h3>{tool.title}</h3>
              <p>{tool.text}</p>
              <span className="card-link">
                使ってみる <b aria-hidden="true">→</b>
              </span>
            </a>
          ))}

          <div className="coming">
            <span aria-hidden="true">＋</span>
            <p>
              次の道具を
              <br />
              準備中です。
            </p>
          </div>
        </div>
      </section>

      <section className="games-portal" aria-label="hitobito Games">
        <div>
          <p className="eyebrow">WANT TO PLAY?</p>
          <h2>遊ぶなら、hitobito Gamesへ。</h2>
          <p>一滴、CYCLE、ワーキングプラネット、INFRA KINGなど、ゲームは専用ページにまとめています。</p>
        </div>
        <a href="https://games.hitobito.jp/">
          hitobito Games <span aria-hidden="true">↗</span>
        </a>
      </section>

      <footer>
        <span className="brand">
          <span>hitobito</span> <i>Tools</i>
        </span>
        <small>小さな道具を、すぐ使える形で。</small>
      </footer>
    </main>
  );
}
