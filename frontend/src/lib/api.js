import axios from "axios";

// Shared API client. baseURL comes from frontend/.env (VITE_API_URL).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export default api;
