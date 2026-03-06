import { useState } from "react";
import IntroScreen from "../components/IntroScreen";
import LandingPageContent from "../components/LandingPageContent";

function LandingPage() {

  const [showIntro, setShowIntro] = useState(true);

  return (
    <>
      {showIntro ? (
        <IntroScreen onEnter={() => setShowIntro(false)} />
      ) : (
        <LandingPageContent />
      )}
    </>
  );

}

export default LandingPage;