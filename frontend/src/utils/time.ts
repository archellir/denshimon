/**
 * Time utility functions for parsing and converting time ranges
 */

import { TimeRange } from '@constants';

/**
 * Parses a time range string and converts it to hours
 * @param timeRange - Time range string like '5m', '1h', '24h', '7d', '30d'
 * @returns Number of hours
 */
export const parseTimeRangeToHours = (timeRange: string): number => {
  // Extract numeric value and unit
  const matches = timeRange.match(/^(\d+)([mhd])$/);
  
  if (!matches) {
    // Invalid time range format, defaulting to 24 hours
    return 24;
  }
  
  const [, valueStr, unit] = matches;
  const value = parseInt(valueStr, 10);
  
  switch (unit) {
    case 'm': // minutes
      return Math.max(1, Math.round(value / 60));
    case 'h': // hours
      return value;
    case 'd': // days
      return value * 24;
    default:
      return 24;
  }
};

/**
 * Parses a time range string and converts it to milliseconds
 * @param timeRange - Time range string like '5m', '1h', '24h', '7d', '30d'
 * @returns Number of milliseconds
 */
export const parseTimeRangeToMs = (timeRange: string): number => {
  const hours = parseTimeRangeToHours(timeRange);
  return hours * 60 * 60 * 1000;
};

/**
 * Parses a time range string and converts it to seconds
 * @param timeRange - Time range string like '5m', '1h', '24h', '7d', '30d'
 * @returns Number of seconds
 */
export const parseTimeRangeToSeconds = (timeRange: string): number => {
  const hours = parseTimeRangeToHours(timeRange);
  return hours * 60 * 60;
};

/**
 * Gets a human-readable label for a time range
 * @param timeRange - Time range string like '5m', '1h', '24h', '7d', '30d'
 * @returns Human-readable label like '5 Minutes', '1 Hour', '7 Days'
 */
export const getTimeRangeLabel = (timeRange: string): string => {
  const matches = timeRange.match(/^(\d+)([mhd])$/);
  
  if (!matches) {
    return timeRange;
  }
  
  const [, valueStr, unit] = matches;
  const value = parseInt(valueStr, 10);
  
  switch (unit) {
    case 'm':
      return value === 1 ? '1 Minute' : `${value} Minutes`;
    case 'h':
      return value === 1 ? '1 Hour' : `${value} Hours`;
    case 'd':
      return value === 1 ? '1 Day' : `${value} Days`;
    default:
      return timeRange;
  }
};

/**
 * Converts hours to the appropriate time range string
 * @param hours - Number of hours
 * @returns Time range string like '1h', '24h', '7d'
 */
export const hoursToTimeRange = (hours: number): string => {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  } else if (hours < 24) {
    return `${hours}h`;
  } else if (hours % 24 === 0) {
    return `${hours / 24}d`;
  } else {
    return `${hours}h`;
  }
};

/**
 * Gets the number of data points to display based on time range
 * @param timeRange - Time range string
 * @param intervalMinutes - Interval between data points in minutes (default: 5)
 * @returns Number of data points
 */
export const getDataPointsForTimeRange = (timeRange: string, intervalMinutes: number = 5): number => {
  const hours = parseTimeRangeToHours(timeRange);
  const minutes = hours * 60;
  return Math.ceil(minutes / intervalMinutes);
};

/**
 * Validates if a time range string is in the correct format
 * @param timeRange - Time range string to validate
 * @returns True if valid, false otherwise
 */
export const isValidTimeRange = (timeRange: string): boolean => {
  return /^\d+[mhd]$/.test(timeRange);
};

/**
 * Gets the default time range
 * @returns Default time range constant
 */
export const getDefaultTimeRange = (): string => {
  return TimeRange.ONE_HOUR;
};

/**
 * Compares two time ranges and returns the difference in hours
 * @param timeRange1 - First time range
 * @param timeRange2 - Second time range
 * @returns Difference in hours (positive if timeRange1 > timeRange2)
 */
export const compareTimeRanges = (timeRange1: string, timeRange2: string): number => {
  const hours1 = parseTimeRangeToHours(timeRange1);
  const hours2 = parseTimeRangeToHours(timeRange2);
  return hours1 - hours2;
};

/**
 * Gets a Date object for the start of the time range
 * @param timeRange - Time range string
 * @param endDate - End date (defaults to now)
 * @returns Start date
 */
export const getTimeRangeStartDate = (timeRange: string, endDate: Date = new Date()): Date => {
  const ms = parseTimeRangeToMs(timeRange);
  return new Date(endDate.getTime() - ms);
};

/**
 * Formats a time range for API requests
 * @param timeRange - Time range string
 * @returns Formatted string for API (e.g., 'last_1h', 'last_24h')
 */
export const formatTimeRangeForAPI = (timeRange: string): string => {
  return `last_${timeRange}`;
};