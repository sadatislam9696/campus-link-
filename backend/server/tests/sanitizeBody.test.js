const sanitizeBody = require("../src/middleware/sanitizeBody");

const runMiddleware = (body) => {
  const req = { body };
  const next = jest.fn();
  sanitizeBody(req, {}, next);
  return { req, next };
};

describe("sanitizeBody middleware", () => {
  it("leaves a normal body untouched", () => {
    const { req, next } = runMiddleware({ email: "a@b.com", password: "secret123" });

    expect(req.body).toEqual({ email: "a@b.com", password: "secret123" });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("strips MongoDB operator keys from a NoSQL-injection attempt", () => {
    const { req } = runMiddleware({
      email: { $ne: null },
      password: { $gt: "" },
    });

    // The dangerous operator keys are gone, leaving harmless empty objects
    // rather than a query Mongo would interpret as "match anything".
    expect(req.body.email).toEqual({});
    expect(req.body.password).toEqual({});
  });

  it("strips operator keys nested inside arrays and nested objects", () => {
    const { req } = runMiddleware({
      filters: [{ $where: "malicious" }, { safe: "value" }],
      nested: { profile: { $gt: 1, bio: "hello" } },
    });

    expect(req.body.filters).toEqual([{}, { safe: "value" }]);
    expect(req.body.nested).toEqual({ profile: { bio: "hello" } });
  });

  it("strips dotted keys (another Mongo operator-injection vector)", () => {
    const { req } = runMiddleware({ "author.role": "admin", name: "ok" });

    expect(req.body).toEqual({ name: "ok" });
  });

  it("does nothing if there's no body", () => {
    const { req, next } = runMiddleware(undefined);

    expect(req.body).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
