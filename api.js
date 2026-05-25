/**
 * api.js — Frontend API client for Railway backend
 * Load this FIRST, before any other script in admin.html / portofolio.html
 *
 * Railway URL: https://portofolio-production-035c.up.railway.app
 */

const BASE_URL = 'https://portofolio-production-035c.up.railway.app';

// ─── Token helpers ───────────────────────────────────────────────────────────
const Auth = {
  setToken(token) { localStorage.setItem('jwt_token', token); },
  getToken()      { return localStorage.getItem('jwt_token'); },
  clearToken()    { localStorage.removeItem('jwt_token'); },
  isLoggedIn()    { return !!localStorage.getItem('jwt_token'); },
};

// ─── Core fetch wrapper ──────────────────────────────────────────────────────
async function _request(method, path, body = null, isFormData = false) {
  const headers = {};
  const token = Auth.getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    credentials: 'include',
    body: isFormData ? body : (body ? JSON.stringify(body) : null),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── API object ──────────────────────────────────────────────────────────────



const API = {

  // ── Auth ──────────────────────────────────────────────────────────────────
  async login(email, password) {
    const data = await _request('POST', '/api/auth/login', { email, password });
    // data expected: { token, user }
    if (data.token) Auth.setToken(data.token);
    return data;
  },

  // ── Photos ────────────────────────────────────────────────────────────────
  // Returns: [ { _id, url, category, createdAt }, ... ]
  async getPhotos() {
    return _request('GET', '/api/photos');
  },

  // file: File object, category: 'profile-main' | 'proj-0-img-2' etc.
  // Returns: { _id, url, category }
 async uploadPhoto(file, category) {
  const fd = new FormData();
  fd.append('photo', file);        // must match multer: upload.single('photo')
  fd.append('category', category);
  return _request('POST', '/api/photos/upload', fd, true);  // correct URL
},

  // photoId: the _id string from the photo object
  async deletePhoto(photoId) {
    return _request('DELETE', '/api/photos/' + photoId);
  },

  // ── Projects ──────────────────────────────────────────────────────────────
  // Returns: [ { _id, name, order }, ... ]
  async getProjects() {
    return _request('GET', '/api/projects');
  },

  // name: string
  // Returns: { _id, name, order }
  async createProject(name) {
    return _request('POST', '/api/projects', { name });
  },

  // projectId: _id string
  async deleteProject(projectId) {
    return _request('DELETE', '/api/projects/' + projectId);
  },

  uploadModel(projectId, file) {
    const fd = new FormData();
    fd.append('model', file);
    return _request('POST', '/api/projects/' + projectId + '/model', fd, true);
  },

  // ── About ─────────────────────────────────────────────────────────────────
  async getAbout() {
    return _request('GET', '/api/about');
  },

  async saveAbout(data) {
    return _request('POST', '/api/about', data);
  },
};