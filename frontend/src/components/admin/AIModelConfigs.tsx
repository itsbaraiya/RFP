import React from "react";

const AIModelConfigs: React.FC = () => {
  const models = [
    {
      id: 1,
      name: "GPT-4",
      provider: "OpenAI",
      version: "4.0",
      status: "Active",
    },
    {
      id: 2,
      name: "Claude 3",
      provider: "Anthropic",
      version: "3.0",
      status: "Active",
    },
    {
      id: 3,
      name: "Gemini 1.5",
      provider: "Google DeepMind",
      version: "1.5",
      status: "In Development",
    },
  ];

  return (
    <div className="ai-model-configs p-4">
      <h2 className="mb-4 text-xl font-semibold">AI Model Configurations</h2>
      <div className="models-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => (
          <div
            key={model.id}
            className="model-card border p-4 rounded-xl shadow-sm hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold mb-1">{model.name}</h3>
            <p className="text-sm text-gray-600 mb-1">Provider: {model.provider}</p>
            <p className="text-sm mb-1">Version: {model.version}</p>
            <p className="text-sm font-medium">
              Status:{" "}
              <span
                className={`${
                  model.status === "Active" ? "text-green-600" : "text-yellow-600"
                }`}
              >
                {model.status}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIModelConfigs;
