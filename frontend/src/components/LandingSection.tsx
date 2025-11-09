//
// Landing Section
// 

import React from "react";

interface LandingSectionProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
}

const LandingSection: React.FC<LandingSectionProps> = ({
  title = "Revolutionize Your RFP Process with AI",
  subtitle = "RFP AI helps you create, manage, and analyze RFPs faster, smarter, and more efficiently.",
  imageUrl = "/images/landing-illustration.png",
}) => {
  return (
    <section className="landing-section py-5">
      <div className="container">
        <div className="row align-items-center">          
          <div className="col-lg-6 mb-4 mb-lg-0">
            <h1 className="landing-title">{title}</h1>
            <p className="landing-subtitle">{subtitle}</p>
            <div className="landing-buttons mt-3">
              <a href="/register" className="btn btn-primary me-2">Get Started</a>
              <a href="/features" className="btn btn-outline-dark">Learn More</a>
            </div>
          </div>
          
          <div className="col-lg-6 text-center">
            <img
              src={imageUrl}
              alt="RFP AI Illustration"
              className="img-fluid landing-image"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default LandingSection;
