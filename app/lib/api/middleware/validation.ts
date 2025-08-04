/**
 * バリデーションミドルウェア
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '../../core/types';
import { ValidationError } from '../../core/errors';

export type ValidationSchema = {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    enum?: readonly string[];
    custom?: (value: unknown) => boolean | string;
  };
};

// リクエストボディのバリデーション
export function validateBody<T>(schema: ValidationSchema) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (req: NextRequest, ...args: unknown[]) {
      try {
        const body = await req.json();
        const validationResult = validateObject(body, schema);
        
        if (!validationResult.isValid) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Validation failed',
              details: validationResult.errors
            },
            { status: 400 }
          );
        }
        
        return originalMethod.apply(this, [req, ...args]);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON body' },
          { status: 400 }
        );
      }
    };
    
    return descriptor;
  };
}

// オブジェクトのバリデーション
export function validateObject(
  obj: Record<string, unknown>, 
  schema: ValidationSchema
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = obj[field];
    
    // 必須チェック
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${field} is required`);
      continue;
    }
    
    // 値が存在しない場合はスキップ
    if (value === undefined || value === null) {
      continue;
    }
    
    // 型チェック
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
        continue;
      }
    }
    
    // 文字列の長さチェック
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
    }
    
    // 列挙値チェック
    if (rules.enum && !rules.enum.includes(value as string)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }
    
    // カスタムバリデーション
    if (rules.custom) {
      const result = rules.custom(value);
      if (typeof result === 'string') {
        errors.push(result);
      } else if (!result) {
        errors.push(`${field} validation failed`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// クエリパラメータのバリデーション
export function validateQuery(req: NextRequest, schema: ValidationSchema): {
  isValid: boolean;
  errors: string[];
  params: Record<string, unknown>;
} {
  const url = new URL(req.url);
  const params: Record<string, unknown> = {};
  
  // URLSearchParamsをオブジェクトに変換
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }
  
  const validation = validateObject(params, schema);
  
  return {
    ...validation,
    params,
  };
}
