/**
 * Validation utility functions for library management system
 */

/**
 * Validates ISBN format (10 or 13 digits)
 */
export function validateISBN(isbn: string): boolean {
    if (!isbn) {
        return false;
    }

    const cleanISBN = isbn.replace(/-/g, '');
    const isbnPattern = /^(?:\d{10}|\d{13})$/;

    return isbnPattern.test(cleanISBN);
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
    if (!email) {
        return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

/**
 * Validates phone number (10 digits)
 */
export function validatePhone(phone: string): boolean {
    if (!phone) {
        return false;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 10;
}

/**
 * Validates year is within reasonable range
 */
export function validatePublishYear(year: number): boolean {
    const currentYear = new Date().getFullYear();
    return year >= 1000 && year <= currentYear;
}

/**
 * Formats currency value
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
}

/**
 * Calculates fine based on days overdue
 */
export function calculateFine(daysOverdue: number, dailyRate: number = 10): number {
    if (daysOverdue <= 0) {
        return 0;
    }

    return daysOverdue * dailyRate;
}

/**
 * Sanitizes string input by trimming and removing extra spaces
 */
export function sanitizeString(input: string): string {
    if (!input) {
        return '';
    }

    return input.trim().replace(/\s+/g, ' ');
}

/**
 * Generates unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Checks if date is in the past
 */
export function isDateInPast(date: Date): boolean {
    return date < new Date();
}

/**
 * Calculates days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    return Math.floor((utc2 - utc1) / msPerDay);
}
