import { useRef, useState } from "react";

import { updateProfile, uploadAvatar } from "../../services/profileService";
import "./EditProfileModal.css";

import { API_URL } from "../../config";

const API_BASE = API_URL;

const academicYears = [
  "",
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Graduate",
];

function EditProfileModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    bio: user.bio || "",
    university: user.university || "",
    department: user.department || "",
    major: user.major || "",
    academicYear: user.academicYear || "",
    skills: (user.skills || []).join(", "),
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    user.avatar ? `${API_BASE}${user.avatar}` : null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarPick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    try {
      let updatedUser = null;

      if (avatarFile) {
        const avatarRes = await uploadAvatar(avatarFile);
        updatedUser = { avatar: avatarRes.avatar };
      }

      const profileRes = await updateProfile(form);

      onSaved({ ...profileRes.user, ...updatedUser });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not save changes. Try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 4 }}>Edit Profile</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem" }}>
          This is how others will see you on CampusLink.
        </p>

        {error && <p className="error-text" style={{ marginTop: 14 }}>{error}</p>}

        <div className="edit-profile-form">
          <div className="edit-profile-avatar-row" style={{ marginTop: 16 }}>
            <div className="avatar" style={{ width: 64, height: 64 }}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`
              )}
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Change photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarPick}
            />
          </div>

          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            className="input"
            rows={3}
            value={form.bio}
            onChange={handleChange}
            placeholder="Tell people a bit about yourself"
          />

          <div className="edit-profile-form-row">
            <div>
              <label htmlFor="university">University</label>
              <input
                id="university"
                name="university"
                className="input"
                value={form.university}
                onChange={handleChange}
                placeholder="e.g. BUBT"
              />
            </div>
            <div>
              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                className="input"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g. CSE"
              />
            </div>
          </div>

          <div className="edit-profile-form-row">
            <div>
              <label htmlFor="major">Major</label>
              <input
                id="major"
                name="major"
                className="input"
                value={form.major}
                onChange={handleChange}
                placeholder="e.g. Software Engineering"
              />
            </div>
            <div>
              <label htmlFor="academicYear">Academic Year</label>
              <select
                id="academicYear"
                name="academicYear"
                className="input"
                value={form.academicYear}
                onChange={handleChange}
              >
                {academicYears.map((y) => (
                  <option key={y} value={y}>
                    {y || "Select..."}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label htmlFor="skills">Skills</label>
          <input
            id="skills"
            name="skills"
            className="input"
            value={form.skills}
            onChange={handleChange}
            placeholder="React, Node.js, MongoDB (comma separated)"
          />
        </div>

        <div className="edit-profile-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <span className="spinner" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;
