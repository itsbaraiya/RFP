import { Library, FileText, Layers } from "lucide-react";

const ContentLibrary = () => {
  const libraryData = [
    { title: "IT Services Proposal", type: "Template" },
    { title: "Government RFP Cover", type: "Cover Letter" },
    { title: "Pricing Breakdown", type: "Pricing Template" },
    { title: "Execution Timeline", type: "Project Plan" },
    { title: "Marketing Proposal", type: "Template" },
    { title: "Budget Overview", type: "Spreadsheet" },
  ];

  return (
    <div className="dashboard-page content-library">
      {/* Header */}
      <div className="section-header">
        <div className="section-header__title">
          <Library size={22} />
          <h1>Content Library</h1>
        </div>
        <p className="section-header__subtitle">
          Reusable templates, snippets, and proposal assets.
        </p>
      </div>

      {/* Stats */}
      <div className="content-library__stats">
        <div className="stat-card">
          <FileText />
          <div>
            <h3>{libraryData.length}</h3>
            <p>Total Items</p>
          </div>
        </div>
        <div className="stat-card">
          <Layers />
          <div>
            <h3>3</h3>
            <p>Templates</p>
          </div>
        </div>
        <div className="stat-card">
          <Library />
          <div>
            <h3>2</h3>
            <p>Categories</p>
          </div>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="library-grid">
        {libraryData.map((item, i) => (
          <div key={i} className="library-card">
            <h4>{item.title}</h4>
            <p>{item.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentLibrary;
