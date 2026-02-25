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

export async function uploadAreaImage(id, file) {
try {
  const formData = new FormData();
  formData.append("file", file); // name = 'file' como no backend

  const response = await fetch(`/api/areas/${id}/image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json(); // ou response.text() se não for JSON
    throw new Error(errorData.message || "Erro ao enviar imagem");
  }

  const data = await response.json();
  console.log("Imagem enviada:", data);
} catch (error) {
  console.error("Erro no upload:", error.message);
}
}

