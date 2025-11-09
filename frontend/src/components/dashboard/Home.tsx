// 
// Dashboard Home 
// 

import { Edit, Facebook, Instagram, Linkedin, Github } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Home = () => {
    const { user, initialized } = useAuth();
    const BASE_URL = import.meta.env.VITE_BASE_URL;
  
    if (!initialized) return <div className="loading">Loading user data...</div>;
    if (!user) return <div className="no-user">No user found. Please log in.</div>;
    return (
        <div className="profile">        
                <div className="row">
                    <div className="col-xl-8">
                        <div className="profile__header">
                            <div className="profile__banner">
                            <button className="profile__edit-btn">
                                <Edit size={16} /> Edit
                            </button>
                            </div>

                            <div className="profile__info">
                            <div className="profile__avatar">
                            <img
                                key={user.avatar}
                                src={
                                    user.avatar
                                    ? user.avatar.startsWith("http")
                                        ? `${user.avatar}?v=${user.updatedAt || Date.now()}`
                                        : `${BASE_URL}${user.avatar}?v=${user.updatedAt || Date.now()}`
                                    : "https://via.placeholder.com/100"
                                }
                                alt={user.name}
                                />
                            </div>

                            <div className="profile__details">
                                <h2>{user.name || "Unnamed User"}</h2>
                                <p>{user.designation || "User"}</p>
                            </div>

                            <div className="profile__actions">
                                <button className="btn-primary">Follow</button>
                                <button className="btn-outline">Contact</button>
                            </div>
                            </div>

                            <div className="profile__stats">
                            <div className="stat-card">
                                <p className="value">248</p>
                                <p className="label">Projects</p>
                            </div>
                            <div className="stat-card green">
                                <p className="value">5,200</p>
                                <p className="label">& Earnings</p>
                            </div>
                            <div className="stat-card red">
                                <p className="value">20%</p>
                                <p className="label">% Rate</p>
                            </div>
                            </div>
                            <div className="row">
                                <div className="col-xl-8">

                                </div>
                                <div className="col-xl-4">
                                    <div className="profile__progress">
                                    <div className="label">
                                        <span>Progress</span>
                                        <span>75%</span>
                                    </div>
                                    <div className="bar">
                                        <div className="fill" style={{ width: "75%" }}></div>
                                    </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="col-xl-4">                        
                        <div className="profile__content">                            
                            <div className="profile__bio">
                            <h3>Biography</h3>
                            <p>
                                My name is Yatin Sharma. I am a frontend developer and I can do
                                anything in the software field.
                            </p>
                            <ul>
                                <li>📍 Rama Krishna Purum Kota</li>
                                <li>🎂 December 21, 2001</li>
                                <li>🏢 W3ITExperts – Software Company</li>
                            </ul>
                            </div>                            
                            <div className="profile__sidebar">
                            <div className="sidebar-block">
                                <h4>Social</h4>
                                <div className="icons">
                                <Facebook />
                                <Instagram />
                                <Linkedin />
                                <Github />
                                </div>
                            </div>

                            <div className="sidebar-block">
                                <h4>Skills</h4>
                                <div className="tags">
                                {["HTML", "CSS", "React", "Tailwind", "Next.js", "Node.js"].map(
                                    (skill) => (
                                    <span key={skill}>{skill}</span>
                                    )
                                )}
                                </div>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>        
        </div>
    );
};

export default Home;
