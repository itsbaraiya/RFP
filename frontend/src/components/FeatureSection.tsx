
//
// FeatureSection 
// 

import React from "react";

const FeatureSection: React.FC = () => {
  return (
    <section className="feature-section py-5 bg-light">
      <div className="container">
        <h2 className="section-title text-center mb-5">Features</h2>
        <div className="row g-4">
          <div className="col-md-4 text-center">
            <h5>Automated RFP Creation</h5>
            <p>Create RFPs in minutes with AI assistance.</p>
          </div>
          <div className="col-md-4 text-center">
            <h5>Smart Analysis</h5>
            <p>Analyze responses and score vendors automatically.</p>
          </div>
          <div className="col-md-4 text-center">
            <h5>Collaboration</h5>
            <p>Work with your team in real-time on RFPs.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
