//
// EditProfile
//

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const EditProfile: React.FC = () => {
  const { user, initialized, updateUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [designation, setDesignation] = useState("");


  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setStatus(user.status || "");
      setIsBusy(user.isBusy || false);
      setAvatarPreview(user.avatar || "");
      setDesignation(user.designation || "");
    }
  }, [user?.id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatar(file);
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    setAvatarPreview(user?.avatar || "");
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("status", status);
      formData.append("isBusy", String(isBusy));
      formData.append("designation", designation);
      if (avatar) formData.append("avatar", avatar);

      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/users/${user.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();

      const updatedUserData = {
        ...user,
        name,
        email,
        status,
        isBusy,
        designation,
        avatar: data.user?.avatar || user.avatar,
        updatedAt: new Date().toISOString(),
      };

      updateUser(updatedUserData);
      localStorage.setItem("user", JSON.stringify(updatedUserData));
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while saving profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setStatus(user.status || "");
      setIsBusy(user.isBusy || false);
      setAvatar(null);
      setAvatarPreview(user.avatar || "");
      setDesignation(user.designation || "");
    }
  };

  if (!initialized) return <div>Loading user info...</div>;
  if (!user) return <div>No user found. Please login.</div>;

  return (
    <div className="edit-profile">
      <h2 className="edit-profile__title">Edit Profile</h2>

      <div className="edit-profile__section">
        <h5>Avatar</h5>
        <div className="edit-profile__avatar">
          {avatarPreview ? (
            <img
              src={
                avatarPreview.startsWith("blob:")
                  ? avatarPreview
                  : avatarPreview.startsWith("http")
                  ? avatarPreview
                  : avatarPreview.startsWith("/uploads/")
                  ? `${BASE_URL}${avatarPreview}`
                  : `${BASE_URL}/uploads/${avatarPreview}`
              }
              alt="Avatar Preview"
              className="edit-profile__avatar-img"
            />
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

      <div className="edit-profile__field">
        <h5>Name</h5>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="edit-profile__field">
        <h5>Email</h5>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="edit-profile__field">
        <h5>Designation</h5>
        <input
          type="text"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          disabled={loading}
        />
      </div>


      <div className="edit-profile__field">
        <h5>Status</h5>
        <input
          type="text"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={loading}
        />
      </div>

      <label className="edit-profile__checkbox">
        <input
          type="checkbox"
          checked={isBusy}
          onChange={(e) => setIsBusy(e.target.checked)}
          disabled={loading}
        />
        <span>Set yourself as busy</span>
      </label>

      <div className="edit-profile__actions">
        <button className="btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Update Profile"}
        </button>
        <button className="btn-secondary" onClick={handleCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditProfile;