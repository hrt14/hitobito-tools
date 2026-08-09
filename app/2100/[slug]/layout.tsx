import type { ReactNode } from "react";

export default function ProjectVisualLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <style>{`
        [class*="sectionNav"] {
          overflow-x: auto;
          justify-content: flex-start !important;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        [class*="sectionNav"]::-webkit-scrollbar {
          display: none;
        }
        [class*="sectionNav"] a {
          flex: 0 0 auto;
          white-space: nowrap;
          word-break: keep-all;
        }
      `}</style>
    </>
  );
}
