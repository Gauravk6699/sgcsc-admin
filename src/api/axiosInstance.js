import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://sgcsc-backend-dzp4.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // ✅ Let the browser set correct Content-Type for file uploads
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

// Add error interceptor to provide user-friendly error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.message ||
      err.message ||
      "Request failed";
    return Promise.reject({ ...err, userMessage: msg });
  }
);

// Add unwrap method to extract data from response
api.unwrap = async (promise) => {
  const response = await promise;
  // Handle both { success: true, data: ... } and direct data responses
  if (response.data && response.data.success === true) {
    return response.data.data;
  }
  return response.data;
};

export default api;
