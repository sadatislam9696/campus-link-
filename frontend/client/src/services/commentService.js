import axios from "../api/axios";

// =============================
// Get Comments
// =============================
export const getComments = async (postId) => {
  const response = await axios.get(
    `/comments/${postId}`
  );

  return response.data;
};

// =============================
// Add Comment
// =============================
export const addComment = async (
  postId,
  text,
  parentComment = null
) => {
  const response = await axios.post(
    `/comments/${postId}`,
    {
      text,
      parentComment,
    }
  );

  return response.data;
};

// =============================
// Edit Comment
// =============================
export const updateComment = async (commentId, text) => {
  const response = await axios.put(`/comments/${commentId}`, { text });
  return response.data;
};

// =============================
// Delete Comment
// =============================
export const deleteComment = async (
  commentId
) => {
  const response = await axios.delete(
    `/comments/${commentId}`
  );

  return response.data;
};