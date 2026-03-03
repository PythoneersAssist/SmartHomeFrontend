import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: '/',
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const register = async (payload: RegisterPayload) => {
  const response = await api.post('/user/create', payload);
  return response.data;
};

export const login = async (payload: LoginPayload) => {
  const formData = new URLSearchParams();
  formData.append('username', payload.username);
  formData.append('password', payload.password);
  const response = await api.post<TokenResponse>('/token', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

export default api;
