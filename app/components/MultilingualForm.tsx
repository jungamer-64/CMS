'use client';

import { useCallback, useState } from 'react';
import { useExtendedTranslation } from '../lib/hooks/useExtendedTranslation';

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

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'date' | 'textarea';
  rules?: ValidationRule;
  placeholder?: string;
  helpText?: string;
}

interface MultilingualFormProps {
  readonly fields: FieldConfig[];
  readonly onSubmit: (data: Record<string, string>) => void | Promise<void>;
  readonly className?: string;
  readonly submitLabel?: string;
  readonly resetLabel?: string;
  readonly showHelp?: boolean;
}

interface FieldError {
  field: string;
  message: string;
}

// バリデーション関数を分離
class FormValidator {
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
    const phonePatterns = {
      ja: /^(\+81-?|0)\d{1,4}-?\d{4}-?\d{4}$/,
      en: /^(\+1-?)?\d{3}-?\d{3}-?\d{4}$/,
      ko: /^(\+82-?|0)\d{2,3}-?\d{3,4}-?\d{4}$/,
      zh: /^(\+86-?|0)\d{3}-?\d{4}-?\d{4}$/,
      default: /^\+?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{1,9}$/,
    };

    const pattern = phonePatterns[this.locale as keyof typeof phonePatterns] || phonePatterns.default;
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
      // セキュリティ: タイムアウト付きでRegExpを実行してReDoSを防止
      const regexPattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

      // 値の長さを制限
      const MAX_VALUE_LENGTH = 1000;
      const testValue = value.slice(0, MAX_VALUE_LENGTH);

      if (!regexPattern.test(testValue)) {
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

/**
 * 多言語対応フォームバリデーションコンポーネント
 */
export default function MultilingualForm({
  fields,
  onSubmit,
  className = '',
  submitLabel,
  resetLabel,
  showHelp = true,
}: MultilingualFormProps) {
  const { t, locale } = useExtendedTranslation();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // バリデーションルールマップ - 条件分岐を減らすための設計
  const getValidationMethods = useCallback((validator: FormValidator, rules: ValidationRule) => {
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
  }, []);

  // 統合バリデーション関数（複雑度を削減）
  const validateField = useCallback((field: FieldConfig, value: string): string | null => {
    const { rules } = field;
    if (!rules) return null;

    const validator = new FormValidator(t, locale);

    // 必須チェック
    if (rules.required) {
      const error = validator.validateRequired(value);
      if (error) return error;
    }

    // 値が空の場合、他のバリデーションは実行しない
    if (!value || value.trim() === '') return null;

    // 長さチェック
    const lengthError = validator.validateLength(value, rules.minLength, rules.maxLength);
    if (lengthError) return lengthError;

    // すべてのバリデーションメソッドを順次実行
    const validationMethods = getValidationMethods(validator, rules);
    for (const validateFn of validationMethods) {
      const error = validateFn(value);
      if (error) return error;
    }

    return null;
  }, [t, locale, getValidationMethods]);

  // 全フィールドをバリデーション
  const validateForm = useCallback((): boolean => {
    const newErrors: FieldError[] = [];

    fields.forEach(field => {
      const value = formData[field.name] || '';
      const error = validateField(field, value);
      if (error) {
        newErrors.push({ field: field.name, message: error });
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [fields, formData, validateField]);

  // フィールド値の変更
  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    // リアルタイムバリデーション
    const field = fields.find(f => f.name === fieldName);
    if (field) {
      const error = validateField(field, value);
      setErrors(prev => {
        const filtered = prev.filter(e => e.field !== fieldName);
        return error ? [...filtered, { field: fieldName, message: error }] : filtered;
      });
    }
  }, [fields, validateField]);

  // フォーム送信
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = onSubmit(formData);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, onSubmit, formData]);

  // フォームリセット
  const handleReset = useCallback(() => {
    setFormData({});
    setErrors([]);
  }, []);

  // フィールドのエラーを取得
  const getFieldError = useCallback((fieldName: string): string | null => {
    const error = errors.find(e => e.field === fieldName);
    return error?.message || null;
  }, [errors]);

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {fields.map(field => {
        const error = getFieldError(field.name);
        const value = formData[field.name] || '';

        return (
          <div key={field.name} className="space-y-2">
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {field.label}
              {field.rules?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                rows={4}
              />
            ) : (
              <input
                type={field.type}
                id={field.name}
                name={field.name}
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              />
            )}

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}

            {!error && field.helpText && showHelp && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {field.helpText}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex space-x-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || errors.length > 0}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('forms:buttons.submitting') || t('ui.loading')}
            </span>
          ) : (
            submitLabel || t('forms:buttons.submit')
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {resetLabel || t('forms:buttons.reset')}
        </button>
      </div>
    </form>
  );
}
