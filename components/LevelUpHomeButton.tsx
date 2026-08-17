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
        color: "#fff",
        textDecoration: "none",
        fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        fontSize: 24,
        fontWeight: 900,
        lineHeight: 1,
        boxShadow: "0 8px 28px rgba(0,0,0,.28)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      ‹
    </a>
  );
}
