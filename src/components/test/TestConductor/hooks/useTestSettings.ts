import { useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export interface TestSettings {
  // Display settings
  theme: ThemePreference;
  fontSize: FontSize;
  highContrast: boolean;
  colorBlindMode: ColorBlindMode;
  
  // Navigation settings
  confirmBeforeSubmit: boolean;
  confirmBeforeNavigation: boolean;
  autoMoveNext: boolean;
  
  // Accessibility settings
  screenReaderEnabled: boolean;
  keyboardNavigation: boolean;
  reduceAnimations: boolean;
  
  // Question settings
  showQuestionNumbers: boolean;
  showAnswerExplanations: boolean;
  showCorrectAnswers: boolean;
  
  // Timer settings
  showTimer: boolean;
  timerPosition: 'top' | 'bottom' | 'floating';
  warnWhenTimeLow: boolean;
  timeLowThreshold: number; // in seconds
  
  // Review settings
  allowMarkForReview: boolean;
  allowBookmarking: boolean;
  showBookmarkedOnly: boolean;
  showIncorrectOnly: boolean;
  
  // Layout settings
  fullScreen: boolean;
  sidebarOpen: boolean;
  questionPanelOpen: boolean;
  
  // Advanced settings
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  preventCopyPaste: boolean;
  preventTabSwitch: boolean;
  tabSwitchLimit: number;
}

const DEFAULT_SETTINGS: TestSettings = {
  // Display settings
  theme: 'system',
  fontSize: 'medium',
  highContrast: false,
  colorBlindMode: 'none',
  
  // Navigation settings
  confirmBeforeSubmit: true,
  confirmBeforeNavigation: true,
  autoMoveNext: false,
  
  // Accessibility settings
  screenReaderEnabled: false,
  keyboardNavigation: true,
  reduceAnimations: false,
  
  // Question settings
  showQuestionNumbers: true,
  showAnswerExplanations: true,
  showCorrectAnswers: false, // Only show after submission
  
  // Timer settings
  showTimer: true,
  timerPosition: 'top',
  warnWhenTimeLow: true,
  timeLowThreshold: 300, // 5 minutes
  
  // Review settings
  allowMarkForReview: true,
  allowBookmarking: true,
  showBookmarkedOnly: false,
  showIncorrectOnly: false,
  
  // Layout settings
  fullScreen: false,
  sidebarOpen: true,
  questionPanelOpen: true,
  
  // Advanced settings
  autoSave: true,
  autoSaveInterval: 30, // seconds
  preventCopyPaste: true,
  preventTabSwitch: true,
  tabSwitchLimit: 3,
};

const STORAGE_KEY = 'test_settings';

export const useTestSettings = (initialSettings?: Partial<TestSettings>) => {
  const [settings, setSettings] = useState<TestSettings>(() => {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved), ...initialSettings };
        }
      } catch (error) {
        console.error('Failed to load test settings:', error);
      }
    }
    
    // Fall back to defaults and initial settings
    return { ...DEFAULT_SETTINGS, ...initialSettings };
  });
  
  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save test settings:', error);
    }
  }, [settings]);
  
  // Update a specific setting
  const updateSetting = useCallback(<K extends keyof TestSettings>(
    key: K,
    value: TestSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);  
  
  // Update multiple settings at once
  const updateSettings = useCallback((updates: Partial<TestSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  
  // Reset all settings to defaults
  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS, ...initialSettings });
  }, [initialSettings]);
  
  // Toggle a boolean setting
  const toggleSetting = useCallback(<K extends keyof TestSettings>(
    key: K,
    value?: boolean
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value !== undefined ? value : !prev[key]
    }));
  }, []);
  
  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-system');
    root.classList.remove(
      'color-blind-protanopia',
      'color-blind-deuteranopia',
      'color-blind-tritanopia',
      'color-blind-achromatopsia'
    );
    
    // Add current theme class
    if (settings.theme === 'system') {
      root.classList.add('theme-system');
    } else {
      root.classList.add(`theme-${settings.theme}`);
    }
    
    // Apply color blind mode if enabled
    if (settings.colorBlindMode !== 'none') {
      root.classList.add(`color-blind-${settings.colorBlindMode}`);
    }
    
    // Apply high contrast if enabled
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply font size
    root.style.setProperty('--font-size', {
      small: '14px',
      medium: '16px',
      large: '18px',
    }[settings.fontSize]);
    
    // Apply reduced motion if needed
    if (settings.reduceAnimations) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
  }, [settings.theme, settings.colorBlindMode, settings.highContrast, settings.fontSize, settings.reduceAnimations]);
  
  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    toggleSetting,
  };
};

export default useTestSettings;
