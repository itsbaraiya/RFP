// EditProfile.tsx
import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth, getAvatarURL } from "../context/AuthContext";

const EditProfile: React.FC = () => {
  const { user, initialized, updateUser } = useAuth();
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

  // Initialize form fields
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setStatus(user.status ?? "");
      setDesignation(user.designation ?? "");
      setIsBusy(user.isBusy ?? false);
      setAvatarPreview(user.avatar ?? "");
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

      const res = await api.put(`/users/${user.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

     const updatedUserData = {
      ...user,
      ...res.data.user,
      avatar: getAvatarURL(res.data.user.avatar),
      designation: res.data.user.designation || "",
      updatedAt: new Date().toISOString(),
    };
    updateUser(updatedUserData);


      updateUser(updatedUserData);
      localStorage.setItem("user", JSON.stringify(updatedUserData));

      showToastMessage("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      showToastMessage("Error updating profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setStatus(user.status ?? "");
      setDesignation(user.designation ?? "");
      setIsBusy(user.isBusy ?? false);
      setAvatar(null);
      setAvatarPreview(user.avatar ? getAvatarURL(user.avatar) : "");
    }
  };

  if (!initialized)
    return (
      <div className="loading text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  if (!user) return <div>No user found. Please login.</div>;

  return (
    <div className="edit-profile">
      <h2 className="edit-profile__title">Edit Profile</h2>

      {/* Avatar Section */}
      <div className="edit-profile__section">
        <h5>Avatar</h5>
        <div className="edit-profile__avatar">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar Preview" width={100} />         
          ) : (
            <div className="edit-profile__avatar-placeholder">No image</div>
          )}
          <div className="edit-profile__avatar-actions">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={loading}
            />
            {avatar && (
              <button
                className="btn-remove"
                onClick={handleRemoveAvatar}
                disabled={loading}
              >
                Remove selected
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="edit-profile__field">
        <h5>Name</h5>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Email */}
      <div className="edit-profile__field">
        <h5>Email</h5>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Designation */}
      <div className="edit-profile__field">
        <h5>Designation</h5>
        <input
          type="text"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Status */}
      <div className="edit-profile__field">
        <h5>Status</h5>
        <input
          type="text"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Busy Checkbox */}
      <label className="edit-profile__checkbox">
        <input
          type="checkbox"
          checked={isBusy}
          onChange={(e) => setIsBusy(e.target.checked)}
          disabled={loading}
        />
        <span>Set yourself as busy</span>
      </label>

      {/* Buttons */}
      <div className="edit-profile__actions">
        <button className="btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Update Profile"}
        </button>
        <button className="btn-secondary" onClick={handleCancel} disabled={loading}>
          Cancel
        </button>
      </div>

      {/* Custom Toast */}
      {showToast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "limegreen",
            color: "white",
            fontWeight: 600,
            padding: "15px 20px",
            borderRadius: "10px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            zIndex: 9999,
            transition: "all 0.3s ease",
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default EditProfile;
