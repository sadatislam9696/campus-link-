import { useContext } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUser,
  FiUsers,
  FiBookOpen,
  FiMessageSquare,
  FiAward,
  FiMic,
  FiPackage,
  FiSend,
  FiBell,
  FiSearch,
  FiShield,
  FiHelpCircle,
  FiSettings,
} from "react-icons/fi";

import { AuthContext } from "../../context/AuthContext";
import "./Sidebar.css";

// Grouped so the nav reads as a product with sections rather than one long
// undifferentiated list of twelve links.
const sections = [
  {
    heading: "Campus",
    links: [
      { to: "/dashboard", label: "Feed", icon: FiHome },
      { to: "/profile", label: "My Profile", icon: FiUser },
      { to: "/friends", label: "Friends", icon: FiUsers },
      { to: "/search", label: "Search", icon: FiSearch },
    ],
  },
  {
    heading: "Community",
    links: [
      { to: "/groups", label: "Groups & Clubs", icon: FiBookOpen },
      { to: "/teams", label: "Teams", icon: FiAward },
      { to: "/discussions", label: "Discussions", icon: FiMessageSquare },
      { to: "/confessions", label: "Confessions", icon: FiMic },
      { to: "/lost-found", label: "Lost & Found", icon: FiPackage },
    ],
  },
  {
    heading: "Academics",
    links: [
      { to: "/academics", label: "Notes & Events", icon: FiBookOpen },
    ],
  },
  {
    heading: "Inbox",
    links: [
      { to: "/chat", label: "Messages", icon: FiSend },
      { to: "/notifications", label: "Notifications", icon: FiBell },
    ],
  },
];

function Sidebar({ onNavigate }) {
  const { user } = useContext(AuthContext);

  // "My Profile" is the only link whose target depends on who's signed in.
  const resolve = (to) =>
    to === "/profile" && user ? `/profile/${user.username}` : to;

  const renderLink = ({ to, label, icon: Icon }) => (
    <NavLink
      key={label}
      to={resolve(to)}
      className={({ isActive }) =>
        `sidebar-link${isActive ? " active" : ""}`
      }
      onClick={onNavigate}
    >
      <Icon className="sidebar-link-icon" aria-hidden="true" />
      <span className="sidebar-link-label">{label}</span>
    </NavLink>
  );

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {sections.map((section) => (
        <div className="sidebar-section" key={section.heading}>
          <p className="sidebar-heading">{section.heading}</p>
          {section.links.map(renderLink)}
        </div>
      ))}

      <div className="sidebar-section">
        <p className="sidebar-heading">Account</p>

        {renderLink({ to: "/settings", label: "Settings", icon: FiSettings })}
        {renderLink({ to: "/help", label: "Help & Support", icon: FiHelpCircle })}

        {user?.role === "admin" &&
          renderLink({ to: "/admin", label: "Admin Panel", icon: FiShield })}
      </div>

      <p className="sidebar-footnote">
        CampusLink &copy; {new Date().getFullYear()}
      </p>
    </nav>
  );
}

export default Sidebar;
