import axios from "../api/axios";

export const sendFriendRequest = async (userId) => {
  const res = await axios.post(`/friends/request/${userId}`);
  return res.data;
};

export const acceptFriendRequest = async (requestId) => {
  const res = await axios.put(`/friends/accept/${requestId}`);
  return res.data;
};

export const rejectFriendRequest = async (requestId) => {
  const res = await axios.put(`/friends/reject/${requestId}`);
  return res.data;
};

export const cancelFriendRequest = async (requestId) => {
  const res = await axios.delete(`/friends/cancel/${requestId}`);
  return res.data;
};

export const removeFriend = async (userId) => {
  const res = await axios.delete(`/friends/remove/${userId}`);
  return res.data;
};

export const getIncomingRequests = async () => {
  const res = await axios.get("/friends/requests");
  return res.data;
};

export const getSentRequests = async () => {
  const res = await axios.get("/friends/sent");
  return res.data;
};

export const getFriendsList = async (username) => {
  const res = await axios.get(`/friends/list/${username}`);
  return res.data;
};

export const getFriendStatus = async (userId) => {
  const res = await axios.get(`/friends/status/${userId}`);
  return res.data;
};

export const getFriendSuggestions = async () => {
  const res = await axios.get("/friends/suggestions");
  return res.data;
};
