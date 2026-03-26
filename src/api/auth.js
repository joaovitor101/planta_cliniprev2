import { api } from "./client";

export async function login({ password }) {
  const { data } = await api.post("/auth/login", { password });
  return data; // { token, user }
}

