const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../src/models/GroupConversation", () => ({
  create: jest.fn(),
  findById: jest.fn(),
}));
jest.mock("../src/models/User", () => ({
  findById: jest.fn(),
}));

const GroupConversation = require("../src/models/GroupConversation");
const User = require("../src/models/User");
const app = require("../app");

const ME = "507f1f77bcf86cd799439011";
const FRIEND = "507f1f77bcf86cd799439022";
const STRANGER = "507f1f77bcf86cd799439033";
const token = jwt.sign({ id: ME, username: "me" }, process.env.JWT_SECRET);
const auth = () => ({ Authorization: `Bearer ${token}` });

describe("POST /api/group-chats (create)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects creating a group with fewer than 2 other members", async () => {
    const res = await request(app)
      .post("/api/group-chats")
      .set(auth())
      .send({ name: "Study Crew", memberIds: [FRIEND] });

    expect(res.status).toBe(400);
    expect(GroupConversation.create).not.toHaveBeenCalled();
  });

  it("blocks adding someone who isn't a friend", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ friends: [FRIEND] }),
    });

    const res = await request(app)
      .post("/api/group-chats")
      .set(auth())
      .send({ name: "Study Crew", memberIds: [FRIEND, STRANGER] });

    expect(res.status).toBe(403);
    expect(GroupConversation.create).not.toHaveBeenCalled();
  });

  it("creates the group when every member is a friend", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ friends: [FRIEND, STRANGER] }),
    });
    GroupConversation.create.mockResolvedValue({
      populate: jest.fn().mockResolvedValue({ _id: "g1", name: "Study Crew" }),
    });

    const res = await request(app)
      .post("/api/group-chats")
      .set(auth())
      .send({ name: "Study Crew", memberIds: [FRIEND, STRANGER] });

    expect(res.status).toBe(201);
  });
});

describe("GET /api/group-chats/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks a non-member from viewing the conversation", async () => {
    GroupConversation.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        members: [{ _id: { toString: () => FRIEND } }],
      }),
    });

    const res = await request(app).get("/api/group-chats/g1").set(auth());

    expect(res.status).toBe(403);
  });
});
