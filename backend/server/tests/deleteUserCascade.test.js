const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../src/models/User");
jest.mock("../src/models/Post");
jest.mock("../src/models/Comment");
jest.mock("../src/models/Message");
jest.mock("../src/models/Report");
jest.mock("../src/models/FriendRequest");
jest.mock("../src/models/StudyGroup");
jest.mock("../src/models/GroupPost");
jest.mock("../src/models/Team");
jest.mock("../src/models/Discussion");
jest.mock("../src/models/DiscussionReply");
jest.mock("../src/models/Event");
jest.mock("../src/models/Note");
jest.mock("../src/models/Project");
jest.mock("../src/models/Assignment");
jest.mock("../src/models/LostFoundItem");
jest.mock("../src/models/Confession");
jest.mock("../src/models/GroupConversation");
jest.mock("../src/models/GroupMessage");
jest.mock("../src/models/Notification");

const User = require("../src/models/User");
const StudyGroup = require("../src/models/StudyGroup");
const Post = require("../src/models/Post");
const Project = require("../src/models/Project");
const app = require("../app");

const ADMIN = "507f1f77bcf86cd799439011";
const VICTIM = "507f1f77bcf86cd799439022";
const OTHER_MEMBER = "507f1f77bcf86cd799439033";

const token = jwt.sign({ id: ADMIN, username: "admin" }, process.env.JWT_SECRET);
const auth = () => ({ Authorization: `Bearer ${token}` });

// Every model this endpoint touches needs a harmless default so the test
// can focus on the one piece of logic being verified (group ownership
// handoff) without every other cleanup step throwing.
const stubEmptyQueries = () => {
  const emptyFind = () => ({ select: jest.fn().mockResolvedValue([]) });
  Post.find.mockReturnValue(emptyFind());
  Post.deleteMany.mockResolvedValue({});
  Post.updateMany?.mockResolvedValue?.({});

  [
    "Comment",
    "Message",
    "Report",
    "FriendRequest",
    "GroupPost",
    "Discussion",
    "DiscussionReply",
    "Event",
    "Note",
    "Project",
    "Assignment",
    "LostFoundItem",
    "Confession",
    "GroupConversation",
    "GroupMessage",
    "Notification",
  ].forEach((name) => {
    const Model = require(`../src/models/${name}`);
    Model.deleteMany = jest.fn().mockResolvedValue({});
    Model.updateMany = jest.fn().mockResolvedValue({});
    Model.find = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
  });

  const Event = require("../src/models/Event");
  Event.updateMany = jest.fn().mockResolvedValue({});
  const Assignment = require("../src/models/Assignment");
  Assignment.updateMany = jest.fn().mockResolvedValue({});
  Project.updateMany = jest.fn().mockResolvedValue({});

  const Team = require("../src/models/Team");
  Team.find = jest.fn().mockResolvedValue([]);
  Team.updateMany = jest.fn().mockResolvedValue({});

  const GroupConversation = require("../src/models/GroupConversation");
  GroupConversation.find = jest.fn().mockResolvedValue([]);
  GroupConversation.updateMany = jest.fn().mockResolvedValue({});
};

describe("DELETE /api/admin/users/:id - group ownership handoff", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stubEmptyQueries();
    User.findById.mockResolvedValue({
      select: undefined,
      role: "user",
      _id: VICTIM,
      avatar: "",
    });
    // adminMiddleware calls User.findById(...).select(...)
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ role: "admin", isActive: true }),
    });
  });

  it("transfers ownership to a remaining member instead of deleting a group outright", async () => {
    // First call in adminMiddleware resolves the admin; the deleteUser
    // handler itself calls User.findById again for the target user.
    User.findById
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue({ role: "admin", isActive: true }) })
      .mockResolvedValueOnce({ _id: VICTIM, role: "user", avatar: "" });

    const groupDoc = {
      creator: VICTIM,
      members: [VICTIM, OTHER_MEMBER],
      deleteOne: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
    };

    StudyGroup.find = jest.fn().mockResolvedValue([groupDoc]);
    StudyGroup.updateMany = jest.fn().mockResolvedValue({});

    const res = await request(app).delete(`/api/admin/users/${VICTIM}`).set(auth());

    expect(res.status).toBe(200);
    expect(groupDoc.deleteOne).not.toHaveBeenCalled();
    expect(groupDoc.creator).toBe(OTHER_MEMBER);
    expect(groupDoc.members).toEqual([OTHER_MEMBER]);
    expect(groupDoc.save).toHaveBeenCalledTimes(1);
  });

  it("deletes the group instead of leaving it ownerless when the creator was the only member", async () => {
    User.findById
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue({ role: "admin", isActive: true }) })
      .mockResolvedValueOnce({ _id: VICTIM, role: "user", avatar: "" });

    const groupDoc = {
      creator: VICTIM,
      members: [VICTIM],
      deleteOne: jest.fn().mockResolvedValue(true),
      save: jest.fn(),
    };

    StudyGroup.find = jest.fn().mockResolvedValue([groupDoc]);
    StudyGroup.updateMany = jest.fn().mockResolvedValue({});

    const res = await request(app).delete(`/api/admin/users/${VICTIM}`).set(auth());

    expect(res.status).toBe(200);
    expect(groupDoc.deleteOne).toHaveBeenCalledTimes(1);
    expect(groupDoc.save).not.toHaveBeenCalled();
  });
});
