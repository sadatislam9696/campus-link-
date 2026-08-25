import axios from "../api/axios";

export const getNotes = async (courseCode = "", search = "") => {
  const res = await axios.get("/notes", { params: { courseCode, search } });
  return res.data;
};

export const createNote = async ({ title, courseCode, description, file }) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("courseCode", courseCode);
  formData.append("description", description || "");
  if (file) formData.append("file", file);

  const res = await axios.post("/notes", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteNote = async (id) => {
  const res = await axios.delete(`/notes/${id}`);
  return res.data;
};
