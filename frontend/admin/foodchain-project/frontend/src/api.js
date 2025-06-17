const API_BASE = "http://localhost:5000/api";

export async function loginUser(username, password) {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
}

export async function createProduct(username, args) {
  const response = await fetch(`${API_BASE}/createProduct`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, args }),
  });
  return response.json();
}

export async function createUser(userData) {
  const response = await fetch(`${API_BASE}/createUser`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return response.json();
}

export async function checkUsernameTaken(username) {
  const response = await fetch(`${API_BASE}/checkUsernameTaken/${username}`);
  const data = await response.json();
  return data.exists;
}

export async function deleteUser(username, reason) {
  const response = await fetch(`${API_BASE}/deleteUser`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, reason }),
  });
  return response.json();
}

export async function changeProductOwnership(productID, newOwner) {
  const response = await fetch(`${API_BASE}/changeProductOwnership`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productID, newOwner }),
  });
  return response.json();
}

export async function getConflictProducts() {
  const response = await fetch(`${API_BASE}/conflictProducts`);
  return response.json();
}

export async function resolveConflictProduct(productId) {
  const response = await fetch(`${API_BASE}/resolveConflict/${productId}`, {
    method: "DELETE",
  });
  return response.json();
}