import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const steps = [
  {
    title: "Upload RFP",
    desc: "Upload your RFP file and let our AI read and extract all critical requirements instantly.",
    icon: "📤",
  },
  {
    title: "AI Brainstorm",
    desc: "Our AI engine analyzes tone, structure, and data to craft tailored proposal drafts.",
    icon: "🧠",
  },
  {
    title: "Refine & Edit",
    desc: "Customize your proposal with built-in smart editing tools and AI suggestions.",
    icon: "⚡",
  },
  {
    title: "Export & Win",
    desc: "Download in multiple formats or share instantly — faster turnaround, higher success rate.",
    icon: "🚀",
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section className="how-v2">
      <Container>
        <div className="text-center mb-5">
          <h2 className="title">
            <span>How</span> It Works
          </h2>
          <p className="subtitle">
            Your journey from raw RFPs to AI-powered winning proposals.
          </p>
        </div>

        <Row>
          {steps.map((step, i) => (
            <Col key={i} lg={3} md={6} className="mb-4">
              <div className="step-card" data-aos="zoom-in">
                <div className="glow"></div>
                <div className="icon">{step.icon}</div>
                <h5>{step.title}</h5>
                <p>{step.desc}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default HowItWorks;
