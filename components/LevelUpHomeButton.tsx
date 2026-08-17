export default function LevelUpHomeButton() {
  return (
    <a
      href="https://levelup.hitobito.jp/"
      aria-label="LEVEL UPトップへ戻る"
      title="LEVEL UPトップへ戻る"
      style={{
        position: "fixed",
        zIndex: 2147483647,
        top: "max(10px, env(safe-area-inset-top))",
        left: "max(10px, env(safe-area-inset-left))",
        width: 46,
        height: 46,
        display: "grid",
        placeItems: "center",
        border: "1px solid rgba(255,255,255,.24)",
        borderRadius: 15,
        background: "rgba(12,16,24,.82)",
        color: "#d8ff5b",
        textDecoration: "none",
        boxShadow: "0 8px 28px rgba(0,0,0,.28)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M3.5 10.5 12 3.25l8.5 7.25v9.25a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
