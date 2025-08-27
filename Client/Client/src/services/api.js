const API_BASE_URL = 'http://localhost:3000/api';

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Something went wrong');
  }
  
  return response.json();
};

export const authAPI = {
  register: (userData) => apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  login: (credentials) => apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  })
};

export const photosAPI = {
  getAll: () => apiRequest('/photos'),
  create: (photoData) => apiRequest('/photos', {
    method: 'POST',
    body: JSON.stringify(photoData)
  }),
  like: (id) => apiRequest(`/photos/${id}/like`, {
    method: 'POST'
  }),
  comment: (id, text) => apiRequest(`/photos/${id}/comment`, {
    method: 'POST',
    body: JSON.stringify({ text })
  }),
  delete: (id) => apiRequest(`/photos/${id}`, {
    method: 'DELETE'
  })
};

export const usersAPI = {
  getById: (id) => apiRequest(`/users/${id}`),
  update: (id, userData) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  })
};

export const searchAPI = {
  search: (query) => apiRequest(`/search?q=${encodeURIComponent(query)}`)
};