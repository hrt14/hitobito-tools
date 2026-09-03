import LevelUpAnalytics from "@/components/LevelUpAnalytics";

export default function LevelUpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <LevelUpAnalytics />
    </>
  );
}
