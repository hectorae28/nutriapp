// client/src/api/client.js
const BASE_URL = '/api';

function getCsrfToken() {
  return (
    document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('csrftoken='))
      ?.split('=')?.[1] ?? ''
  );
}

async function request(path, options = {}) {
  const method = options.method || 'GET';
  const csrfHeaders = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    ? { 'X-CSRFToken': getCsrfToken() }
    : {};

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...csrfHeaders, ...options.headers },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw { status: res.status, data };
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),
};
