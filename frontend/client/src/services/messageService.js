import axios from "../api/axios";

export const getConversations = async () => {
  const res = await axios.get("/messages/conversations");
  return res.data;
};

export const getMessages = async (userId) => {
  const res = await axios.get(`/messages/${userId}`);
  return res.data;
};

export const sendMessageRest = async (userId, text) => {
  const res = await axios.post(`/messages/${userId}`, { text });
  return res.data;
};

export const updateMessage = async (messageId, text) => {
  const res = await axios.put(`/messages/message/${messageId}`, { text });
  return res.data;
};

export const deleteMessage = async (messageId) => {
  const res = await axios.delete(`/messages/message/${messageId}`);
  return res.data;
};
