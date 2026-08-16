import API from "../api/axios";

export const loginUser = async (data) => {
  const response = await API.post("/auth/login", data);
  return response.data;
};

export const registerUser = async (data) => {
  const response = await API.post("/auth/register", data);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await API.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await API.post(`/auth/reset-password/${token}`, { password });
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await API.post(`/auth/verify-email/${token}`);
  return response.data;
};

export const resendVerification = async () => {
  const response = await API.post("/auth/resend-verification");
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await API.put("/auth/change-password", { currentPassword, newPassword });
  return response.data;
};