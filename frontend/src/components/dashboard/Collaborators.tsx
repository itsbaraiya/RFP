import { Users, UserCheck, UserPlus } from "lucide-react";

const Collaborators = () => {
  const collaboratorsData = [
    { name: "Amit Sharma", email: "amit@company.com", role: "Editor", status: "Active" },
    { name: "Pooja Patel", email: "pooja@company.com", role: "Reviewer", status: "Pending" },
    { name: "Rahul Singh", email: "rahul@company.com", role: "Contributor", status: "Active" },
    { name: "Neha Verma", email: "neha@company.com", role: "Reviewer", status: "Pending" },
  ];

  return (
    <div className="dashboard-page collaborators">
      {/* Section Header */}
      <div className="section-header">
        <div className="section-header__title">
          <Users size={22} />
          <h1>Team & Collaborators</h1>
        </div>
        <p className="section-header__subtitle">
          Manage access, roles, and collaboration permissions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="collaborators__stats">
        <div className="stat-card">
          <Users />
          <div>
            <h3>{collaboratorsData.length}</h3>
            <p>Total Members</p>
          </div>
        </div>
        <div className="stat-card">
          <UserCheck />
          <div>
            <h3>{collaboratorsData.filter(c => c.status === "Active").length}</h3>
            <p>Active</p>
          </div>
        </div>
        <div className="stat-card">
          <UserPlus />
          <div>
            <h3>{collaboratorsData.filter(c => c.status === "Pending").length}</h3>
            <p>Pending</p>
          </div>
        </div>
      </div>

      {/* Collaborators Table */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {collaboratorsData.map((c, i) => (
              <tr key={i}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.role}</td>
                <td>
                  <span className={`status status--${c.status.toLowerCase()}`}>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Collaborators;
