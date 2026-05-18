import PublicationCardB from "@/components/theme-b/PublicationCardB";

export default function PublicationCard({ pub, compact = false, testid = "pub-card" }) {
  return <PublicationCardB pub={pub} compact={compact} testid={testid} />;
}
