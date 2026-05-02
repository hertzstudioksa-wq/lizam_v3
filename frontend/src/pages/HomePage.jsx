import PublicLayout from "@/components/layout/PublicLayout";
import { useTheme } from "@/hooks/useTheme";

import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import MissionVision from "@/components/home/MissionVision";
import Objectives from "@/components/home/Objectives";
import FieldsOfWork from "@/components/home/FieldsOfWork";
import FeaturedPublications from "@/components/home/FeaturedPublications";
import ContactBlock from "@/components/home/ContactBlock";

import HeroB from "@/components/theme-b/HeroB";
import AboutB from "@/components/theme-b/AboutB";
import MissionVisionB from "@/components/theme-b/MissionVisionB";
import ObjectivesB from "@/components/theme-b/ObjectivesB";
import FieldsOfWorkB from "@/components/theme-b/FieldsOfWorkB";
import FeaturedPublicationsB from "@/components/theme-b/FeaturedPublicationsB";
import ContactBlockB from "@/components/theme-b/ContactBlockB";

export default function HomePage() {
  const { theme } = useTheme();
  const isB = theme === "B";
  return (
    <PublicLayout>
      {isB ? <HeroB /> : <Hero />}
      {isB ? <AboutB /> : <About />}
      {isB ? <MissionVisionB /> : <MissionVision />}
      {isB ? <ObjectivesB /> : <Objectives />}
      {isB ? <FieldsOfWorkB /> : <FieldsOfWork />}
      {isB ? <FeaturedPublicationsB /> : <FeaturedPublications />}
      {isB ? <ContactBlockB /> : <ContactBlock />}
    </PublicLayout>
  );
}
