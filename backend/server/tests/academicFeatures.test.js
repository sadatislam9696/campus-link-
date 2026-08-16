const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../src/models/StudyGroup", () => ({
  findById: jest.fn(),
}));
jest.mock("../src/models/GroupPost", () => ({
  create: jest.fn(),
}));

const StudyGroup = require("../src/models/StudyGroup");
const GroupPost = require("../src/models/GroupPost");
const app = require("../app");

const ME = "507f1f77bcf86cd799439011";
const OTHER = "507f1f77bcf86cd799439022";
const token = jwt.sign({ id: ME, username: "me" }, process.env.JWT_SECRET);
const auth = () => ({ Authorization: `Bearer ${token}` });

describe("Study group membership permissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks posting in a group you haven't joined", async () => {
    StudyGroup.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ members: [OTHER] }),
    });

    const res = await request(app)
      .post("/api/groups/g1/posts")
      .set(auth())
      .send({ content: "hello" });

    expect(res.status).toBe(403);
    expect(GroupPost.create).not.toHaveBeenCalled();
  });

  it("allows posting once you're a member", async () => {
    StudyGroup.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ members: [ME, OTHER] }),
    });
    GroupPost.create.mockResolvedValue({
      populate: jest.fn(),
    });
    GroupPost.create.mockResolvedValue({
      _id: "p1",
      content: "hello",
      populate: jest.fn().mockResolvedValue({ _id: "p1", content: "hello" }),
    });

    const res = await request(app)
      .post("/api/groups/g1/posts")
      .set(auth())
      .send({ content: "hello" });

    expect(res.status).toBe(201);
  });

  it("blocks leaving a group you created", async () => {
    StudyGroup.findById.mockResolvedValue({
      creator: { toString: () => ME },
    });

    const res = await request(app).post("/api/groups/g1/leave").set(auth());

    expect(res.status).toBe(400);
  });
});

describe("Discussion delete permissions", () => {
  jest.mock("../src/models/User", () => ({
    findById: jest.fn(),
  }));

  it("blocks deleting someone else's discussion if you're not an admin", async () => {
    jest.resetModules();
    jest.doMock("../src/models/Discussion", () => ({
      findById: jest.fn().mockResolvedValue({
        author: { toString: () => OTHER },
      }),
    }));
    jest.doMock("../src/models/User", () => ({
      findById: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({ role: "user" }),
      })),
    }));

    const freshApp = require("../app");
    const res = await request(freshApp)
      .delete("/api/discussions/d1")
      .set(auth());

    expect(res.status).toBe(403);
  });
});
