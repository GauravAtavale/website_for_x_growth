import { Navigation } from "./Navigation";
import { HeroAtmosphere } from "./HeroAtmosphere";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Footer } from "./Footer";
import { FAQ } from "./FAQ";
import { FeaturesBento } from "./FeaturesBento";
import { ProductOverview } from "./ProductOverview";
import { MasonryGrid } from "./MasonryGrid";

interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

interface LandingPageProps {
  heroTitle: string;
  heroSubtitle?: string;
  heroDescription: string;
  ctaLabel?: string;
  ctaHref?: string;
  features?: { title: string; description: string; icon?: string }[];
  featuresTitle?: string;
  howItWorks?: HowItWorksStep[];
  brandName?: string;
  marqueeText?: string;
}

export function LandingPage({
  heroTitle,
  heroSubtitle,
  heroDescription,
  ctaLabel = "Start Creating",
  ctaHref = "/",
  howItWorks,
  brandName = "Growth Studio",
}: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">

      <div className="relative isolate">
        <HeroAtmosphere />
        <Navigation brandName={brandName} />
        <Hero
          title={heroTitle}
          subtitle={heroSubtitle}
          description={heroDescription}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
        />
      </div>

      <ProductOverview />

      <FeaturesBento />

      {howItWorks && howItWorks.length > 0 && <HowItWorks steps={howItWorks} />}

      <MasonryGrid />

      <FAQ ctaLabel={ctaLabel} ctaHref={ctaHref} />

      <Footer brandName={brandName} />
    </div>
  );
}
