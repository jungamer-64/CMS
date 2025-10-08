export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string | RegExp;
    email?: boolean;
    url?: boolean;
    number?: boolean;
    custom?: (value: string) => boolean | string;
    phone?: boolean;
    date?: boolean;
}

// バリデーションロジックをコンポーネント外に切り出す
export class FormValidator {
    private t: (key: string, options?: Record<string, unknown>) => string;
    private locale: string;

    constructor(t: (key: string, options?: Record<string, unknown>) => string, locale: string) {
        this.t = t;
        this.locale = locale;
    }

    validateRequired(value: string): string | null {
        if (!value || value.trim() === '') {
            return this.t('validation:validation.required');
        }
        return null;
    }

    validateLength(value: string, minLength?: number, maxLength?: number): string | null {
        if (minLength && value.length < minLength) {
            return this.t('validation:validation.length.min', { min: minLength });
        }
        if (maxLength && value.length > maxLength) {
            return this.t('validation:validation.length.max', { max: maxLength });
        }
        return null;
    }

    validateEmail(value: string): string | null {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(value)) {
            return this.t('validation:validation.email');
        }
        return null;
    }

    validateUrl(value: string): string | null {
        try {
            new URL(value);
            return null;
        } catch {
            return this.t('validation:validation.url');
        }
    }

    validateNumber(value: string): string | null {
        if (isNaN(Number(value))) {
            return this.t('validation:validation.number');
        }
        return null;
    }

    validatePhone(value: string): string | null {
        const phonePatterns: Record<string, RegExp> = {
            ja: /^(\+81-?|0)\d{1,4}-?\d{4}-?\d{4}$/,
            en: /^(\+1-?)?\d{3}-?\d{3}-?\d{4}$/,
            ko: /^(\+82-?|0)\d{2,3}-?\d{3,4}-?\d{4}$/,
            zh: /^(\+86-?|0)\d{3}-?\d{4}-?\d{4}$/,
            default: /^\+?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{1,9}$/,
        };

        const pattern = (phonePatterns as Record<string, RegExp>)[this.locale] || phonePatterns.default;
        if (!pattern.test(value)) {
            return this.t('validation:validation.phone');
        }
        return null;
    }

    validateDate(value: string): string | null {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return this.t('validation:validation.date');
        }
        return null;
    }

    validatePattern(value: string, pattern: string | RegExp): string | null {
        try {
            const MAX_VALUE_LENGTH = 1000;
            const testValue = value.slice(0, MAX_VALUE_LENGTH);

            if (typeof pattern === 'string') {
                if (!testValue.includes(pattern)) {
                    return this.t('validation:validation.pattern');
                }
                return null;
            }

            if (!pattern.test(testValue)) {
                return this.t('validation:validation.pattern');
            }
            return null;
        } catch (error) {
            console.error('Pattern validation error:', error);
            return this.t('validation:validation.pattern');
        }
    }

    validateCustom(value: string, customFn: (value: string) => boolean | string): string | null {
        const result = customFn(value);
        if (typeof result === 'string') {
            return result;
        }
        if (result === false) {
            return this.t('validation:validation.custom');
        }
        return null;
    }
}

export function getValidationMethods(validator: FormValidator, rules: ValidationRule) {
    return [
        { check: rules.required, fn: () => validator.validateRequired },
        { check: rules.email, fn: () => validator.validateEmail },
        { check: rules.url, fn: () => validator.validateUrl },
        { check: rules.number, fn: () => validator.validateNumber },
        { check: rules.phone, fn: () => validator.validatePhone },
        { check: rules.date, fn: () => validator.validateDate },
        { check: rules.pattern, fn: () => (v: string) => validator.validatePattern(v, rules.pattern!) },
        { check: rules.custom, fn: () => (v: string) => validator.validateCustom(v, rules.custom!) },
    ].filter(rule => rule.check).map(rule => rule.fn());
}

export function executeValidationMethods(validationMethods: Array<(v: string) => string | null>, value: string) {
    for (const validateFn of validationMethods) {
        const error = validateFn(value);
        if (error) return error;
    }
    return null;
}
