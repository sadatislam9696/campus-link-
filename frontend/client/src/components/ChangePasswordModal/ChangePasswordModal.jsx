import { useState } from "react";

import { changePassword } from "../../services/authService";

function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    setError("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    setSaving(true);

    try {
      await changePassword(currentPassword, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <h2>Change Password</h2>

        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}

        {done ? (
          <>
            <p className="auth-success" style={{ marginTop: 14 }}>
              Password changed successfully.
            </p>
            <div className="edit-profile-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>Close</button>
            </div>
          </>
        ) : (
          <>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
              Current Password
            </label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
              New Password
            </label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, margin: "14px 0 6px" }}>
              Confirm New Password
            </label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="edit-profile-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : "Change Password"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ChangePasswordModal;
