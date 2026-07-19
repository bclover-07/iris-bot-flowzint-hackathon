export const getApiUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL;
  if (!url || (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.includes('localhost'))) {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      url = 'https://iris-bot-web.onrender.com';
    } else {
      url = 'http://localhost:5000';
    }
  }
  return url.replace(/\/$/, '');
};

async function request(path, options = {}) {
  const url = `${getApiUrl()}${path}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  if (config.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.error || data.message || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
