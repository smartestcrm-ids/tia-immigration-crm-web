const API_BASE = import.meta.env.VITE_API_BASE || '';
const TOKEN_KEY = 'phase1.authToken';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

class HttpError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (res.status === 401) {
    setToken(null);
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
    throw new HttpError('Unauthorized', 401, data?.details);
  }
  if (!res.ok) {
    throw new HttpError(data?.error || res.statusText, res.status, data?.details);
  }
  return data;
}

export const api = {
  health: () => request('GET', '/api/health'),

  login: (email, password) => request('POST', '/api/auth/login', { email, password }),
  me: () => request('GET', '/api/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('POST', '/api/auth/change-password', { currentPassword, newPassword }),
  registerUser: (data) => request('POST', '/api/auth/register', data),

  inbox: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/api/inbox${qs ? '?' + qs : ''}`);
  },
  conversation: (id) => request('GET', `/api/conversations/${id}`),
  sendMessage: (id, body) => request('POST', `/api/conversations/${id}/messages`, { body }),
  markRead: (id) => request('POST', `/api/conversations/${id}/read`),

  leads: (params = {}) => {
    // Strip empty values so we don't send status= (which the backend would treat as filter).
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
    const qs = new URLSearchParams(clean).toString();
    return request('GET', `/api/leads${qs ? '?' + qs : ''}`);
  },
  lead: (id) => request('GET', `/api/leads/${id}`),
  updateLead: (id, data) => request('PATCH', `/api/leads/${id}`, data),
  createLead: (data) => request('POST', '/api/leads', data),

  notes: (leadId) => request('GET', `/api/leads/${leadId}/notes`),
  addNote: (leadId, body) => request('POST', `/api/leads/${leadId}/notes`, { body }),

  reminders: (leadId) => request('GET', `/api/leads/${leadId}/reminders`),
  addReminder: (leadId, data) => request('POST', `/api/leads/${leadId}/reminders`, data),
  updateReminder: (leadId, reminderId, data) =>
    request('PATCH', `/api/leads/${leadId}/reminders/${reminderId}`, data),

  users: () => request('GET', '/api/users'),
  updateUser: (id, data) => request('PATCH', `/api/users/${id}`, data),
  caseTypes: () => request('GET', '/api/case-types'),

  // Roles & Permissions
  roles: () => request('GET', '/api/roles'),
  permissions: () => request('GET', '/api/roles/permissions'),
  createRole: (data) => request('POST', '/api/roles', data),
  updateRole: (id, data) => request('PATCH', `/api/roles/${id}`, data),
  deleteRole: (id) => request('DELETE', `/api/roles/${id}`),

  // Client profile / family / documents
  clientProfile: (leadId) => request('GET', `/api/leads/${leadId}/profile`),
  updateClientProfile: (leadId, data) => request('PUT', `/api/leads/${leadId}/profile`, data),
  addFamilyMember: (leadId, data) => request('POST', `/api/leads/${leadId}/family`, data),
  updateFamilyMember: (leadId, memberId, data) =>
    request('PATCH', `/api/leads/${leadId}/family/${memberId}`, data),
  deleteFamilyMember: (leadId, memberId) =>
    request('DELETE', `/api/leads/${leadId}/family/${memberId}`),
  uploadDocument: (leadId, data) => request('POST', `/api/leads/${leadId}/documents`, data),
  deleteDocument: (leadId, docId) => request('DELETE', `/api/leads/${leadId}/documents/${docId}`),
  documentDownloadUrl: (leadId, docId) => `/api/leads/${leadId}/documents/${docId}`,

  // Channel accounts
  channelAccounts: () => request('GET', '/api/channel-accounts'),
  createChannelAccount: (data) => request('POST', '/api/channel-accounts', data),
  updateChannelAccount: (id, data) => request('PATCH', `/api/channel-accounts/${id}`, data),
  deleteChannelAccount: (id) => request('DELETE', `/api/channel-accounts/${id}`),

  // Reports
  reportSummary: () => request('GET', '/api/reports/summary'),

  // Messaging
  messagingStatus: () => request('GET', '/api/messaging/status'),
  sendEmail: (data) => request('POST', '/api/messaging/email', data),

  // Cases (post-contract workflow)
  caseStages: () => request('GET', '/api/cases/stages'),
  cases: () => request('GET', '/api/cases'),
  caseForLead: (leadId) => request('GET', `/api/cases/lead/${leadId}`),
  caseById: (id) => request('GET', `/api/cases/${id}`),
  createCase: (leadId) => request('POST', '/api/cases', { leadId }),
  updateCase: (id, data) => request('PATCH', `/api/cases/${id}`, data),
  advanceCase: (id, data) => request('POST', `/api/cases/${id}/advance`, data || {}),
  addRequirement: (caseId, data) => request('POST', `/api/cases/${caseId}/requirements`, data),
  updateRequirement: (caseId, reqId, data) =>
    request('PATCH', `/api/cases/${caseId}/requirements/${reqId}`, data),
  deleteRequirement: (caseId, reqId) =>
    request('DELETE', `/api/cases/${caseId}/requirements/${reqId}`),
};
