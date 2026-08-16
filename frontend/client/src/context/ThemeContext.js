import { createContext } from "react";

// Split into its own file (separate from ThemeProvider.jsx) so this file
// only ever exports the context object, never a component.
export const ThemeContext = createContext();
