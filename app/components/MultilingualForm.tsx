'use client';

import { memo, useCallback, useState } from 'react';
import { useExtendedTranslation } from '../lib/hooks/useExtendedTranslation';
import { executeValidationMethods, FormValidator, getValidationMethods, ValidationRule } from './form-validation';

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

// バリデーション関数は `form-validation.ts` へ移動しました


/**
 * 多言語対応フォームバリデーションコンポーネント
 */
function MultilingualForm({
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

    // すべてのバリデーションメソッドを順次実行（ヘルパーへ委譲）
    const validationMethods = getValidationMethods(validator, rules);
    const methodError = executeValidationMethods(validationMethods, value);
    if (methodError) return methodError;

    return null;
  }, [t, locale]);

  // 全フィールドをバリデーション
  const validateForm = useCallback((): boolean => {
    const newErrors: FieldError[] = [];

    for (const field of fields) {
      const value = formData[field.name] || '';
      const error = validateField(field, value);
      if (error) newErrors.push({ field: field.name, message: error });
    }

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
    } catch (err: unknown) {
      console.error('Form submission error:', err instanceof Error ? err : String(err));
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

  interface FieldRendererProps {
    field: FieldConfig;
    value: string;
    error: string | null;
    onChange: (name: string, value: string) => void;
    showHelp: boolean;
  }

  function FieldRenderer({ field, value, error, onChange, showHelp }: FieldRendererProps) {
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
            onChange={(e) => onChange(field.name, e.target.value)}
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
            onChange={(e) => onChange(field.name, e.target.value)}
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
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {fields.map(field => {
        const error = getFieldError(field.name);
        const value = formData[field.name] || '';

        return (
          <FieldRenderer
            key={field.name}
            field={field}
            value={value}
            error={error}
            onChange={handleFieldChange}
            showHelp={showHelp}
          />
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

// fieldsとonSubmitの深い比較が必要なため、React.memoで最適化
// 注: fields配列の参照が変わらない限り、再レンダリングしない
export default memo(MultilingualForm);
