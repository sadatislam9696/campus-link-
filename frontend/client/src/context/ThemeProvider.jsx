import { useCallback, useContext, useEffect, useState } from "react";

import { AuthContext } from "./AuthContext";
import { ThemeContext } from "./ThemeContext";
import { updateSettings } from "../services/profileService";

export const ThemeProvider = ({ children }) => {
  const { user, setUser } = useContext(AuthContext);

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
      // Adopting the server-side preference is exactly what this effect is
      // for; the rule's usual "derive it during render instead" advice does
      // not apply to a value that arrives asynchronously.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDarkModeState(user.settings.darkMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /**
   * Persistence lives here rather than in each caller, so the navbar
   * toggle and the Settings switch behave identically. Previously only
   * Settings wrote the preference back, which meant a theme changed
   * anywhere else silently reverted on the next load.
   *
   * The cached user is updated alongside the request - the effect above
   * re-reads it on reload, and a stale copy would undo the change.
   */
  const setDarkMode = useCallback(
    (value) => {
      setDarkModeState(value);

      if (!user) return;

      setUser((current) =>
        current
          ? { ...current, settings: { ...current.settings, darkMode: value } }
          : current
      );

      updateSettings({ darkMode: value }).catch((error) => {
        // The theme still applied locally; only the cross-device sync failed.
        console.error("Could not save theme preference:", error);
      });
    },
    [user, setUser]
  );

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
