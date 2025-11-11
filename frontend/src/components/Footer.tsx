import { FaLinkedin, FaGithub, FaTwitter, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
      <div className="footer__glow"></div>
      <div className="footer__content">
        <div className="footer__brand">
          <a href="#" className="footer__logo brand__logo">
            <div className="logo">
              RFP<span>AI</span>
            </div>
          </a>
          <p className="footer__desc">
            Revolutionizing proposal creation with AI-powered precision and
            human-like understanding.
          </p>
        </div>
        <ul className="footer__links">
          <li><a href="#home">Home</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <div className="footer__socials">
          <a href="https://linkedin.com" target="_blank" rel="noreferrer">
            <FaLinkedin />
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            <FaGithub />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer">
            <FaTwitter />
          </a>
          <a href="mailto:contact@rfpai.com">
            <FaEnvelope />
          </a>
        </div>
      </div>

      <div className="footer__bottom">
        © {new Date().getFullYear()} RFP-AI. All rights reserved.  
        <span>Built with ❤️ by BB</span>
      </div>

        </div>
    </footer>
  );
};

export default Footer;
