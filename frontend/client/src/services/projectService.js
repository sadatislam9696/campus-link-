import axios from "../api/axios";

export const getProjects = async (type = "", search = "") => {
  const res = await axios.get("/projects", { params: { type, search } });
  return res.data;
};

export const createProject = async (data) => {
  const res = await axios.post("/projects", data);
  return res.data;
};

export const toggleLikeProject = async (id) => {
  const res = await axios.post(`/projects/${id}/like`);
  return res.data;
};

export const deleteProject = async (id) => {
  const res = await axios.delete(`/projects/${id}`);
  return res.data;
};
