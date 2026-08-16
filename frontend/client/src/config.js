// Central place for the backend's base URL so it's easy to point the
// frontend at a different server for production, staging, etc.
// Set VITE_API_URL in a .env file to override the localhost default -
// see .env.example.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
