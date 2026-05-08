'use client';
import { useState, useEffect } from 'react';
import { User } from '../types';
import { getMe } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading, setUser };
}
