import axios from "../api/axios";

export const getConfessions = async (onlyPolls = false) => {
  const res = await axios.get("/confessions", { params: { onlyPolls } });
  return res.data;
};

export const createConfession = async (content, poll = null) => {
  const res = await axios.post("/confessions", { content, poll });
  return res.data;
};

export const toggleConfessionLike = async (id) => {
  const res = await axios.post(`/confessions/${id}/like`);
  return res.data;
};

export const voteConfessionPoll = async (id, optionIndex) => {
  const res = await axios.post(`/confessions/${id}/vote`, { optionIndex });
  return res.data;
};

export const deleteConfession = async (id) => {
  const res = await axios.delete(`/confessions/${id}`);
  return res.data;
};
