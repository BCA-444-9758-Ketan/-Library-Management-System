const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || deriveApiOrigin(API_BASE_URL);

function deriveApiOrigin(baseUrl) {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return 'http://localhost:5000';
  }
}

function buildUrl(path, query) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function request(path, { method = 'GET', token, body, query } = {}) {
  const headers = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, query), options);
  const raw = await response.text();
  const payload = raw ? safeParseJson(raw) : null;

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function requestFromOrigin(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${API_ORIGIN}${normalizedPath}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const raw = await response.text();
  const payload = raw ? safeParseJson(raw) : null;

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export const api = {
  health: () => requestFromOrigin('/health'),

  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),

  getBooks: (query) => request('/books', { query }),
  getBookById: (id) => request(`/books/${id}`),
  getBookAvailability: (id) => request(`/books/${id}/availability`),
  createBook: (body, token) => request('/books', { method: 'POST', body, token }),

  getInventory: (query, token) => request('/inventory', { query, token }),
  addStock: (body, token) => request('/inventory', { method: 'POST', body, token }),
  transferStock: (body, token) => request('/inventory/transfer', { method: 'PATCH', body, token }),

  issueBook: (body, token) => request('/transactions/issue', { method: 'POST', body, token }),
  returnBook: (body, token) => request('/transactions/return', { method: 'POST', body, token }),
  getMyTransactions: (token) => request('/transactions/my', { token }),
  getAllTransactions: (query, token) => request('/transactions', { query, token }),

  createReservation: (body, token) => request('/reservations', { method: 'POST', body, token }),
  getMyReservations: (token) => request('/reservations/my', { token }),

  getRecommendations: (userId, token) => request(`/recommendations/${userId}`, { token }),
  getUserProfile: (userId, token) => request(`/users/${userId}`, { token }),
};

export { API_BASE_URL, API_ORIGIN };
