import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const useCases = [
  {
    title: "Agencies",
    desc: "Streamline your proposal workflow with AI-driven RFP analysis and instant draft creation.",
    icon: "🏢",
  },
  {
    title: "Freelancers",
    desc: "Save hours writing proposals — let the AI tailor responses that match your style and tone.",
    icon: "💼",
  },
  {
    title: "Enterprises",
    desc: "Maintain consistency across large teams while ensuring top-quality proposals every time.",
    icon: "🏦",
  },
  {
    title: "Consultants",
    desc: "Generate detailed, customized RFP responses that showcase expertise in seconds.",
    icon: "🧠",
  },
  {
    title: "Startups",
    desc: "Pitch faster, smarter, and more persuasively with AI-powered proposal generation.",
    icon: "🚀",
  },
  {
    title: "Government Vendors",
    desc: "Easily handle complex RFP formats and compliance data with AI automation.",
    icon: "📜",
  },
];

const UseCases: React.FC = () => {
  return (
    <section className="usecases-section">
      <Container>
        <div className="text-center mb-5">
          <h2 className="title">
            <span>Who</span> Can Use RFP AI?
          </h2>
          <p className="subtitle">
            From freelancers to enterprises — RFP AI adapts to your workflow and delivers speed,
            accuracy, and brilliance.
          </p>
        </div>

        <Row>
          {useCases.map((useCase, i) => (
            <Col key={i} lg={4} md={6} className="mb-4">
              <div className="usecase-card" data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="icon">{useCase.icon}</div>
                <h5>{useCase.title}</h5>
                <p>{useCase.desc}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default UseCases;
