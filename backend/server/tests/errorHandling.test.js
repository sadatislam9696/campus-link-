const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");

const token = jwt.sign(
  { id: "507f1f77bcf86cd799439011", username: "me" },
  process.env.JWT_SECRET
);

describe("Global error handling", () => {
  it("returns clean JSON (not an HTML stack trace) for an unknown route", async () => {
    const res = await request(app).get("/api/totally-fake-route");

    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.success).toBe(false);
  });

  it("returns clean JSON when a post upload field has the wrong file type", async () => {
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .field("content", "test")
      .attach("document", Buffer.from("fake video bytes"), {
        filename: "clip.mp4",
        contentType: "video/mp4",
      });

    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/unsupported file type/i);
  });
});
