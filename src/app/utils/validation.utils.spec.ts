import { describe, it, expect } from 'vitest';
import {
  validateISBN,
  validateEmail,
  validatePhone,
  validatePublishYear,
  formatCurrency,
  calculateFine,
  sanitizeString,
  generateId,
  isDateInPast,
  daysBetween,
} from './validation.utils';

describe('ValidationUtils', () => {
  describe('validateISBN', () => {
    it('should return true for valid 10-digit ISBN', () => {
      expect(validateISBN('1234567890')).toBe(true);
    });

    it('should return true for valid 13-digit ISBN', () => {
      expect(validateISBN('1234567890123')).toBe(true);
    });

    it('should return true for ISBN with hyphens', () => {
      expect(validateISBN('123-456-789-0')).toBe(true);
    });

    it('should return false for invalid ISBN', () => {
      expect(validateISBN('12345')).toBe(false);
      expect(validateISBN('')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should return true for valid 10-digit phone', () => {
      expect(validatePhone('1234567890')).toBe(true);
    });

    it('should return true for phone with formatting', () => {
      expect(validatePhone('(123) 456-7890')).toBe(true);
    });

    it('should return false for invalid phone', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('validatePublishYear', () => {
    it('should return true for valid year', () => {
      expect(validatePublishYear(2020)).toBe(true);
      expect(validatePublishYear(1950)).toBe(true);
    });

    it('should return false for invalid year', () => {
      expect(validatePublishYear(999)).toBe(false);
      expect(validatePublishYear(2100)).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const result = formatCurrency(1000);
      expect(result).toContain('1,000');
    });
  });

  describe('calculateFine', () => {
    it('should calculate fine correctly', () => {
      expect(calculateFine(5, 10)).toBe(50);
      expect(calculateFine(0, 10)).toBe(0);
      expect(calculateFine(-1, 10)).toBe(0);
    });
  });

  describe('sanitizeString', () => {
    it('should trim and remove extra spaces', () => {
      expect(sanitizeString('  hello   world  ')).toBe('hello world');
      expect(sanitizeString('')).toBe('');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toBeTruthy();
    });
  });

  describe('isDateInPast', () => {
    it('should return true for past date', () => {
      const pastDate = new Date('2020-01-01');
      expect(isDateInPast(pastDate)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date('2030-01-01');
      expect(isDateInPast(futureDate)).toBe(false);
    });
  });

  describe('daysBetween', () => {
    it('should calculate days between dates correctly', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-11');
      expect(daysBetween(date1, date2)).toBe(10);
    });
  });
});
