import { useState, useEffect, useCallback } from 'react';

interface AccessibilitySettings {
  // Screen reader announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  
  // Focus management
  focusElement: (id: string) => void;
  
  // High contrast mode
  highContrast: boolean;
  toggleHighContrast: () => void;
  
  // Font size
  fontSize: 'small' | 'medium' | 'large';
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  
  // Color blind modes
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  setColorBlindMode: (mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia') => void;
  
  // Animations
  reduceMotion: boolean;
  toggleReduceMotion: () => void;
  
  // Keyboard navigation
  isKeyboardNavigation: boolean;
  toggleKeyboardNavigation: () => void;
  
  // Focus indicators
  showFocusIndicators: boolean;
  toggleFocusIndicators: (show?: boolean) => void;
  
  // Text-to-speech
  isTextToSpeechEnabled: boolean;
  toggleTextToSpeech: (enabled?: boolean) => void;
  
  // Reset all accessibility settings
  resetAccessibility: () => void;
}

// Default settings
const DEFAULT_ACCESSIBILITY_SETTINGS = {
  highContrast: false,
  fontSize: 'medium' as const,
  colorBlindMode: 'none' as const,
  reduceMotion: false,
  isKeyboardNavigation: true,
  showFocusIndicators: true,
  isTextToSpeechEnabled: false,
};

// Local storage key
const STORAGE_KEY = 'test_accessibility_settings';

export const useAccessibility = (): AccessibilitySettings => {
  const [settings, setSettings] = useState(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...JSON.parse(saved) };
        }
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    }
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  });
  
  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  }, [settings]);
  
  // Apply accessibility settings to the document
  useEffect(() => {
    const { highContrast, fontSize, colorBlindMode, reduceMotion, showFocusIndicators } = settings;
    const root = document.documentElement;
    
    // Apply high contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply font size
    root.style.setProperty('--font-size', {
      small: '14px',
      medium: '16px',
      large: '18px',
    }[fontSize]);
    
    // Apply color blind mode
    root.classList.remove(
      'color-blind-protanopia',
      'color-blind-deuteranopia',
      'color-blind-tritanopia',
      'color-blind-achromatopsia'
    );
    
    if (colorBlindMode !== 'none') {
      root.classList.add(`color-blind-${colorBlindMode}`);
    }
    
    // Apply reduced motion
    if (reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Apply focus indicators
    if (showFocusIndicators) {
      root.classList.add('show-focus-indicators');
    } else {
      root.classList.remove('show-focus-indicators');
    }
    
    // Add keyboard navigation class if enabled
    if (settings.isKeyboardNavigation) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }
    
  }, [settings]);
  
  // Announce messages to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('role', 'status');
    announcement.style.position = 'absolute';
    announcement.style.left = '-9999px';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove the announcement after a short delay
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 100);
  }, []);
  
  // Focus management
  const focusElement = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.focus({ preventScroll: true });
      
      // Announce the focused element for screen readers
      if (element.getAttribute('aria-label')) {
        announce(element.getAttribute('aria-label') || '');
      } else if (element.textContent) {
        announce(element.textContent);
      }
    }
  }, [announce]);
  
  // Toggle high contrast mode
  const toggleHighContrast = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      highContrast: !prev.highContrast
    }));
  }, []);
  
  // Font size controls
  const increaseFontSize = useCallback(() => {
    setSettings(prev => {
      const sizes = ['small', 'medium', 'large'] as const;
      const currentIndex = sizes.indexOf(prev.fontSize);
      const newSize = sizes[Math.min(currentIndex + 1, sizes.length - 1)];
      return { ...prev, fontSize: newSize };
    });
  }, []);
  
  const decreaseFontSize = useCallback(() => {
    setSettings(prev => {
      const sizes = ['small', 'medium', 'large'] as const;
      const currentIndex = sizes.indexOf(prev.fontSize);
      const newSize = sizes[Math.max(currentIndex - 1, 0)];
      return { ...prev, fontSize: newSize };
    });
  }, []);
  
  const setFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    setSettings(prev => ({
      ...prev,
      fontSize: size
    }));
  }, []);
  
  // Color blind mode
  const setColorBlindMode = useCallback((mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia') => {
    setSettings(prev => ({
      ...prev,
      colorBlindMode: mode
    }));
  }, []);
  
  // Reduce motion
  const toggleReduceMotion = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      reduceMotion: !prev.reduceMotion
    }));
  }, []);
  
  // Keyboard navigation
  const toggleKeyboardNavigation = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      isKeyboardNavigation: !prev.isKeyboardNavigation
    }));
  }, []);
  
  // Focus indicators
  const toggleFocusIndicators = useCallback((show?: boolean) => {
    setSettings(prev => ({
      ...prev,
      showFocusIndicators: show !== undefined ? show : !prev.showFocusIndicators
    }));
  }, []);
  
  // Text-to-speech
  const toggleTextToSpeech = useCallback((enabled?: boolean) => {
    setSettings(prev => ({
      ...prev,
      isTextToSpeechEnabled: enabled !== undefined ? enabled : !prev.isTextToSpeechEnabled
    }));
  }, []);
  
  // Reset all accessibility settings
  const resetAccessibility = useCallback(() => {
    setSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
  }, []);
  
  return {
    announce,
    focusElement,
    highContrast: settings.highContrast,
    toggleHighContrast,
    fontSize: settings.fontSize,
    increaseFontSize,
    decreaseFontSize,
    setFontSize,
    colorBlindMode: settings.colorBlindMode,
    setColorBlindMode,
    reduceMotion: settings.reduceMotion,
    toggleReduceMotion,
    isKeyboardNavigation: settings.isKeyboardNavigation,
    toggleKeyboardNavigation,
    showFocusIndicators: settings.showFocusIndicators,
    toggleFocusIndicators,
    isTextToSpeechEnabled: settings.isTextToSpeechEnabled,
    toggleTextToSpeech,
    resetAccessibility,
  };
};

export default useAccessibility;
