jest.mock("../src/models/Notification", () => ({
  create: jest.fn(),
}));

const Notification = require("../src/models/Notification");
const { createNotification } = require("../src/utils/notificationHelper");

describe("createNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a notification when recipient and sender differ", async () => {
    Notification.create.mockResolvedValue({});

    await createNotification({
      recipient: "user-a",
      sender: "user-b",
      type: "like",
      message: "user-b liked your post.",
    });

    expect(Notification.create).toHaveBeenCalledTimes(1);
  });

  it("skips creating a notification when a user would notify themselves", async () => {
    await createNotification({
      recipient: "user-a",
      sender: "user-a",
      type: "like",
      message: "self like",
    });

    expect(Notification.create).not.toHaveBeenCalled();
  });

  it("never throws even if Notification.create fails", async () => {
    Notification.create.mockRejectedValue(new Error("DB is down"));

    await expect(
      createNotification({
        recipient: "user-a",
        sender: "user-b",
        type: "comment",
        message: "should not throw",
      })
    ).resolves.toBeUndefined();
  });
});
