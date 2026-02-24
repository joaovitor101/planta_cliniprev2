import { api } from "./client";

export async function listUnits() {
  const { data } = await api.get("/units");
  return data;
}

export async function createUnit(payload) {
  const { data } = await api.post("/units", payload);
  return data;
}

