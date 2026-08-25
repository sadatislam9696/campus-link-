import axios from "../api/axios";

// =============================
// Get Feed
// =============================
export const getPosts = async (page = 1, category = "") => {
  const response = await axios.get("/posts", { params: { page, category } });
  return response.data;
};

// =============================
// Get Posts By Username
// =============================
export const getUserPosts = async (username) => {
  const response = await axios.get(`/posts/user/${username}`);
  return response.data;
};

// =============================
// Create Post
// =============================
export const createPost = async (formData) => {
  const response = await axios.post("/posts", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// =============================
// Vote on a Poll
// =============================
export const votePoll = async (postId, optionIndex) => {
  const response = await axios.post(`/posts/${postId}/vote`, { optionIndex });
  return response.data;
};

// =============================
// Like / Unlike
// =============================
export const toggleLike = async (postId) => {
  const response = await axios.post(`/posts/${postId}/like`);
  return response.data;
};

// =============================
// Update Post
// =============================
export const updatePost = async (postId, data) => {
  const response = await axios.put(
    `/posts/${postId}`,
    data
  );

  return response.data;
};

// =============================
// Delete Post
// =============================
export const deletePost = async (postId) => {
  const response = await axios.delete(
    `/posts/${postId}`
  );

  return response.data;
};