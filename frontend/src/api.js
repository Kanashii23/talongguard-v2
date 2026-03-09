const BASE_URL = 'https://talongguard-server.onrender.com/api'

function getToken() {
  return localStorage.getItem('tg_token')
}

async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
  } catch (networkErr) {
    throw new Error('Cannot connect to server. Make sure the backend is running on port 3001.')
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(
      `Server returned unexpected response (status ${res.status}). Check that backend is running.`
    )
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

export const api = {
  // Auth
  login: (body) => apiFetch('/auth/login', { method: 'POST', body }),
  me: () => apiFetch('/auth/me'),
  changePassword: (body) => apiFetch('/auth/change-password', { method: 'POST', body }),
  forgotPassword: (body) => apiFetch('/auth/forgot-password', { method: 'POST', body }),
  resetPassword: (body) => apiFetch('/auth/reset-password', { method: 'POST', body }),

  // Users (admin only)
  sendVerificationCode: (body) => apiFetch('/users/send-code', { method: 'POST', body }),
  getUsers: () => apiFetch('/users'),
  createUser: (body) => apiFetch('/users', { method: 'POST', body }),
  updateUser: (id, body) => apiFetch(`/users/${id}`, { method: 'PUT', body }),
  deleteUser: (id) => apiFetch(`/users/${id}`, { method: 'DELETE' }),
  resetUserPassword: (id) => apiFetch(`/users/${id}/reset-password`, { method: 'POST' }),

  // Scan records (from rover)
  getScans: () => apiFetch('/scans'),
  deleteScan: (id) => apiFetch(`/scans/${id}`, { method: 'DELETE' }),
  updateScan: (id, body) => apiFetch(`/scans/${id}`, { method: 'PUT', body }),
}
