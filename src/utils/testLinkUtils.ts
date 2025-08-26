import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

export interface TestLinkData {
  testId: string;
  registrationId: string;
  userId: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  status: 'scheduled' | 'active' | 'completed' | 'expired';
  createdAt: string;
}

export function generateTestLink(registrationId: string, userId: string): string {
  const baseUrl = window.location.origin;
  const testId = uuidv4().substring(0, 8); // Short unique ID for the test
  return `${baseUrl}/test/${testId}`;
}

export function getTestStatus(startTime: string, endTime: string): 'scheduled' | 'active' | 'completed' | 'expired' {
  const now = dayjs();
  const start = dayjs(startTime);
  const end = dayjs(endTime);

  if (now.isBefore(start)) return 'scheduled';
  if (now.isAfter(end)) return 'expired';
  if (now.isBetween(start, end)) return 'active';
  return 'completed';
}

export function formatTimeRemaining(endTime: string): string {
  const now = dayjs();
  const end = dayjs(endTime);
  const diff = end.diff(now, 'minute');
  
  if (diff <= 0) return 'Time\'s up!';
  
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  
  if (hours > 0) {
    return `Time remaining: ${hours}h ${minutes}m`;
  }
  return `Time remaining: ${minutes} minutes`;
}

export function validateTestTiming(startTime: string, endTime: string): { valid: boolean; message?: string } {
  const start = dayjs(startTime);
  const end = dayjs(endTime);
  const now = dayjs();

  if (end.isBefore(start)) {
    return { valid: false, message: 'End time must be after start time' };
  }

  if (end.isBefore(now)) {
    return { valid: false, message: 'End time must be in the future' };
  }

  return { valid: true };
}
