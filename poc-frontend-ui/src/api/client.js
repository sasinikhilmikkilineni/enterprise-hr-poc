import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

let _oktaAuth = null;

export function setOktaAuth(oktaAuth) {
  _oktaAuth = oktaAuth;
}

apiClient.interceptors.request.use(
  async (config) => {
    if (_oktaAuth) {
      try {
        const token = await _oktaAuth.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Token unavailable — request proceeds without auth header
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && _oktaAuth) {
      _oktaAuth.signInWithRedirect();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
