import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
import { getMyProfile, updateSettings } from "../../services/profileService";
import ChangePasswordModal from "../../components/ChangePasswordModal/ChangePasswordModal";

import MainLayout from "../../layouts/MainLayout";
import { LoadingState } from "../../components/States/States";
import "./Settings.css";

function Toggle({ checked, onChange, disabled }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className="toggle-slider" />
    </label>
  );
}

function Settings() {
  const { user, logout } = useContext(AuthContext);
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoPlayVideos: true,
    profileVisibility: "public",
  });
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyProfile();
        if (data.user.settings) setSettings(data.user.settings);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
     
    load();
  }, []);

  const handleToggle = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await updateSettings({ [key]: updated[key] });
    } catch (error) {
      console.error(error);
      setSettings(settings); // revert on failure
    }
  };

  const handleVisibility = async (value) => {
    const updated = { ...settings, profileVisibility: value };
    setSettings(updated);
    try {
      await updateSettings({ profileVisibility: value });
    } catch (error) {
      console.error(error);
    }
  };

  // ThemeProvider.setDarkMode applies the theme instantly and persists it,
  // so this is just the toggle handler.
  const handleDarkModeToggle = () => setDarkMode(!darkMode);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <MainLayout>
        <LoadingState label="Loading settings..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-shell">
        <h1 className="feed-heading">Settings</h1>

        <div className="settings-section">
          <h2>Account</h2>
          <div className="card" style={{ padding: 0 }}>
            <Link to={`/profile/${user.username}`} className="settings-link-row">
              👤 Edit Profile
              <span className="settings-link-arrow">›</span>
            </Link>
            <div className="settings-link-row" onClick={() => setShowChangePassword(true)}>
              🔒 Change Password
              <span className="settings-link-arrow">›</span>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">👁️ Profile Visibility</div>
                <div className="settings-row-desc">Who can view your full profile</div>
              </div>
              <select
                className="input"
                style={{ width: "auto" }}
                value={settings.profileVisibility}
                onChange={(e) => handleVisibility(e.target.value)}
              >
                <option value="public">Everyone</option>
                <option value="friends">Friends only</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Preferences</h2>
          <div className="card" style={{ padding: 0 }}>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">🔔 Email Notifications</div>
                <div className="settings-row-desc">Receive updates and alerts by email</div>
              </div>
              <Toggle checked={settings.emailNotifications} onChange={() => handleToggle("emailNotifications")} />
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">▶️ Auto-play Videos</div>
                <div className="settings-row-desc">Videos play automatically in the feed</div>
              </div>
              <Toggle checked={settings.autoPlayVideos} onChange={() => handleToggle("autoPlayVideos")} />
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">🌙 Dark Mode</div>
                <div className="settings-row-desc">Easier on the eyes at night</div>
              </div>
              <Toggle checked={darkMode} onChange={handleDarkModeToggle} />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Support</h2>
          <div className="card" style={{ padding: 0 }}>
            <Link to="/help" className="settings-link-row">
              ❓ Help &amp; Support
              <span className="settings-link-arrow">›</span>
            </Link>
            <Link to="/terms" className="settings-link-row">
              📄 Terms &amp; Privacy
              <span className="settings-link-arrow">›</span>
            </Link>
          </div>
        </div>

        <button type="button" className="btn btn-danger" style={{ width: "100%" }} onClick={handleLogout}>
          Log Out
        </button>
      </div>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </MainLayout>
  );
}

export default Settings;
