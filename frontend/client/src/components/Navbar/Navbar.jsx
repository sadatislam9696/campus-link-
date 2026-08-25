import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiSearch,
  FiBell,
  FiSettings,
  FiLogOut,
  FiUser,
  FiMoon,
  FiSun,
  FiChevronDown,
  FiX,
} from "react-icons/fi";

import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
import { getUnreadCount } from "../../services/notificationService";
import { API_URL } from "../../config";
import "./Navbar.css";

const POLL_INTERVAL_MS = 30000;

function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { darkMode, setDarkMode } = useContext(ThemeContext) || {};

  const [query, setQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await getUnreadCount();
        if (!cancelled) setUnreadCount(data.unreadCount);
      } catch {
        // A failed badge poll is not worth surfacing to the user or
        // spamming the console with - the next tick will retry.
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  // Close the account dropdown on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "";

  const avatar = (size) => (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {user?.avatar ? (
        <img src={`${API_URL}${user.avatar}`} alt="" />
      ) : (
        initials
      )}
    </span>
  );

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button
          type="button"
          className="navbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <FiMenu />
        </button>

        <Link to={user ? "/dashboard" : "/"} className="navbar-brand">
          <span className="navbar-brand-mark">CL</span>
          <span className="navbar-brand-text">CampusLink</span>
        </Link>

        <div className={`navbar-search${searchOpen ? " open" : ""}`}>
          <form onSubmit={handleSearch} role="search">
            <FiSearch className="navbar-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="navbar-search-input"
              placeholder="Search people, skills, posts..."
              aria-label="Search CampusLink"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <button
            type="button"
            className="navbar-search-close"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
          >
            <FiX />
          </button>
        </div>

        <div className="navbar-actions">
          <button
            type="button"
            className="btn-icon navbar-search-toggle"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <FiSearch />
          </button>

          {setDarkMode && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
              title={darkMode ? "Light mode" : "Dark mode"}
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
          )}

          {user && (
            <Link
              to="/notifications"
              className="btn-icon navbar-bell"
              aria-label={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : "Notifications"
              }
            >
              <FiBell />
              {unreadCount > 0 && (
                <span className="navbar-bell-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {user && (
            <div className="navbar-user" ref={menuRef}>
              <button
                type="button"
                className="navbar-user-trigger"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {avatar(34)}
                <span className="navbar-user-name">{user.firstName}</span>
                <FiChevronDown className="navbar-user-caret" aria-hidden="true" />
              </button>

              {menuOpen && (
                <div className="navbar-menu" role="menu">
                  <div className="navbar-menu-head">
                    {avatar(40)}
                    <div className="navbar-menu-head-text">
                      <strong>
                        {user.firstName} {user.lastName}
                      </strong>
                      <span>@{user.username}</span>
                    </div>
                  </div>

                  <hr className="divider" style={{ margin: "8px 0" }} />

                  <Link
                    to={`/profile/${user.username}`}
                    className="navbar-menu-item"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <FiUser aria-hidden="true" /> My Profile
                  </Link>

                  <Link
                    to="/settings"
                    className="navbar-menu-item"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <FiSettings aria-hidden="true" /> Settings
                  </Link>

                  <button
                    type="button"
                    className="navbar-menu-item danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <FiLogOut aria-hidden="true" /> Log out
                  </button>
                </div>
              )}
            </div>
          )}

          {!user && (
            <div className="navbar-auth">
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
