import { api } from "./client";

export async function listFloors({ unitId }) {
  const { data } = await api.get("/floors", { params: { unitId } });
  return data;
}

export async function createFloor(payload) {
  const { data } = await api.post("/floors", payload);
  return data;
}

