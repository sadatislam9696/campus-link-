import axios from "../api/axios";

export const getNotifications = async () => {
  const res = await axios.get("/notifications");
  return res.data;
};

export const getUnreadCount = async () => {
  const res = await axios.get("/notifications/unread-count");
  return res.data;
};

export const markNotificationRead = async (id) => {
  const res = await axios.put(`/notifications/read/${id}`);
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await axios.put("/notifications/read-all");
  return res.data;
};
