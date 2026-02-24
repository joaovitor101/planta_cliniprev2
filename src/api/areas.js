import { api } from "./client";

export async function listAreas({ unitId, floorId }) {
  const { data } = await api.get("/areas", { params: { unitId, floorId } });
  return data;
}

export async function createArea(payload) {
  const { data } = await api.post("/areas", payload);
  return data;
}

export async function patchArea(id, payload) {
  const { data } = await api.patch(`/areas/${id}`, payload);
  return data;
}

export async function deleteArea(id) {
  await api.delete(`/areas/${id}`);
}

