import HeaderB from "@/components/theme-b/HeaderB";
import FooterB from "@/components/theme-b/FooterB";
import { useTheme } from "@/hooks/useTheme";

export default function PublicLayout({ children }) {
  useTheme();
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--tb-paper-base)" }}
    >
      <HeaderB />
      <main className="flex-1" data-testid="public-main">
        {children}
      </main>
      <FooterB />
    </div>
  );
}
