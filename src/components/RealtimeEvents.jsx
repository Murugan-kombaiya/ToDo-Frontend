import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { socket } from '../socket';

export default function RealtimeEvents() {
  useEffect(() => {
    const onAuth = () => {
      // Optional: toast.info('Realtime connected');
    };
    const onAuthError = () => {
      // Optional: toast.error('Realtime auth failed');
    };

    const notifyRefresh = () => {
      window.dispatchEvent(new CustomEvent('tasks:refresh'));
    };

    const onTaskCreated = (task) => {
      toast.success(`Task created: ${task.title}`);
      notifyRefresh();
    };
    const onTaskUpdated = (task) => {
      toast.info(`Task updated: ${task.title}`);
      notifyRefresh();
    };
    const onTaskDeleted = ({ id }) => {
      toast.warn(`Task deleted (ID ${id})`);
      notifyRefresh();
    };

    const onNotification = (n) => {
      if (!n) return;
      if (n.type === 'TASK_ASSIGNED') {
        toast.success(`Assigned: ${n.message || ''}`);
      } else if (n.type === 'TASK_UNASSIGNED') {
        toast.info(n.message || 'You were unassigned from a task');
      } else {
        toast(n.title || 'Notification');
      }
    };

    socket.on('authenticated', onAuth);
    socket.on('auth_error', onAuthError);
    socket.on('task_created', onTaskCreated);
    socket.on('task_updated', onTaskUpdated);
    socket.on('task_deleted', onTaskDeleted);
    socket.on('notification', onNotification);

    return () => {
      socket.off('authenticated', onAuth);
      socket.off('auth_error', onAuthError);
      socket.off('task_created', onTaskCreated);
      socket.off('task_updated', onTaskUpdated);
      socket.off('task_deleted', onTaskDeleted);
      socket.off('notification', onNotification);
    };
  }, []);

  return null;
}
