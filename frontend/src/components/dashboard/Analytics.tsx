import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";

  import { useAuth } from "../../context/AuthContext";
  
  const Analytics = () => {
    const { user } = useAuth();
  
    if (!user) return <p>Loading user data...</p>;
  
    const role = user.role;
  
    // --- Static Data ---
    const userGrowthData = [
      { month: "Jan", users: 120 },
      { month: "Feb", users: 180 },
      { month: "Mar", users: 250 },
      { month: "Apr", users: 300 },
      { month: "May", users: 420 },
      { month: "Jun", users: 520 },
      { month: "Jul", users: 700 },
      { month: "Aug", users: 880 },
      { month: "Sep", users: 950 },
      { month: "Oct", users: 1020 },
    ];
  
    return (
      <div className="analytics">
        <h2 className="mb-4">Analytics & Reporting</h2>
  
        {role === "ADMIN" && (
          <>
            <section className="analytics-section">
              <h3>High-Level Metrics</h3>
              <div className="grid grid-4">
                <div className="card">
                  <h4>Total Credits Purchased</h4>
                  <p>₹2,50,000</p>
                </div>
                <div className="card">
                  <h4>Total Credits Used</h4>
                  <p>₹1,95,000</p>
                </div>
                <div className="card">
                  <h4>Avg Usage per Customer</h4>
                  <p>₹5,200</p>
                </div>
                <div className="card">
                  <h4>Revenue from Credit Sales</h4>
                  <p>₹1,25,000</p>
                </div>
              </div>
            </section>
  
            <section className="analytics-section">
              <h3>User Growth</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}
  
        {role === "CUSTOMER" && (
          <>
            <section className="analytics-section">
              <h3>Credit Usage</h3>
              <div className="grid grid-2">
                <div className="card">
                  <h4>Total Purchased</h4>
                  <p>1,200 Credits</p>
                </div>
                <div className="card">
                  <h4>Total Used</h4>
                  <p>850 Credits</p>
                </div>
              </div>
            </section>
  
            <section className="analytics-section">
              <h3>Usage Breakdown</h3>
              <ul className="list">
                <li>John Doe — 300 credits</li>
                <li>Sarah Smith — 250 credits</li>
                <li>Ravi Kumar — 200 credits</li>
                <li>Others — 100 credits</li>
              </ul>
            </section>
  
            <section className="analytics-section">
              <h3>Proposal Stats</h3>
              <div className="grid grid-2">
                <div className="card">
                  <h4>Proposals Created</h4>
                  <p>42</p>
                </div>
                <div className="card">
                  <h4>Last Created</h4>
                  <p>Oct 25, 2025</p>
                </div>
              </div>
            </section>
          </>
        )}
  
        {role === "COLLABORATOR" && (
          <section className="analytics-section">
            <h3>Contribution Summary</h3>
            <div className="card">
              <p>You’ve contributed to <strong>5 proposals</strong>.</p>
              <p>Keep it up! 🎯</p>
            </div>
          </section>
        )}
      </div>
    );
  };
  
  export default Analytics;
  