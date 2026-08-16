import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { getUnreadCount } from "../../services/notificationService";
import { API_URL } from "../../config";
import "./Navbar.css";

const POLL_INTERVAL_MS = 30000;

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [query, setQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await getUnreadCount();
        if (!cancelled) setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error(error);
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "";

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <span className="navbar-brand-mark">CL</span>
        <span className="navbar-brand-text">CampusLink</span>
      </Link>

      <div className="navbar-search">
        <form onSubmit={handleSearch}>
          <span className="navbar-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search people, skills, posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="navbar-links">
        <Link to="/dashboard" className="navbar-link">
          Feed
        </Link>

        <Link to="/friends" className="navbar-link">
          Friends
        </Link>

        {user && (
          <button
            type="button"
            className="navbar-bell"
            onClick={() => navigate("/notifications")}
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="navbar-bell-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        )}

        {user && (
          <div className="navbar-user">
            <Link
              to={`/profile/${user.username}`}
              className="avatar"
              style={{ width: 34, height: 34, fontSize: "0.8rem" }}
            >
              {user.avatar ? (
                <img
                  src={`${API_URL}${user.avatar}`}
                  alt={user.username}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                initials
              )}
            </Link>

            <span className="navbar-user-name">{user.firstName}</span>

            <Link to="/settings" className="navbar-bell" aria-label="Settings">
              ⚙️
            </Link>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
