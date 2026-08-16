import axios from "../api/axios";

export const getGroups = async (search = "", type = "") => {
  const res = await axios.get("/groups", { params: { search, type } });
  return res.data;
};

export const createGroup = async (data) => {
  const res = await axios.post("/groups", data);
  return res.data;
};

export const getGroup = async (id) => {
  const res = await axios.get(`/groups/${id}`);
  return res.data;
};

export const joinGroup = async (id) => {
  const res = await axios.post(`/groups/${id}/join`);
  return res.data;
};

export const leaveGroup = async (id) => {
  const res = await axios.post(`/groups/${id}/leave`);
  return res.data;
};

export const deleteGroup = async (id) => {
  const res = await axios.delete(`/groups/${id}`);
  return res.data;
};

export const getGroupPosts = async (id) => {
  const res = await axios.get(`/groups/${id}/posts`);
  return res.data;
};

export const createGroupPost = async (id, content) => {
  const res = await axios.post(`/groups/${id}/posts`, { content });
  return res.data;
};
