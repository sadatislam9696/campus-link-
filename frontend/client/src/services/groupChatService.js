import axios from "../api/axios";

export const getMyGroupChats = async () => {
  const res = await axios.get("/group-chats");
  return res.data;
};

export const createGroupChat = async (name, memberIds) => {
  const res = await axios.post("/group-chats", { name, memberIds });
  return res.data;
};

export const getGroupChat = async (id) => {
  const res = await axios.get(`/group-chats/${id}`);
  return res.data;
};

export const sendGroupMessageRest = async (id, text) => {
  const res = await axios.post(`/group-chats/${id}/messages`, { text });
  return res.data;
};

export const updateGroupMessage = async (messageId, text) => {
  const res = await axios.put(`/group-chats/messages/${messageId}`, { text });
  return res.data;
};

export const deleteGroupMessage = async (messageId) => {
  const res = await axios.delete(`/group-chats/messages/${messageId}`);
  return res.data;
};

export const addGroupMember = async (id, userId) => {
  const res = await axios.post(`/group-chats/${id}/members`, { userId });
  return res.data;
};

export const leaveGroupChat = async (id) => {
  const res = await axios.post(`/group-chats/${id}/leave`);
  return res.data;
};
