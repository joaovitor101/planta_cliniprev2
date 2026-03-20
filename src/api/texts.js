import { api } from "./client";

export async function listTexts({ unitId, floorId }) {
  const { data } = await api.get("/texts", { params: { unitId, floorId } });
  return data;
}

export async function createText(payload) {
  const { data } = await api.post("/texts", payload);
  return data;
}

export async function patchText(id, payload) {
  const { data } = await api.patch(`/texts/${id}`, payload);
  return data;
}

export async function deleteText(id) {
  await api.delete(`/texts/${id}`);
}

