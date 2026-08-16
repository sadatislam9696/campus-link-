import { useContext, useEffect, useState } from "react";

import { AuthContext } from "./AuthContext";
import { ThemeContext } from "./ThemeContext";

export const ThemeProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  // Local storage is the source of truth for "what should render right
  // now" so the theme applies instantly on load, before the profile API
  // call (which carries the authoritative, cross-device preference) has
  // a chance to resolve.
  const [darkMode, setDarkModeState] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored === "true";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  // Once we know who's logged in, adopt their saved preference (e.g. if
  // they last set it on a different device) rather than whatever this
  // browser happened to have cached.
  useEffect(() => {
    if (user?.settings?.darkMode !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDarkModeState(user.settings.darkMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setDarkMode = (value) => setDarkModeState(value);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
