import { Container, Row, Col, Button } from "react-bootstrap";

const LandingSection = () => {
  return (
    <section className="landing-section d-flex align-items-center">
      <Container>
        <Row className="align-items-center">
          <Col md={6} data-aos="fade-right">
            <h1 className="landing-title">
              Your Next <span>RFP</span>, 
             <br /> Written by <span>AI</span>
            </h1>
            <p className="landing-subtitle">
              Turn complex RFPs into polished, professional proposals in minutes.
              Let AI handle the heavy lifting while you focus on winning.
            </p>
            <div className="landing-buttons mt-4">
              <Button variant="primary" size="lg" className="me-3">
                Generate Proposal
              </Button>
              <Button variant="outline-light" size="lg">
                Watch Demo
              </Button>
            </div>
          </Col>

          <Col md={6} className="text-center mt-5 mt-md-0" data-aos="fade-left">
            <div className="ai-glow">
              <img
                src="/Images/ai-illustration.jpg"
                alt="AI Illustration"
                className="img-fluid glowing-img"
              />
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default LandingSection;
