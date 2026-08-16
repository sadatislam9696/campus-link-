import axios from "../api/axios";

export const getAssignments = async (courseCode = "") => {
  const res = await axios.get("/assignments", { params: { courseCode } });
  return res.data;
};

export const createAssignment = async (data) => {
  const res = await axios.post("/assignments", data);
  return res.data;
};

export const toggleCompleted = async (id) => {
  const res = await axios.post(`/assignments/${id}/complete`);
  return res.data;
};

export const deleteAssignment = async (id) => {
  const res = await axios.delete(`/assignments/${id}`);
  return res.data;
};
