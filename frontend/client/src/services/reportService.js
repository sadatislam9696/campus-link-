import axios from "../api/axios";

export const createReport = async (targetType, targetId, reason) => {
  const res = await axios.post("/reports", { targetType, targetId, reason });
  return res.data;
};
