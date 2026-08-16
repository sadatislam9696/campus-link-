import axios from "../api/axios";

// =============================
// Get My Profile
// =============================
export const getMyProfile = async () => {
  const response = await axios.get("/profile");
  return response.data;
};

// =============================
// Get Public Profile By Username
// =============================
export const getPublicProfile = async (username) => {
  const response = await axios.get(`/profile/${username}`);
  return response.data;
};

// =============================
// Update Profile
// =============================
export const updateProfile = async (data) => {
  const response = await axios.put("/profile", data);
  return response.data;
};

// =============================
// Update Settings
// =============================
export const updateSettings = async (settings) => {
  const response = await axios.put("/profile/settings", settings);
  return response.data;
};

// =============================
// Upload Avatar
// =============================
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await axios.post("/profile/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// =============================
// Upload Cover Photo
// =============================
export const uploadCoverPhoto = async (file) => {
  const formData = new FormData();
  formData.append("cover", file);

  const response = await axios.post("/profile/cover", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
