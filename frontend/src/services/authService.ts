import api from './api';
import { User } from '../types';

export async function getMe(): Promise<User | null> {
  try {
    const res = await api.get('/auth/me');
    return res.data.user;
  } catch {
    return null;
  }
}

export function loginWithGoogle(): void {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  window.location.href = `${apiUrl}/auth/google`;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}
