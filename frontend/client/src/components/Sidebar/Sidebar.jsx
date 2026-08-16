import { useContext } from "react";
import { Link } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import "./Sidebar.css";

const links = [
  { to: "/dashboard", label: "Feed", icon: "🏠" },
  { to: "/profile", label: "My Profile", icon: "👤" },
  { to: "/friends", label: "Friends", icon: "👥" },
  { to: "/groups", label: "Groups & Clubs", icon: "📚" },
  { to: "/teams", label: "Teams", icon: "🧑‍🤝‍🧑" },
  { to: "/discussions", label: "Discussions", icon: "🗣️" },
  { to: "/academics", label: "Academics", icon: "🎓" },
  { to: "/confessions", label: "Confessions & Polls", icon: "🎭" },
  { to: "/lost-found", label: "Lost & Found", icon: "🧳" },
  { to: "/chat", label: "Messages", icon: "💬" },
  { to: "/notifications", label: "Notifications", icon: "🔔" },
  { to: "/search", label: "Search", icon: "🔍" },
];

function Sidebar() {
  const { user } = useContext(AuthContext);

  return (
    <aside className="sidebar">
      <p className="sidebar-heading">Menu</p>

      {links.map((link) => (
        <Link
          key={link.label}
          to={link.to === "/profile" && user ? `/profile/${user.username}` : link.to}
          className="sidebar-link"
        >
          <span className="sidebar-link-icon">{link.icon}</span>
          {link.label}
        </Link>
      ))}

      {user?.role === "admin" && (
        <Link to="/admin" className="sidebar-link">
          <span className="sidebar-link-icon">🛠</span>
          Admin Panel
        </Link>
      )}
    </aside>
  );
}

export default Sidebar;
