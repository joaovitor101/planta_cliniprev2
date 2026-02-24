import { api } from "./client";

export async function listEquipments({ areaId }) {
  const { data } = await api.get("/equipments", { params: { areaId } });
  return data;
}

export async function createEquipment(payload) {
  const { data } = await api.post("/equipments", payload);
  return data;
}

export async function updateEquipment(id, payload) {
  const { data } = await api.patch(`/equipments/${id}`, payload);
  return data;
}

export async function deleteEquipment(id) {
  await api.delete(`/equipments/${id}`);
}

export async function searchEquipments({ q, by }) {
  const { data } = await api.get("/equipments/search", {
    params: { q, by },
  });
  return data;
}

export async function uploadEquipmentImage(id, file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(`/equipments/${id}/image`, formData);

  return data;
}

