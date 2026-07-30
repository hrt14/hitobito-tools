import Link from "next/link";

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
    href: "https://chinese.hitobito.jp",
    tag: "LEARNING",
    title: "中国語瞬間作文",
    text: "日本語を見て、すぐ中国語にする。スキマ時間で反射的な中国語を鍛える学習アプリ。",
    accent: "orange",
    status: "公開中",
    icon: "中",
  },
  {
    href: "https://touch-egg.hitobito.jp",
    tag: "PLAY / COLLECTION",
    title: "Touch Egg",
    text: "ただ触るだけ。卵から生まれる幻獣や古代生物を育てて、少しずつ図鑑を集めるゲーム。",
    accent: "pink",
    status: "公開中",
    icon: "☝",
  },
];

export default function Home() {
  return (
    <main>
      <nav className="nav" aria-label="メインナビゲーション">
        <Link href="/" className="brand" aria-label="hitobito Tools トップ">
          <span>hitobito</span> <i>Tools</i>
        </Link>
        <a className="nav-link" href="#tools">
          TOOLS <span aria-hidden="true">↓</span>
        </a>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">SMALL TOOLS, REAL CHANGE.</p>
          <h1>
            毎日を、
            <br />
            <em>ちょっと</em>面白く。
          </h1>
          <p className="lead">
            hitobito
            Toolsは、暮らしや学びの中にある「あと少し」を助ける、小さな道具のポータルです。
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
          <p>ひとつずつ、丁寧につくっています。</p>
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

      <footer>
        <span className="brand">
          <span>hitobito</span> <i>Tools</i>
        </span>
        <small>小さな道具を、すぐ使える形で。</small>
      </footer>
    </main>
  );
}
