import axios from "../api/axios";

export const getTeams = async (search = "", type = "") => {
  const res = await axios.get("/teams", { params: { search, type } });
  return res.data;
};

export const createTeam = async (data) => {
  const res = await axios.post("/teams", data);
  return res.data;
};

export const getTeam = async (id) => {
  const res = await axios.get(`/teams/${id}`);
  return res.data;
};

export const joinTeam = async (id) => {
  const res = await axios.post(`/teams/${id}/join`);
  return res.data;
};

export const leaveTeam = async (id) => {
  const res = await axios.post(`/teams/${id}/leave`);
  return res.data;
};

export const deleteTeam = async (id) => {
  const res = await axios.delete(`/teams/${id}`);
  return res.data;
};
<<<<<<< HEAD

export const getTeamPosts = async (id) => {
  const res = await axios.get(`/teams/${id}/posts`);
  return res.data;
};

export const createTeamPost = async (id, content) => {
  const res = await axios.post(`/teams/${id}/posts`, { content });
  return res.data;
};
=======
>>>>>>> bdf963ed51860aae2ec63171c37f5a0cd46451e8
