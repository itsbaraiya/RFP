import React from "react";

const CreditPlans: React.FC = () => {
  const plans = [
    {
      id: 1,
      name: "Starter Plan",
      description: "Best for individuals getting started.",
      credits: 100,
      price: "$9.99/month",
    },
    {
      id: 2,
      name: "Pro Plan",
      description: "Ideal for growing teams and small businesses.",
      credits: 500,
      price: "$29.99/month",
    },
    {
      id: 3,
      name: "Enterprise Plan",
      description: "For enterprises with high-volume needs.",
      credits: 2000,
      price: "$99.99/month",
    },
  ];

  return (
    <div className="credit-plans p-4">
      <h2 className="mb-4 text-xl font-semibold">Credit Plans</h2>
      <div className="plans-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="plan-card border p-4 rounded-xl shadow-sm hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
            <p className="text-sm mb-2">Credits: {plan.credits}</p>
            <p className="text-base font-bold">{plan.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreditPlans;
