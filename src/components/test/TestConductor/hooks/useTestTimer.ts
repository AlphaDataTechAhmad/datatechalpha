import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTestTimerProps {
  initialTime: number; // in seconds
  onTimeUp?: () => void;
  autoStart?: boolean;
  countDown?: boolean;
  updateInterval?: number; // in milliseconds
}

export const useTestTimer = ({
  initialTime,
  onTimeUp,
  autoStart = true,
  countDown = true,
  updateInterval = 1000,
}: UseTestTimerProps) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Handle time updates
  const updateTime = useCallback(() => {
    if (!isRunning || isPaused) return;

    timerRef.current = window.setTimeout(() => {
      setTime((prevTime) => {
        const newTime = countDown ? prevTime - 1 : prevTime + 1;
        
        // Check if time is up for countdown
        if (countDown && newTime <= 0) {
          setIsRunning(false);
          onTimeUp?.();
          return 0;
        }
        
        return newTime;
      });

      // Update elapsed time
      if (startTime) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }

      // Continue the timer
      if (isRunning && !isPaused) {
        updateTime();
      }
    }, updateInterval);
  }, [isRunning, isPaused, countDown, startTime, updateInterval, onTimeUp]);

  // Start the timer
  const startTimer = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    setIsPaused(false);
    setStartTime((prevStartTime) => prevStartTime || Date.now());
    
    // If we're resuming from a pause, don't reset the start time
    if (!startTime) {
      setStartTime(Date.now());
    }
    
    updateTime();
  }, [isRunning, startTime, updateTime]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (!isRunning || isPaused) return;
    
    setIsPaused(true);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [isRunning, isPaused]);

  // Resume the timer
  const resumeTimer = useCallback(() => {
    if (isRunning && isPaused) {
      setIsPaused(false);
      updateTime();
    }
  }, [isRunning, isPaused, updateTime]);

  // Reset the timer
  const resetTimer = useCallback((newTime = initialTime) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    setTime(newTime);
    setElapsedTime(0);
    setStartTime(null);
    setIsRunning(autoStart);
    setIsPaused(false);
    
    if (autoStart) {
      setStartTime(Date.now());
    }
  }, [autoStart, initialTime]);

  // Add or subtract time
  const adjustTime = useCallback((seconds: number) => {
    setTime((prevTime) => {
      const newTime = prevTime + seconds;
      return newTime < 0 ? 0 : newTime;
    });
  }, []); 

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Auto-start the timer if needed
  useEffect(() => {
    if (autoStart) {
      startTimer();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [autoStart, startTimer]);

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseTimer();
      } else if (!isPaused) {
        resumeTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPaused, pauseTimer, resumeTimer]);

  return {
    time,
    formattedTime: formatTime(time),
    isRunning,
    isPaused,
    elapsedTime,
    formattedElapsedTime: formatTime(elapsedTime),
    start: startTimer,
    pause: pauseTimer,
    resume: resumeTimer,
    reset: resetTimer,
    adjustTime,
    setTime: (newTime: number) => {
      setTime(newTime);
      if (newTime <= 0 && countDown) {
        setIsRunning(false);
        onTimeUp?.();
      }
    },
  };
};

export default useTestTimer;
