const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../src/models/Message", () => ({
  findById: jest.fn(),
}));
jest.mock("../src/models/GroupMessage", () => ({
  findById: jest.fn(),
}));

const Message = require("../src/models/Message");
const GroupMessage = require("../src/models/GroupMessage");
const app = require("../app");

const ME = "507f1f77bcf86cd799439011";
const OTHER = "507f1f77bcf86cd799439022";
const token = jwt.sign({ id: ME, username: "me" }, process.env.JWT_SECRET);
const auth = () => ({ Authorization: `Bearer ${token}` });

describe("Direct message edit/delete permissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks editing someone else's message", async () => {
    Message.findById.mockResolvedValue({
      sender: { toString: () => OTHER },
      isDeleted: false,
    });

    const res = await request(app)
      .put("/api/messages/message/m1")
      .set(auth())
      .send({ text: "edited" });

    expect(res.status).toBe(403);
  });

  it("allows editing your own message", async () => {
    const save = jest.fn().mockResolvedValue(true);
    Message.findById.mockResolvedValue({
      sender: { toString: () => ME },
      receiver: { toString: () => OTHER },
      isDeleted: false,
      save,
    });

    const res = await request(app)
      .put("/api/messages/message/m1")
      .set(auth())
      .send({ text: "edited" });

    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("blocks deleting someone else's message", async () => {
    Message.findById.mockResolvedValue({
      sender: { toString: () => OTHER },
    });

    const res = await request(app).delete("/api/messages/message/m1").set(auth());

    expect(res.status).toBe(403);
  });
});

describe("Group message edit/delete permissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks editing someone else's group message", async () => {
    GroupMessage.findById.mockResolvedValue({
      sender: { toString: () => OTHER },
      isDeleted: false,
    });

    const res = await request(app)
      .put("/api/group-chats/messages/m1")
      .set(auth())
      .send({ text: "edited" });

    expect(res.status).toBe(403);
  });

  it("blocks deleting someone else's group message", async () => {
    GroupMessage.findById.mockResolvedValue({
      sender: { toString: () => OTHER },
    });

    const res = await request(app).delete("/api/group-chats/messages/m1").set(auth());

    expect(res.status).toBe(403);
  });
});
