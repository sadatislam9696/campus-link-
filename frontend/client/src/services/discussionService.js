import axios from "../api/axios";

export const getDiscussions = async (courseCode = "", search = "") => {
  const res = await axios.get("/discussions", { params: { courseCode, search } });
  return res.data;
};

export const createDiscussion = async (data) => {
  const res = await axios.post("/discussions", data);
  return res.data;
};

export const getDiscussion = async (id) => {
  const res = await axios.get(`/discussions/${id}`);
  return res.data;
};

export const addReply = async (id, content) => {
  const res = await axios.post(`/discussions/${id}/replies`, { content });
  return res.data;
};

export const deleteDiscussion = async (id) => {
  const res = await axios.delete(`/discussions/${id}`);
  return res.data;
};
