import { useState } from 'react';
import Api from '../services/Api';

export const useAdminNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });

  
  const [history, setHistory] = useState<any[]>([]); 

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: null }), 3000);
  };

  const sendBroadcast = async (data: { title: string; message: string; target: string }) => {
    if (!data.title || !data.message) {
      showToast('Please fill in both subject and message.', 'error');
      return false;
    }
    
    setIsLoading(true);
    try {
      const res = await Api.post('/notifications/broadcast', data);
      showToast(res.data.message || 'Notification sent successfully!', 'success');
      
     
      setHistory(prev => [{
        id: `N-${Math.floor(Math.random() * 10000)}`,
        title: data.title,
        message: data.message,
        target: data.target,
        time: new Date().toLocaleTimeString(),
        readCount: 0
      }, ...prev]);
      
      return true;
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to send notification', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, toast, history, setHistory, sendBroadcast };
};