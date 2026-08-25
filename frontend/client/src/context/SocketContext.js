import { createContext } from "react";

// Split into its own file (separate from SocketProvider.jsx) so this file
// only ever exports the context object, never a component.
export const SocketContext = createContext();
