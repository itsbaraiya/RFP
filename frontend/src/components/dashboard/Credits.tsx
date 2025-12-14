import { CreditCard } from "lucide-react";

const Credits = () => {
  return (
    <div className="credits-page">
        <div className="section-header">
            <div className="section-header__title">
                <CreditCard size={40} />
                <h1>Credits & Billing</h1>
            </div>
            <p className="section-header__subtitle">
                Manage your credits, plans, and payment history.
            </p>
        </div>
      {/* TOP SECTION */}
      <div className="credits-page__top">

        {/* Balance Card */}
        <div className="credits-page__balance">
          <p className="credits-page__balance-label">Current Balance</p>
          <h2 className="credits-page__balance-amount">1,250</h2>
          <span className="credits-page__balance-sub">Credits Available</span>
        </div>

        {/* Starter Plan */}
        <div className="credits-page__plan">
          <h4 className="credits-page__plan-title">Starter Pack</h4>
          <div className="credits-page__plan-price">$9.99</div>
          <p className="credits-page__plan-credits">1,000 Credits</p>

          <ul className="credits-page__plan-features">
            <li>Access to basic features</li>
            <li>Standard support</li>
            <li>Up to 10 generations/day</li>
          </ul>

          <button className="credits-page__plan-btn">
            Select Package
          </button>
        </div>

        {/* Pro Plan (Recommended) */}
        <div className="credits-page__plan credits-page__plan--recommended">
          <h4 className="credits-page__plan-title">Pro Pack</h4>
          <div className="credits-page__plan-price">$29.99</div>
          <p className="credits-page__plan-credits">5,000 Credits</p>

          <ul className="credits-page__plan-features">
            <li>All Starter features</li>
            <li>Unlimited generations</li>
            <li>Advanced analytics</li>
          </ul>

          <button className="credits-page__plan-btn">
            Select Package
          </button>
        </div>

        {/* Premium Plan */}
        <div className="credits-page__plan">
          <h4 className="credits-page__plan-title">Premium Bundle</h4>
          <div className="credits-page__plan-price">$59.99</div>
          <p className="credits-page__plan-credits">12,000 Credits</p>

          <ul className="credits-page__plan-features">
            <li>All Pro features</li>
            <li>Dedicated account manager</li>
            <li>Custom integrations</li>
          </ul>

          <button className="credits-page__plan-btn">
            Select Package
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="credits-page__plan">
          <h4 className="credits-page__plan-title">Enterprise Solution</h4>
          <div className="credits-page__plan-price">$199.99</div>
          <p className="credits-page__plan-credits">50,000 Credits</p>

          <ul className="credits-page__plan-features">
            <li>All Premium features</li>
            <li>SLA guaranteed uptime</li>
            <li>24/7 technical support</li>
          </ul>

          <button className="credits-page__plan-btn">
            Select Package
          </button>
        </div>

      </div>

      {/* BOTTOM SECTION */}
      <div className="credits-page__bottom">

        {/* Payment */}
        <div className="credits-page__payment">
          <h3 className="credits-page__payment-title">Secure Payment</h3>
          <p className="credits-page__payment-sub">
            All transactions are securely processed via Stripe.
          </p>

          <input
            className="credits-page__payment-input"
            placeholder="Card Number"
          />

          <div className="credits-page__payment-row">
            <input
              className="credits-page__payment-input"
              placeholder="MM / YY"
            />
            <input
              className="credits-page__payment-input"
              placeholder="CVC"
            />
          </div>

          <input
            className="credits-page__payment-input"
            placeholder="Email Address"
          />

          <button className="credits-page__payment-btn">
            Purchase Credits
          </button>
        </div>

        {/* Transactions */}
        <div className="credits-page__transactions">
          <h3 className="credits-page__transactions-title">
            Recent Transactions
          </h3>

          <ul className="credits-page__transactions-list">
            <li className="credits-page__transactions-list-item">
              <span>Pro Plan Purchase</span>
              <span className="credits-page__transactions-list-item--success">
                +$29.99
              </span>
            </li>

            <li className="credits-page__transactions-list-item">
              <span>1000 Credits Pack</span>
              <span className="credits-page__transactions-list-item--success">
                +$9.99
              </span>
            </li>

            <li className="credits-page__transactions-list-item">
              <span>Subscription Renewal</span>
              <span className="credits-page__transactions-list-item--success">
                +$29.99
              </span>
            </li>

            <li className="credits-page__transactions-list-item">
              <span>Refund</span>
              <span className="credits-page__transactions-list-item--success">
                -$0.50
              </span>
            </li>

            <li className="credits-page__transactions-list-item">
              <span>Pending Credit Purchase</span>
              <span className="credits-page__transactions-list-item--pending">
                +$9.99
              </span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Credits;
