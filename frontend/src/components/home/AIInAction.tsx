import React, { useEffect, useState, useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

const AIInAction: React.FC = () => {
  const fullText = `
Analyzing RFP requirements...
Understanding client's needs...
Generating proposal outline...
Finalizing structure and tone...
✅ Proposal ready in seconds.
  `;

  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + fullText.charAt(index));
        setIndex(index + 1);
      }, 35);
      return () => clearTimeout(timeout);
    }
  }, [index]);

  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  return (
    <section className="ai-action-section">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: "transparent" },
          fpsLimit: 60,
          particles: {
            number: { value: 100, density: { enable: true, area: 800 } },
            color: { value: ["#6a11cb", "#2575fc", "#00fff2"] },
            shape: { type: "circle" },
            opacity: { value: 0.6 },
            size: { value: { min: 1, max: 3 } },
            move: {
              enable: true,
              speed: 1,
              direction: "none",
              outModes: { default: "out" },
            },
            links: {
              enable: true,
              distance: 120,
              color: "#5f6fff",
              opacity: 0.3,
              width: 1,
            },
          },
          detectRetina: true,
        }}
      />

      <div className="ai-content text-center text-white">
        <h2 className="section-title">
          Watch <span>AI</span> in Action
        </h2>
        <p className="section-subtitle">
          See how <strong>RFP-AI</strong> analyzes, understands, and writes proposals with human-like intelligence.
        </p>

        <div className="terminal-card">
          <div className="terminal-header">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <pre className="terminal-body">
            {displayText}
            <span className="cursor">|</span>
          </pre>
        </div>
      </div>
    </section>
  );
};

export default AIInAction;
