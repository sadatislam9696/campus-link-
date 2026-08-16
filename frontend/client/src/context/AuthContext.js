import { createContext } from "react";

// Split into its own file (separate from AuthProvider.jsx) so this file
// only ever exports the context object, never a component - keeps Vite's
// Fast Refresh working cleanly for every component that consumes it.
export const AuthContext = createContext();
