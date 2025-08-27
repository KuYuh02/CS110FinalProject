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
  
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Making API request to: ${url}`);
  console.log('Request options:', { ...options, headers });
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  console.log(`Response status: ${response.status}`);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API error response:', error);
    throw new Error(error.error || 'Something went wrong');
  }
  
  const data = await response.json();
  console.log('API response data:', data);
  return data;
};

export const authAPI = {
  register: (userData) => {
    console.log('Making registration request with data:', userData);
    return apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  login: (credentials) => {
    console.log('Making login request with credentials:', credentials);
    return apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }
};

export const photosAPI = {
  getAll: () => apiRequest('/photos'),
  create: (photoData) => apiRequest('/photos', {
    method: 'POST',
    body: JSON.stringify(photoData)
  }),
  update: (id, photoData) => apiRequest(`/photos/${id}`, {
    method: 'PUT',
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
  }),
  follow: (id) => apiRequest(`/users/${id}/follow`, {
    method: 'POST'
  })
};

export const searchAPI = {
  search: (query) => apiRequest(`/search?q=${encodeURIComponent(query)}`)
};