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
