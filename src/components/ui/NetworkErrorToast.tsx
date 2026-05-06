import { useState, useEffect, useCallback } from 'react';
import Toast from './Toast';

export default function NetworkErrorToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message: msg } = (e as CustomEvent<{ message: string }>).detail;
      setMessage(msg);
    };
    window.addEventListener('api-error', handler);
    return () => window.removeEventListener('api-error', handler);
  }, []);

  const dismiss = useCallback(() => setMessage(null), []);

  if (!message) return null;
  return <Toast message={message} type="error" onClose={dismiss} />;
}
