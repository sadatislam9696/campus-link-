// Origins permitted to call the API and open Socket.io connections.
//
// CLIENT_URL is a comma-separated list so one deployment can serve several
// legitimate front ends - an apex domain plus www, a preview deployment, or
// both localhost and 127.0.0.1 in development (browsers treat those two as
// different origins, which is a common local-dev trap).
const DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173";

const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.CLIENT_URL || DEFAULT_ORIGINS)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

// Vite picks the next free port when its default is taken, so a dev server
// can legitimately come up on 5174, 5175 and so on. Pinning development to
// one port means the API starts rejecting the very front end the developer
// is looking at, with a browser-side CORS failure that carries no readable
// message. Outside production, trust any loopback origin instead.
const LOOPBACK = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

const isAllowedOrigin = (origin) => {
  const normalized = origin.replace(/\/$/, "");

  if (allowedOrigins.includes(normalized)) return true;

  return !isProduction && LOOPBACK.test(normalized);
};

// Shared by the Express `cors` middleware. Requests with no Origin header
// (curl, health checks, server-to-server) aren't subject to the browser's
// same-origin policy, so they're allowed through.
//
// A disallowed origin resolves to `false` rather than an Error: passing an
// Error makes the `cors` package hand a 500 to the error handler, which
// reports a client-side policy decision as an API fault and buries the real
// cause in the logs. Returning false simply omits the CORS headers - the
// browser still blocks the request, which is the intended outcome.
const corsOriginCheck = (origin, callback) => {
  if (!origin) return callback(null, true);

  return callback(null, isAllowedOrigin(origin));
};

module.exports = { allowedOrigins, isAllowedOrigin, corsOriginCheck };
