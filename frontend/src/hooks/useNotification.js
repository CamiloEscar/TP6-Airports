import { useState, useCallback, useRef } from 'react';

export function useNotification(duration = 3000) {
  const [notification, setNotification] = useState(null);
  const timerRef = useRef(null);

  const showNotification = useCallback(
    (message, isError = false) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setNotification({ message, isError });

      timerRef.current = setTimeout(() => {
        setNotification(null);
        timerRef.current = null;
      }, duration);
    },
    [duration],
  );

  return [notification, showNotification];
}
