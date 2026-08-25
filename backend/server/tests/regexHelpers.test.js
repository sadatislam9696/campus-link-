const { escapeRegex } = require("../src/utils/regexHelpers");

describe("escapeRegex", () => {
  it("leaves plain alphanumeric text unchanged", () => {
    expect(escapeRegex("shamim")).toBe("shamim");
  });

  it("escapes regex special characters", () => {
    expect(escapeRegex("c++")).toBe("c\\+\\+");
    expect(escapeRegex("(bubt)")).toBe("\\(bubt\\)");
    expect(escapeRegex("a.b*c?")).toBe("a\\.b\\*c\\?");
  });

  it("neutralizes a regex-injection style query safely", () => {
    const malicious = ".*";
    const escaped = escapeRegex(malicious);

    // The escaped string should match itself literally...
    expect(new RegExp(escaped).test(".*")).toBe(true);
    // ...but should NOT behave like a wildcard against unrelated text.
    expect(new RegExp(escaped).test("anything")).toBe(false);
  });
});
