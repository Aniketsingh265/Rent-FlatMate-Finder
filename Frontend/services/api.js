import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);
export const getMe = () => API.get("/auth/me");

// Listings
export const getListings = (params) => API.get("/listings", { params });
export const getListing = (id) => API.get(`/listings/${id}`);
export const createListing = (data) => API.post("/listings", data);
export const updateListing = (id, data) => API.put(`/listings/${id}`, data);
export const deleteListing = (id) => API.delete(`/listings/${id}`);
export const markListingFilled = (id) => API.patch(`/listings/${id}/fill`);
export const getMyListings = () => API.get("/listings/my");

// Tenant Profile
export const getTenantProfile = () => API.get("/tenants/profile");
export const saveTenantProfile = (data) => API.post("/tenants/profile", data);

// Interests
export const sendInterest = (data) => API.post("/interests", data);
export const respondInterest = (id, status) => API.patch(`/interests/${id}`, { status });
export const getMyInterests = () => API.get("/interests/my");
export const getReceivedInterests = () => API.get("/interests/received");

// Chat
export const getChatHistory = (interestId) => API.get(`/chat/${interestId}`);

// Admin
export const getAdminStats = () => API.get("/admin/stats");
export const getAdminUsers = () => API.get("/admin/users");
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);
export const getAdminListings = () => API.get("/admin/listings");
export const adminDeleteListing = (id) => API.delete(`/admin/listings/${id}`);
