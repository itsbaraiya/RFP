import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { FaBolt, FaBrain, FaRocket, FaShieldAlt } from "react-icons/fa";
import "aos/dist/aos.css";
import AOS from "aos";

const WhyChoose: React.FC = () => {
  React.useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <section className="why-choose-section">
      <Container>
        <Row className="align-items-center">
            <Col md={6} className="text-side" data-aos="fade-left">
            <h2 className="section-title">
              Why <span>Choose</span> RFP-AI?
            </h2>
            <p className="section-subtitle">
              Experience the next generation of AI-powered RFP writing with speed, precision, and human-like creativity.
            </p>

            <ul className="why-list">
              <li>
                <FaBolt className="icon" /> Generates proposals instantly
              </li>
              <li>
                <FaBrain className="icon" /> Understands context deeply
              </li>
              <li>
                <FaRocket className="icon" /> Boosts your efficiency 10x
              </li>
              <li>
                <FaShieldAlt className="icon" /> Keeps your data 100% secure
              </li>
            </ul>
          </Col>
          <Col md={6} className="image-side" data-aos="fade-right">
            <div className="ai-glow-circle"></div>
            <img
              src="/Images/why.png"
              alt="AI Illustration"
              className="ai-illustration"
            />
          </Col>          
        </Row>
      </Container>
    </section>
  );
};

export default WhyChoose;
