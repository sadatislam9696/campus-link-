import axios from "../api/axios";

export const getEvents = async (upcoming = true) => {
  const res = await axios.get("/events", { params: { upcoming } });
  return res.data;
};

export const createEvent = async (data) => {
  const res = await axios.post("/events", data);
  return res.data;
};

export const toggleInterested = async (id) => {
  const res = await axios.post(`/events/${id}/interested`);
  return res.data;
};

export const deleteEvent = async (id) => {
  const res = await axios.delete(`/events/${id}`);
  return res.data;
};
