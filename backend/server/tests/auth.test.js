const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Mock the User model so these tests run without a real MongoDB connection.
// Every test file that touches routes going through Mongoose should do
// this - it keeps the suite fast and runnable in CI with zero setup.
jest.mock("../src/models/User", () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));
const User = require("../src/models/User");

jest.mock("../src/utils/sendEmail", () => ({
  sendEmail: jest.fn().mockResolvedValue({ devMode: true }),
}));
const { sendEmail } = require("../src/utils/sendEmail");

const app = require("../app");

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validPayload = {
    firstName: "Shamim",
    lastName: "Hossain",
    username: "shamim_h",
    email: "shamim@example.com",
    password: "password123",
  };

  it("rejects a missing first name", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validPayload, firstName: "" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects an invalid email address", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validPayload, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/valid email/i);
  });

  it("rejects a password shorter than 6 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validPayload, password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/6 characters/i);
  });

  it("rejects a username with invalid characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validPayload, username: "shamim h!" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/letters, numbers/i);
  });

  it("rejects registration when the email is already taken", async () => {
    User.findOne.mockResolvedValueOnce({ _id: "existing-user" });

    const res = await request(app).post("/api/auth/register").send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email already exists/i);
  });

  it("registers successfully with valid, unique details", async () => {
    User.findOne.mockResolvedValue(null); // no existing email or username
    User.create.mockResolvedValue({
      _id: "new-user-id",
      ...validPayload,
      avatar: "",
      role: "user",
      profileCompleted: false,
    });

    const res = await request(app).post("/api/auth/register").send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe(validPayload.username);
    expect(User.create).toHaveBeenCalledTimes(1);
  });

  it("still succeeds even when the verification email fails to send (e.g. broken SMTP)", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: "new-user-id",
      ...validPayload,
      avatar: "",
      role: "user",
      profileCompleted: false,
    });
    sendEmail.mockRejectedValueOnce(new Error("Connection timeout"));

    const res = await request(app).post("/api/auth/register").send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });
});

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects a missing email", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({});
    expect(res.status).toBe(400);
  });

  it("returns a generic success message even for an unknown email (no user enumeration)", async () => {
    User.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ghost@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("generates and saves a reset token for a known email", async () => {
    const save = jest.fn().mockResolvedValue(true);
    User.findOne.mockResolvedValueOnce({
      _id: "user-id",
      email: "shamim@example.com",
      firstName: "Shamim",
      save,
    });

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "shamim@example.com" });

    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("still returns the generic success response even when the reset email fails to send", async () => {
    const save = jest.fn().mockResolvedValue(true);
    User.findOne.mockResolvedValueOnce({
      _id: "user-id",
      email: "shamim@example.com",
      firstName: "Shamim",
      save,
    });
    sendEmail.mockRejectedValueOnce(new Error("Connection timeout"));

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "shamim@example.com" });

    // Must stay 200 with the same generic message - a different status
    // here would both break the flow and leak whether the account exists.
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("POST /api/auth/reset-password/:token", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects a password shorter than 6 characters", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password/sometoken")
      .send({ password: "123" });

    expect(res.status).toBe(400);
  });

  it("rejects an invalid or expired token", async () => {
    User.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .post("/api/auth/reset-password/badtoken")
      .send({ password: "newpassword123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or has expired/i);
  });

  it("resets the password with a valid token", async () => {
    const save = jest.fn().mockResolvedValue(true);
    User.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        _id: "user-id",
        save,
      }),
    });

    const res = await request(app)
      .post("/api/auth/reset-password/goodtoken")
      .send({ password: "newpassword123" });

    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
describe("POST /api/auth/verify-email/:token", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects an invalid or expired verification token", async () => {
    User.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).post("/api/auth/verify-email/badtoken");

    expect(res.status).toBe(400);
  });

  it("verifies the email with a valid token", async () => {
    const save = jest.fn().mockResolvedValue(true);
    User.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        _id: "user-id",
        isEmailVerified: false,
        save,
      }),
    });

    const res = await request(app).post("/api/auth/verify-email/goodtoken");

    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe("PUT /api/auth/change-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const authToken = jwt.sign(
    { id: "507f1f77bcf86cd799439011", username: "me" },
    process.env.JWT_SECRET
  );

  it("rejects when currentPassword or newPassword is missing", async () => {
    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ currentPassword: "old" });

    expect(res.status).toBe(400);
  });

  it("rejects when the current password is wrong", async () => {
    const hashed = await bcrypt.hash("correct-current", 10);
    User.findById.mockResolvedValueOnce({ password: hashed });

    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ currentPassword: "wrong-current", newPassword: "newpassword123" });

    expect(res.status).toBe(401);
  });

  it("changes the password when the current one is correct", async () => {
    const hashed = await bcrypt.hash("correct-current", 10);
    const save = jest.fn().mockResolvedValue(true);
    User.findById.mockResolvedValueOnce({ password: hashed, save });

    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ currentPassword: "correct-current", newPassword: "newpassword123" });

    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects an invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nope", password: "password123" });

    expect(res.status).toBe(400);
  });

  it("rejects a missing password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "shamim@example.com", password: "" });

    expect(res.status).toBe(400);
  });

  it("rejects login for an unknown email", async () => {
    User.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@example.com", password: "password123" });

    expect(res.status).toBe(401);
  });

  it("rejects login with the wrong password", async () => {
    const hashed = await bcrypt.hash("correct-password", 10);
    User.findOne.mockResolvedValueOnce({
      _id: "user-id",
      password: hashed,
      isActive: true,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "shamim@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("blocks a banned (isActive: false) account even with correct credentials", async () => {
    const hashed = await bcrypt.hash("password123", 10);
    User.findOne.mockResolvedValueOnce({
      _id: "user-id",
      password: hashed,
      isActive: false,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "shamim@example.com", password: "password123" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/suspended/i);
  });

  it("rejects a NoSQL-injection style login attempt ({$ne: null}) rather than bypassing auth", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: { $ne: null }, password: { $ne: null } });

    expect(res.status).toBe(400);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it("logs in successfully with correct credentials", async () => {
    const hashed = await bcrypt.hash("password123", 10);
    User.findOne.mockResolvedValueOnce({
      _id: "user-id",
      firstName: "Shamim",
      lastName: "Hossain",
      username: "shamim_h",
      email: "shamim@example.com",
      avatar: "",
      role: "user",
      profileCompleted: true,
      password: hashed,
      isActive: true,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "shamim@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("shamim@example.com");
  });
});
