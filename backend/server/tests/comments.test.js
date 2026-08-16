const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../src/models/Comment", () => ({
  findById: jest.fn(),
  find: jest.fn(),
  deleteMany: jest.fn(),
}));
jest.mock("../src/models/Post", () => ({
  findByIdAndUpdate: jest.fn(),
}));
jest.mock("../src/models/User", () => ({
  findById: jest.fn(),
}));

const Comment = require("../src/models/Comment");
const Post = require("../src/models/Post");
const User = require("../src/models/User");
const app = require("../app");

const ME = "507f1f77bcf86cd799439011";
const OTHER = "507f1f77bcf86cd799439022";
const token = jwt.sign({ id: ME, username: "me" }, process.env.JWT_SECRET);
const auth = () => ({ Authorization: `Bearer ${token}` });

describe("PUT /api/comments/:id (edit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects editing someone else's comment", async () => {
    Comment.findById.mockResolvedValue({
      author: { toString: () => OTHER },
    });

    const res = await request(app)
      .put("/api/comments/c1")
      .set(auth())
      .send({ text: "edited" });

    expect(res.status).toBe(403);
  });

  it("allows editing your own comment", async () => {
    const save = jest.fn().mockResolvedValue(true);
    Comment.findById.mockResolvedValue({
      author: { toString: () => ME },
      save,
      populate: jest.fn().mockResolvedValue({ text: "edited", isEdited: true }),
    });

    const res = await request(app)
      .put("/api/comments/c1")
      .set(auth())
      .send({ text: "edited" });

    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe("DELETE /api/comments/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks deleting someone else's comment if you're not an admin", async () => {
    Comment.findById.mockResolvedValue({
      _id: "c1",
      author: { toString: () => OTHER },
      post: "p1",
    });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ role: "user" }),
    });

    const res = await request(app).delete("/api/comments/c1").set(auth());

    expect(res.status).toBe(403);
  });

  it("allows an admin to delete someone else's comment", async () => {
    Comment.findById.mockResolvedValue({
      _id: "c1",
      author: { toString: () => OTHER },
      post: "p1",
    });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ role: "admin" }),
    });
    Comment.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });
    Comment.deleteMany.mockResolvedValue({});
    Post.findByIdAndUpdate.mockResolvedValue({});

    const res = await request(app).delete("/api/comments/c1").set(auth());

    expect(res.status).toBe(200);
    expect(Comment.deleteMany).toHaveBeenCalledTimes(1);
  });
});
