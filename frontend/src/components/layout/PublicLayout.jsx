import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeaderB from "@/components/theme-b/HeaderB";
import FooterB from "@/components/theme-b/FooterB";
import { useTheme } from "@/hooks/useTheme";

export default function PublicLayout({ children }) {
  const { theme } = useTheme();
  const isB = theme === "B";
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: isB ? "var(--tb-paper-base)" : undefined }}
    >
      {isB ? <HeaderB /> : <Header />}
      <main className="flex-1" data-testid="public-main">
        {children}
      </main>
      {isB ? <FooterB /> : <Footer />}
    </div>
  );
}
