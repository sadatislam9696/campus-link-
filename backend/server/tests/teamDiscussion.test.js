const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../src/models/Team", () => ({
  findById: jest.fn(),
}));
jest.mock("../src/models/TeamPost", () => ({
  find: jest.fn(),
  create: jest.fn(),
}));

const Team = require("../src/models/Team");
const TeamPost = require("../src/models/TeamPost");
const app = require("../app");

const ME = "507f1f77bcf86cd799439011";
const MEMBER = "507f1f77bcf86cd799439022";
const token = jwt.sign({ id: ME, username: "me" }, process.env.JWT_SECRET);
const auth = () => ({ Authorization: `Bearer ${token}` });

describe("GET /api/teams/:id/posts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("404s when the team doesn't exist", async () => {
    Team.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const res = await request(app).get("/api/teams/t1/posts").set(auth());

    expect(res.status).toBe(404);
  });

  it("blocks a non-member from viewing the discussion", async () => {
    Team.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ members: [{ toString: () => MEMBER }] }),
    });

    const res = await request(app).get("/api/teams/t1/posts").set(auth());

    expect(res.status).toBe(403);
    expect(TeamPost.find).not.toHaveBeenCalled();
  });

  it("returns posts for a member", async () => {
    Team.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ members: [{ toString: () => ME }] }),
    });
    TeamPost.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([{ _id: "p1", content: "hi" }]),
    });

    const res = await request(app).get("/api/teams/t1/posts").set(auth());

    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(1);
  });
});

describe("POST /api/teams/:id/posts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects empty content", async () => {
    const res = await request(app).post("/api/teams/t1/posts").set(auth()).send({ content: "   " });

    expect(res.status).toBe(400);
    expect(TeamPost.create).not.toHaveBeenCalled();
  });

  it("blocks a non-member from posting", async () => {
    Team.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ members: [{ toString: () => MEMBER }] }),
    });

    const res = await request(app).post("/api/teams/t1/posts").set(auth()).send({ content: "hello" });

    expect(res.status).toBe(403);
    expect(TeamPost.create).not.toHaveBeenCalled();
  });

  it("creates a post for a member", async () => {
    Team.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ members: [{ toString: () => ME }] }),
    });
    TeamPost.create.mockResolvedValue({
      populate: jest.fn().mockResolvedValue({ _id: "p1", content: "hello" }),
    });

    const res = await request(app).post("/api/teams/t1/posts").set(auth()).send({ content: "hello" });

    expect(res.status).toBe(201);
  });
});
