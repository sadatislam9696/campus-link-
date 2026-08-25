import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiUsers, FiSend, FiBell, FiUser } from "react-icons/fi";

import { AuthContext } from "../../context/AuthContext";
import "./MobileNav.css";

/**
 * Bottom tab bar shown only on small screens. Carries the five destinations
 * students hit most; everything else lives in the drawer behind the navbar
 * hamburger.
 */
function MobileNav() {
  const { user } = useContext(AuthContext);

  const tabs = [
    { to: "/dashboard", label: "Feed", icon: FiHome },
    { to: "/friends", label: "Friends", icon: FiUsers },
    { to: "/chat", label: "Chat", icon: FiSend },
    { to: "/notifications", label: "Alerts", icon: FiBell },
    {
      to: user ? `/profile/${user.username}` : "/login",
      label: "Profile",
      icon: FiUser,
    },
  ];

  return (
    <nav className="mobile-nav" aria-label="Primary">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={label}
          to={to}
          className={({ isActive }) =>
            `mobile-nav-tab${isActive ? " active" : ""}`
          }
        >
          <Icon className="mobile-nav-icon" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileNav;
