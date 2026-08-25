import axios from "../api/axios";

export const getLostFoundItems = async (category = "", status = "open") => {
  const res = await axios.get("/lostfound", { params: { category, status } });
  return res.data;
};

export const createLostFoundItem = async ({ title, description, category, location, image }) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description || "");
  formData.append("category", category);
  formData.append("location", location || "");
  if (image) formData.append("image", image);

  const res = await axios.post("/lostfound", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const toggleResolved = async (id) => {
  const res = await axios.put(`/lostfound/${id}/resolve`);
  return res.data;
};

export const deleteLostFoundItem = async (id) => {
  const res = await axios.delete(`/lostfound/${id}`);
  return res.data;
};
