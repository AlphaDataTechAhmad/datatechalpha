import { useState, useEffect } from 'react';

export const useTestMode = () => {
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const handleBodyClassChange = () => {
      setIsTestMode(document.body.classList.contains('test-mode'));
    };

    // Create a MutationObserver to watch for class changes on body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          handleBodyClassChange();
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    handleBodyClassChange(); // Initial check

    return () => observer.disconnect();
  }, []);

  return { isTestMode };
};