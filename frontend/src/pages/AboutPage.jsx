import PublicLayout from "@/components/layout/PublicLayout";
import { useAboutContent } from "@/hooks/useSiteSettings";
import {
  AboutHeroB, AboutIntroB, AboutMissionVisionB, AboutObjectivesB,
  BoardOfDirectorsB, SuccessPartnersB, AboutContactCtaB,
} from "@/components/theme-b/AboutSectionsB";

/**
 * Public /about page — driven entirely by `about_content` (separate
 * collection from home). Editors control sections, ordering, visibility,
 * typography, alignment, colors, gradients, and background images from
 * `/admin/about`.
 */
const SECTION_RENDERERS = {
  hero:            AboutHeroB,
  intro:           AboutIntroB,
  mission_vision:  AboutMissionVisionB,
  objectives:      AboutObjectivesB,
  board:           BoardOfDirectorsB,
  partners:        SuccessPartnersB,
  contact_cta:     AboutContactCtaB,
};

const DEFAULT_ORDER = ["hero", "intro", "mission_vision", "objectives", "board", "partners", "contact_cta"];

export default function AboutPage() {
  const { data: about, loading } = useAboutContent();

  if (loading || !about) {
    return (
      <PublicLayout>
        <div className="pt-[140px] pb-20 text-center text-mute" data-testid="about-loading">…</div>
      </PublicLayout>
    );
  }

  const visible = Array.isArray(about.visible_sections) && about.visible_sections.length > 0
    ? about.visible_sections
    : DEFAULT_ORDER;

  return (
    <PublicLayout>
      {visible.map((key) => {
        const Cmp = SECTION_RENDERERS[key];
        if (!Cmp) return null;
        return <Cmp key={key} about={about} />;
      })}
    </PublicLayout>
  );
}
