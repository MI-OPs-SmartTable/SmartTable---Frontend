// Ejemplo de métodos HTTP usando fetch para conectar con un backend real
// Puedes adaptar este archivo para cualquier entidad (productos, usuarios, etc.)

const BASE_URL = "https://api.tu-backend.com";

// GET: Obtener lista de recursos
export async function getExampleList() {
  const res = await fetch(`${BASE_URL}/ejemplo`);
  if (!res.ok) throw new Error("Error al obtener la lista");
  return res.json();
}

// GET: Obtener un recurso por ID
export async function getExampleById(id: string) {
  const res = await fetch(`${BASE_URL}/ejemplo/${id}`);
  if (!res.ok) throw new Error("No encontrado");
  return res.json();
}

// POST: Crear un recurso
export async function createExample(data: any) {
  const res = await fetch(`${BASE_URL}/ejemplo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear");
  return res.json();
}

// PUT: Actualizar un recurso
export async function updateExample(id: string, data: any) {
  const res = await fetch(`${BASE_URL}/ejemplo/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar");
  return res.json();
}

// DELETE: Eliminar un recurso
export async function deleteExample(id: string) {
  const res = await fetch(`${BASE_URL}/ejemplo/${id}`, {
    method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar");
  return res.json();
}
