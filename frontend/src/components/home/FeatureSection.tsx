import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const features = [
  {
    title: "AI Proposal Drafting",
    desc: "Let the AI craft perfect, client-ready proposals based on your uploaded RFPs — in seconds.",
    icon: "🧠",
  },
  {
    title: "Smart Analysis",
    desc: "Automatically detect key requirements, deadlines, and compliance data using NLP models.",
    icon: "🔍",
  },
  {
    title: "Collaboration Hub",
    desc: "Invite teammates, track revisions, and comment in real time within your workspace.",
    icon: "🤝",
  },
  {
    title: "Instant Export",
    desc: "Export your proposal in DOCX, PDF, or Markdown with just one click.",
    icon: "📄",
  },
  {
    title: "Custom AI Models",
    desc: "Train your own RFP AI on past proposals for tailored recommendations and faster output.",
    icon: "⚙️",
  },
  {
    title: "Secure Cloud",
    desc: "Your data is encrypted end-to-end, protected by enterprise-grade security.",
    icon: "🔐",
  },
];

const Features: React.FC = () => {
  return (
    <section className="features-section">
      <Container>
        <div className="text-center mb-5">
          <h2 className="title">
            <span>AI-Powered</span> Features
          </h2>
          <p className="subtitle">
            Everything you need to create proposals that impress — built with intelligence.
          </p>
        </div>

        <Row>
          {features.map((f, i) => (
            <Col key={i} lg={4} md={6} className="mb-4">
              <div className="feature-card" data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="icon">{f.icon}</div>
                <h5>{f.title}</h5>
                <p>{f.desc}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default Features;
