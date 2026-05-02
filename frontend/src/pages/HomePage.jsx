import PublicLayout from "@/components/layout/PublicLayout";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import MissionVision from "@/components/home/MissionVision";
import Objectives from "@/components/home/Objectives";
import FieldsOfWork from "@/components/home/FieldsOfWork";
import FeaturedPublications from "@/components/home/FeaturedPublications";
import ContactBlock from "@/components/home/ContactBlock";

export default function HomePage() {
  return (
    <PublicLayout>
      <Hero />
      <About />
      <MissionVision />
      <Objectives />
      <FieldsOfWork />
      <FeaturedPublications />
      <ContactBlock />
    </PublicLayout>
  );
}
