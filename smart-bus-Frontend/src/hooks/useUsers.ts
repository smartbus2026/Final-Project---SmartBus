// src/hooks/useUsers.ts
import { useState, useEffect, useMemo } from 'react';
import { userService } from '../services/userService';

export const useUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getAllUsers();
      setUsers(res.data);
    } catch (e) {
      setToast({ msg: 'Failed to sync database', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const deleteUserAction = async (id: string) => {
    try {
      await userService.deleteUser(id);
      setUsers(prev => prev.filter(u => u._id !== id));
      setToast({ msg: ' User removed successfully', type: 'success' });
    } catch (e) {
      setToast({ msg: ' Delete failed', type: 'error' });
    }
  };

  const updateUserAction = async (id: string, data: any) => {
    try {
      await userService.updateUser(id, data);
      await fetchUsers();
      setToast({ msg: ' Profile updated', type: 'success' });
    } catch (e) {
      setToast({ msg: ' Update failed', type: 'error' });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.student_id?.includes(searchQuery)
    );
  }, [users, searchQuery]);

  return {
    users: filteredUsers,
    isLoading,
    searchQuery,
    setSearchQuery,
    toast,
    deleteUserAction,
    updateUserAction
  };
};