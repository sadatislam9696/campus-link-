import axios from "../api/axios";

// =============================
// Search Users & Posts
// =============================
export const search = async (query) => {
  const response = await axios.get("/search", {
    params: { q: query },
  });

  return response.data;
};
