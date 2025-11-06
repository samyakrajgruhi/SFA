/**
 * Validation utilities for form inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate phone number (exactly 10 digits)
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  // Remove any spaces or special characters
  const cleanedPhone = phone.replace(/\D/g, '');
  
  if (cleanedPhone.length === 0) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  if (cleanedPhone.length !== 10) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits' };
  }
  
  return { isValid: true };
};

/**
 * Validate PF number (exactly 11 digits)
 */
export const validatePfNumber = (pfNumber: string): ValidationResult => {
  // Remove any spaces or special characters
  const cleanedPf = pfNumber.replace(/\D/g, '');
  
  if (cleanedPf.length === 0) {
    return { isValid: false, error: 'PF number is required' };
  }
  
  if (cleanedPf.length !== 11) {
    return { isValid: false, error: 'PF number must be exactly 11 digits' };
  }
  
  return { isValid: true };
};

/**
 * Validate password
 * - At least 8 characters long
 * - At least 1 uppercase letter
 * - At least 1 symbol/special character
 */
export const validatePassword = (password: string): ValidationResult => {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  if (!hasUppercase) {
    return { isValid: false, error: 'Password must contain at least 1 uppercase letter' };
  }
  
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (!hasSymbol) {
    return { isValid: false, error: 'Password must contain at least 1 special character (!@#$%^&*...)' };
  }
  
  return { isValid: true };
};

/**
 * Get password strength indicator
 */
export const getPasswordStrength = (password: string): {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
} => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  
  if (score <= 2) return { strength: 'weak', score };
  if (score <= 4) return { strength: 'medium', score };
  return { strength: 'strong', score };
};

