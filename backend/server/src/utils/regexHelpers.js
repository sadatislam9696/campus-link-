// Escapes user input before it's dropped into a RegExp, so search text
// like "c++" or "(bubt)" can't break or hijack the query (ReDoS / regex
// injection prevention).
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { escapeRegex };
