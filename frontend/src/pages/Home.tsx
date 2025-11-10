//
// Home
//

import LandingSection from "../components/home/LandingSection";
import FeatureSection from "../components/home/FeatureSection";
import How from "../components/home/HowItWorks";
import Use from "../components/home/UseCases";
import Ai from "../components/home/AIInAction";
import Why from "../components/home/WhyChoose";

export default function Home() {
  return (
    <div>
      <LandingSection />      
      <Ai />
      <How />
      <FeatureSection />
      <Use />
      <Why />
    </div>
  );
}
