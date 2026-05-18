import PublicLayout from "@/components/layout/PublicLayout";
import { useHomeContent } from "@/hooks/useSiteSettings";

import HeroB from "@/components/theme-b/HeroB";
import AboutB from "@/components/theme-b/AboutB";
import MissionVisionB from "@/components/theme-b/MissionVisionB";
import PullBandB from "@/components/theme-b/PullBandB";
import ObjectivesB from "@/components/theme-b/ObjectivesB";
import FieldsOfWorkB from "@/components/theme-b/FieldsOfWorkB";
import FeaturedPublicationsB from "@/components/theme-b/FeaturedPublicationsB";
import NewsletterB from "@/components/theme-b/NewsletterB";
import ContactBlockB from "@/components/theme-b/ContactBlockB";

/**
 * Sections are rendered in a flex column with CSS `order` derived from the
 * admin-controlled `home_content.visible_sections` array. This lets editors
 * reorder sections in /admin/home and have the public site reflect the new
 * order immediately. Sections missing from the array (or hidden via toggle)
 * get order=999 and stack at the end — the individual section components
 * also `return null` when they're not in `visible_sections`, so hidden
 * sections render nothing at all.
 */
export default function HomePage() {
  const { data: home } = useHomeContent();
  const order = (key) => {
    const vs = home?.visible_sections;
    if (!Array.isArray(vs)) return 0;
    const i = vs.indexOf(key);
    return i >= 0 ? i : 999;
  };
  return (
    <PublicLayout>
      <div className="flex flex-col">
        <div style={{ order: order("hero") }}><HeroB /></div>
        <div style={{ order: order("about") }}><AboutB /></div>
        <div style={{ order: order("mission") }}><MissionVisionB /></div>
        <div style={{ order: order("pull_band") }}><PullBandB /></div>
        <div style={{ order: order("objectives") }}><ObjectivesB /></div>
        <div style={{ order: order("fields_of_work") }}><FieldsOfWorkB /></div>
        <div style={{ order: order("featured_publications") }}><FeaturedPublicationsB /></div>
        <div style={{ order: order("newsletter") }}><NewsletterB /></div>
        <div style={{ order: order("contact") }}><ContactBlockB /></div>
      </div>
    </PublicLayout>
  );
}
