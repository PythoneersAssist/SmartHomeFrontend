import type {
  Automation,
  AutomationCreateInput,
  AutomationUpdateInput,
  Device,
  DeviceCreateInput,
  DeviceUpdateInput,
  House,
  HouseholdEnergy,
  Notification,
  Room,
  RoomCreateInput,
  RoomUpdateInput,
} from '../types/domain';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('smarthome_session');
    if (!raw) return null;
    const session = JSON.parse(raw) as { accessToken?: string };
    return session.accessToken ?? null;
  } catch {
    return null;
  }
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (!headers['Content-Type'] && !(options?.body instanceof URLSearchParams)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && path !== '/token') {
      localStorage.removeItem('smarthome_session');
      window.location.href = '/login';
      throw new Error('Session expired. Please sign in again.');
    }
    const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(payload?.detail ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

type TokenResponse = { access_token: string; token_type: string };
type UserResponse = { id: string; username: string; email: string; registered_at: string };
type HousesResponse = { message: string; houses: { id: string; name: string; description: string }[] };
type RoomsResponse = { message: string; rooms: { id: string; name: string; floor: string; house_id: string }[] };

export const backendApi = {
  // Auth — OAuth2 form-based login
  login: (username: string, password: string) => {
    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);
    return apiRequest<TokenResponse>('/token', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },

  // Users
  register: (payload: { username: string; email: string; password: string }) =>
    apiRequest<{ message: string }>('/user/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => apiRequest<UserResponse>('/user/get'),

  updateUser: (payload: { id: string; username?: string; email?: string; password?: string }) =>
    apiRequest<{ message: string }>('/user/update/', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Houses
  getHouses: async (): Promise<House[]> => {
    const resp = await apiRequest<HousesResponse>('/home/get');
    return resp.houses;
  },

  createHouse: (payload: { name: string; description?: string }) =>
    apiRequest<{ message: string }>('/home/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateHouse: (payload: { house_id: string; name?: string; description?: string }) =>
    apiRequest<{ message: string }>('/home/update', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteHouse: (houseId: string) =>
    apiRequest<{ message: string }>(`/home/delete/${houseId}`, {
      method: 'DELETE',
    }),

  // Rooms
  getRooms: async (houseId: string): Promise<Room[]> => {
    const resp = await apiRequest<RoomsResponse>(`/rooms/get_by_house_id/${houseId}`);
    return resp.rooms;
  },

  getRoomDetail: async (roomId: string): Promise<Room & { devices: Device[] }> => {
    const resp = await apiRequest<{ message: string; room: Room & { devices: Device[] } }>(`/rooms/get_by_room_id/${roomId}`);
    return resp.room;
  },

  createRoom: (payload: RoomCreateInput) =>
    apiRequest<{ message: string }>('/rooms/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateRoom: (payload: RoomUpdateInput) =>
    apiRequest<{ message: string }>('/rooms/update', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteRoom: (roomId: string) =>
    apiRequest<{ message: string }>(`/rooms/delete/${roomId}`, {
      method: 'DELETE',
    }),

  // Devices
  getDevices: async (): Promise<Device[]> => {
    return apiRequest<Device[]>('/devices/get');
  },

  createDevice: (payload: DeviceCreateInput) =>
    apiRequest<void>('/devices/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateDevice: (payload: DeviceUpdateInput) =>
    apiRequest<void>('/devices/update', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteDevice: (deviceId: string) =>
    apiRequest<void>(`/devices/delete/${deviceId}`, {
      method: 'DELETE',
    }),

  // Automations
  getAutomations: async (): Promise<Automation[]> => {
    const resp = await apiRequest<{ message: string; automations: Automation[] }>('/automations/get');
    return resp.automations;
  },

  createAutomation: (payload: AutomationCreateInput) =>
    apiRequest<{ message: string }>('/automations/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAutomation: (payload: AutomationUpdateInput) =>
    apiRequest<{ message: string }>('/automations/update', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteAutomation: (automationId: string) =>
    apiRequest<{ message: string }>(`/automations/delete/${automationId}`, {
      method: 'DELETE',
    }),

  // Energy
  getHouseholdEnergy: (houseId: string) =>
    apiRequest<HouseholdEnergy>(`/energy/household/${houseId}`),

  // Notifications
  getNotifications: async (): Promise<Notification[]> => {
    const resp = await apiRequest<{ message: string; notifications: Notification[] }>('/notifications/get');
    return resp.notifications;
  },

  getUnreadCount: () =>
    apiRequest<{ unread_count: number }>('/notifications/unread_count'),

  markNotificationRead: (notificationId: string) =>
    apiRequest<{ message: string }>(`/notifications/mark_read/${notificationId}`, {
      method: 'PATCH',
    }),

  markAllNotificationsRead: () =>
    apiRequest<{ message: string }>('/notifications/mark_all_read', {
      method: 'PATCH',
    }),

  deleteNotification: (notificationId: string) =>
    apiRequest<{ message: string }>(`/notifications/delete/${notificationId}`, {
      method: 'DELETE',
    }),
};
