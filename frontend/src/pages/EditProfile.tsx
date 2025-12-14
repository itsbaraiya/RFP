// EditProfile.tsx
import { useState, useEffect } from "react";
import {
  User,
  Bell,
  Sliders,
  CreditCard,
  Shield,
} from "lucide-react";
import api from "../api/axios";
import { useAuth, getAvatarURL } from "../context/AuthContext";

type SettingsTab =
  | "profile"
  | "notifications"
  | "preferences"
  | "subscription"
  | "privacy";

const EditProfile: React.FC = () => {
  const { user, initialized, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // ---------------- EXISTING STATE (UNCHANGED) ----------------
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [designation, setDesignation] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setStatus(user.status ?? "");
      setDesignation(user.designation ?? "");
      setIsBusy(user.isBusy ?? false);
      setAvatarPreview(getAvatarURL(user.avatar));
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatar(file);
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    setAvatarPreview(getAvatarURL(user?.avatar));
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("status", status);
      formData.append("designation", designation);
      formData.append("isBusy", String(isBusy));
      if (avatar) formData.append("avatar", avatar);

      const res = await api.put(`/users/${user.id}`, formData);
      const updatedUserData = {
        ...user,
        ...res.data.user,
        avatar: getAvatarURL(res.data.user.avatar),
      };

      updateUser(updatedUserData);
      localStorage.setItem("user", JSON.stringify(updatedUserData));
      showToastMessage("Profile updated successfully!");
    } catch {
      showToastMessage("Error updating profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setStatus(user.status ?? "");
    setDesignation(user.designation ?? "");
    setIsBusy(user.isBusy ?? false);
    setAvatar(null);
    setAvatarPreview(getAvatarURL(user.avatar));
  };

  if (!initialized || !user) return null;

  const renderHeader = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="section-header">
            <div className="section-header__title">
              <User size={22} />
              <h1>Profile Information</h1>
            </div>
            <p className="section-header__subtitle">
              Update your personal details and manage your account.
            </p>
          </div>
        );
      case "notifications":
        return (
          <div className="section-header">
            <div className="section-header__title">
              <Bell size={22} />
              <h1>Notification Settings</h1>
            </div>
            <p className="section-header__subtitle">
              Control how and when you receive notifications.
            </p>
          </div>
        );
      case "preferences":
        return (
          <div className="section-header">
            <div className="section-header__title">
              <Sliders size={22} />
              <h1>App Preferences</h1>
            </div>
            <p className="section-header__subtitle">
              Customize your workspace and experience.
            </p>
          </div>
        );
      case "subscription":
        return (
          <div className="section-header">
            <div className="section-header__title">
              <CreditCard size={22} />
              <h1>Subscription & Billing</h1>
            </div>
            <p className="section-header__subtitle">
              Manage your plan, usage, and invoices.
            </p>
          </div>
        );
      case "privacy":
        return (
          <div className="section-header">
            <div className="section-header__title">
              <Shield size={22} />
              <h1>Data & Privacy</h1>
            </div>
            <p className="section-header__subtitle">
              Control your data, privacy, and security settings.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="account-settings">
      {/* Top Tabs */}
      <div className="account-settings__tabs">
        {[
          ["profile", "Profile"],
          ["notifications", "Notifications"],
          ["preferences", "App Preferences"],
          ["subscription", "Subscription"],
          ["privacy", "Data & Privacy"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`account-settings__tab ${
              activeTab === key ? "active" : ""
            }`}
            onClick={() => setActiveTab(key as SettingsTab)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Section Header */}
      {renderHeader()}

      {/* Content */}
      {activeTab === "profile" && (
        <div className="account-settings__content">
          {/* ---- YOUR EXISTING FORM (UNCHANGED) ---- */}
          {/* Avatar */}
          <div className="edit-profile__section">
            <h5>Avatar</h5>
            <div className="edit-profile__avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar"  width={100} />
              ) : (
                <div className="edit-profile__avatar-placeholder">No image</div>
              )}
              <input type="file" onChange={handleAvatarChange} />
              {avatar && (
                <button onClick={handleRemoveAvatar}>Remove selected</button>
              )}
            </div>
          </div>

          <div className="edit-profile__field">
            <h5>Name</h5>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="edit-profile__field">
            <h5>Email</h5>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="edit-profile__field">
            <h5>Designation</h5>
            <input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </div>

          <div className="edit-profile__field">
            <h5>Status</h5>
            <input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>

          <label className="edit-profile__checkbox">
            <input
              type="checkbox"
              checked={isBusy}
              onChange={(e) => setIsBusy(e.target.checked)}
            />
            Set yourself as busy
          </label>

          <div className="edit-profile__actions">
            <button className="btn-primary" disabled={loading} onClick={handleSave}>{loading ? "Saving..." : "Save Profile"}</button>
            <button className="btn-secondary" disabled={loading} onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      )}

      {showToast && <div className="toast-success">{toastMessage}</div>}
    </div>
  );
};

export default EditProfile;
