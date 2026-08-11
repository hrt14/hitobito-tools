import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "一滴 | DROP",
  description: "一滴の水になって、地球の水循環を旅する分岐型ブラウザゲーム。",
};

export default function DropHome() {
  return (
    <main
      style={{
        minHeight: "100svh",
        overflow: "hidden",
        background: "linear-gradient(180deg, #c9ebff 0%, #eaf8ff 42%, #c7e9b4 42.2%, #6da36c 100%)",
        color: "#12343b",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        position: "relative",
      }}
    >
      <svg
        viewBox="0 0 390 844"
        role="img"
        aria-label="雲から森へ落ちる一滴"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="dropGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.35" stopColor="#9de7ff" />
            <stop offset="1" stopColor="#2fa9dd" />
          </linearGradient>
          <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g opacity="0.95">
          <ellipse cx="76" cy="125" rx="64" ry="30" fill="#fff" />
          <ellipse cx="122" cy="119" rx="66" ry="37" fill="#fff" />
          <ellipse cx="170" cy="132" rx="54" ry="27" fill="#fff" />
        </g>

        <g opacity="0.65">
          <path d="M0 385 Q68 320 140 365 T280 355 T430 350 L430 500 L0 500Z" fill="#87bca7" />
          <path d="M0 420 Q84 350 175 410 T390 382 L390 520 L0 520Z" fill="#5b9583" />
        </g>

        <g transform="translate(198 292)" filter="url(#softGlow)">
          <path d="M0-38 C16-16 29 2 29 19 C29 37 16 51 0 51 C-16 51-29 37-29 19 C-29 2-16-16 0-38Z" fill="url(#dropGlow)" />
          <ellipse cx="-8" cy="3" rx="6" ry="12" fill="#fff" opacity="0.65" />
        </g>

        <path d="M-20 640 Q90 530 225 608 Q310 662 430 575 L430 900 L-20 900Z" fill="#347257" />
        <path d="M42 648 Q150 555 335 626 Q245 652 158 710 Q96 747 42 648Z" fill="#65aa64" />
        <path d="M56 647 Q157 632 314 630" fill="none" stroke="#d9ef9e" strokeWidth="7" strokeLinecap="round" opacity="0.8" />
        <path d="M123 634 Q151 601 168 575 M190 635 Q216 598 239 582 M244 639 Q277 617 304 606" fill="none" stroke="#b7dc80" strokeWidth="4" strokeLinecap="round" opacity="0.75" />

        <g opacity="0.7" fill="#ffffff">
          <circle cx="185" cy="217" r="3" />
          <circle cx="204" cy="233" r="2" />
          <circle cx="178" cy="248" r="2.6" />
          <circle cx="214" cy="262" r="1.8" />
        </g>
      </svg>

      <section
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "max(34px, env(safe-area-inset-top)) 24px max(34px, env(safe-area-inset-bottom))",
          textAlign: "center",
        }}
      >
        <div style={{ letterSpacing: "0.22em", fontSize: 12, fontWeight: 700, opacity: 0.7 }}>DROP / hitobito</div>

        <div style={{ marginTop: "auto", marginBottom: "auto", transform: "translateY(-70px)" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(64px, 19vw, 92px)", fontWeight: 500, letterSpacing: "0.08em" }}>一滴</h1>
          <p style={{ margin: "10px 0 0", fontSize: 17, letterSpacing: "0.08em" }}>その一滴は、どこへ行くのか。</p>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 420,
            padding: "16px 18px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.66)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: "0 12px 40px rgba(19, 76, 74, 0.14)",
            fontSize: 14,
            fontWeight: 650,
          }}
        >
          どこへ行っても、旅は続く。 — COMING SOON
        </div>
      </section>
    </main>
  );
}
