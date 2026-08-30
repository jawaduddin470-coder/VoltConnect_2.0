import { AppError, AppErrorCode } from '@/types';

class VoltGuardService {
  private rateLimitMap = new Map<string, number[]>();

  /**
   * Sanitizes text inputs against XSS and script injections.
   */
  sanitizeInput(input: string): string {
    if (!input) return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  /**
   * Validates standard email address format.
   */
  validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Validates Indian phone format.
   */
  validatePhone(phone: string): boolean {
    const re = /^(?:\+91|0)?[6-9]\d{9}$/;
    return re.test(phone.replace(/\s+/g, ''));
  }

  /**
   * Validates standard URL format.
   */
  validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks rate limiting for sensitive operations.
   */
  checkRateLimit(key: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const timestamps = this.rateLimitMap.get(key) || [];
    const validTimestamps = timestamps.filter(t => now - t < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return false; // Rate limit exceeded
    }

    validTimestamps.push(now);
    this.rateLimitMap.set(key, validTimestamps);
    return true;
  }

  /**
   * Generates a sanitized user-friendly error object with a VC-XXXX reference code.
   */
  formatAppError(code: AppErrorCode, rawError?: any, defaultUserMsg?: string): AppError {
    const refCode = `VC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    let userMessage = defaultUserMsg || 'An unexpected issue occurred. Please try again.';

    switch (code) {
      case 'AUTH_ERROR':
        userMessage = 'Authentication failed. Please check your credentials.';
        break;
      case 'PERMISSION_ERROR':
        userMessage = "You don't have permission to perform this action.";
        break;
      case 'VALIDATION_ERROR':
        userMessage = 'Please verify that all fields are filled out correctly.';
        break;
      case 'NOT_FOUND':
        userMessage = 'The requested EV resource could not be found.';
        break;
      case 'NETWORK_ERROR':
        userMessage = 'Network connection interrupted. Please check your internet.';
        break;
      case 'AI_ERROR':
        userMessage = 'VoltAI service is temporarily busy. Please retry shortly.';
        break;
    }

    // Log raw error internally for telemetry/debugging
    if (rawError) {
      console.error(`[VoltGuard Security Intercept] Ref: ${refCode} | Code: ${code}`, rawError);
    }

    return {
      code,
      message: typeof rawError === 'string' ? rawError : rawError?.message || code,
      userMessage: `${userMessage} (Reference: ${refCode})`,
      refCode,
      timestamp: new Date().toISOString(),
    };
  }
}

export const voltGuardService = new VoltGuardService();
