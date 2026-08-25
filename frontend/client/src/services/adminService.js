import axios from "../api/axios";

export const getAdminStats = async () => {
  const res = await axios.get("/admin/stats");
  return res.data;
};

export const getAdminUsers = async (search = "", page = 1) => {
  const res = await axios.get("/admin/users", { params: { search, page } });
  return res.data;
};

export const toggleBanUser = async (userId) => {
  const res = await axios.put(`/admin/users/${userId}/ban`);
  return res.data;
};

export const deleteUserAsAdmin = async (userId) => {
  const res = await axios.delete(`/admin/users/${userId}`);
  return res.data;
};

export const getAdminPosts = async (page = 1) => {
  const res = await axios.get("/admin/posts", { params: { page } });
  return res.data;
};

export const deletePostAsAdmin = async (postId) => {
  const res = await axios.delete(`/admin/posts/${postId}`);
  return res.data;
};

export const getAdminReports = async (status = "pending") => {
  const res = await axios.get("/admin/reports", { params: { status } });
  return res.data;
};

export const resolveReport = async (reportId) => {
  const res = await axios.put(`/admin/reports/${reportId}/resolve`);
  return res.data;
};
