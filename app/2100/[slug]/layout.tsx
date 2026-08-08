import type { ReactNode } from "react";

export default function ProjectVisualLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <style>{`
        img[alt="未来の研究開発風景"] {
          content: url('/2100/monday-zero/lab.svg');
          background: url('/2100/monday-zero/lab.svg') center/cover no-repeat;
        }
        img[alt="架空の開発責任者"] {
          content: url('/2100/monday-zero/lab.svg');
          background: url('/2100/monday-zero/lab.svg') center/cover no-repeat;
        }
        #details::before {
          content: '';
          display: block;
          width: 100%;
          aspect-ratio: 4 / 3;
          max-height: 720px;
          margin: 0 auto 48px;
          border-radius: 28px;
          background: #eef6ff url('/2100/monday-zero/details.svg') center/cover no-repeat;
          box-shadow: 0 22px 60px rgba(20, 68, 130, .12);
        }
        @media (max-width: 560px) {
          #details::before {
            margin-bottom: 34px;
            border-radius: 18px;
          }
        }
      `}</style>
    </>
  );
}
