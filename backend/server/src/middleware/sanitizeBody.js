// Strips MongoDB operator keys ("$gt", "$ne", etc.) and dotted keys from
// request bodies, recursively. This stops the classic NoSQL injection
// where a client sends { "email": { "$ne": null } } to try to bypass a
// findOne({ email }) lookup.
//
// Note: this only sanitizes req.body. Express 5 turned req.query into a
// read-only getter that's recomputed on every access, so it can't be
// mutated in place the way older sanitizer libraries (built for Express 4)
// expect - that incompatibility is also why we're not using
// express-mongo-sanitize here. The controllers that read req.query already
// guard against non-string values at their point of use (String(), regex
// escaping, Number(), or exact-match comparisons against known values).
const isPlainObject = (val) =>
  val !== null && typeof val === "object" && !Array.isArray(val);

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (isPlainObject(value)) {
    const clean = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      clean[key] = sanitizeValue(value[key]);
    }
    return clean;
  }

  return value;
};

const sanitizeBody = (req, res, next) => {
  if (isPlainObject(req.body)) {
    req.body = sanitizeValue(req.body);
  }
  next();
};

module.exports = sanitizeBody;
