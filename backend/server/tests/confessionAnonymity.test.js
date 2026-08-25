const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../src/models/Confession");
const Confession = require("../src/models/Confession");
const app = require("../app");

const ME = "507f1f77bcf86cd799439011";
const token = jwt.sign({ id: ME, username: "me" }, process.env.JWT_SECRET);
const auth = () => ({ Authorization: `Bearer ${token}` });

describe("Confession anonymity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("never includes the author field when creating a confession", async () => {
    Confession.create.mockResolvedValue({
      toObject: () => ({
        _id: "c1",
        content: "my confession",
        author: ME, // present in the DB doc...
        likes: [],
      }),
    });

    const res = await request(app)
      .post("/api/confessions")
      .set(auth())
      .send({ content: "my confession" });

    expect(res.status).toBe(201);
    expect(res.body.confession.author).toBeUndefined(); // ...but never in the response
    expect(res.body.confession.isMine).toBe(true);
  });

  it("never includes the author field when listing confessions, even for other people's posts", async () => {
    Confession.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([
          {
            toObject: () => ({
              _id: "c1",
              content: "someone else's confession",
              author: "507f1f77bcf86cd799439099",
              likes: [],
            }),
          },
        ]),
      }),
    });

    const res = await request(app).get("/api/confessions").set(auth());

    expect(res.status).toBe(200);
    expect(res.body.confessions[0].author).toBeUndefined();
    expect(res.body.confessions[0].isMine).toBe(false);
  });
});
