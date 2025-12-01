import api from "./api";

export async function loginRequest(payload) {
  const response = await api.post("/Account/Login", payload);
  return response.data;
}

export async function registerRequest(payload) {
  const response = await api.post("/Account/Register", payload);
  return response.data;
}
