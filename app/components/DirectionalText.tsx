'use client';

import { useTranslation } from 'next-i18next';
import { useEffect, createElement } from 'react';

interface DirectionalTextProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly tag?: string;
  readonly autoDir?: boolean;
}

/**
 * テキストの方向性（LTR/RTL）を自動的に処理するコンポーネント
 */
export default function DirectionalText({
  children,
  className = '',
  tag = 'div',
  autoDir = true,
}: DirectionalTextProps) {
  const { i18n } = useTranslation();
  
  const isRTL = i18n.dir() === 'rtl';
  const direction = isRTL ? 'rtl' : 'ltr';
  
  useEffect(() => {
    if (autoDir) {
      document.documentElement.dir = direction;
      document.documentElement.lang = i18n.language;
    }
  }, [direction, i18n.language, autoDir]);
  
  return createElement(
    tag,
    {
      className: `${className} ${isRTL ? 'rtl' : 'ltr'}`,
      dir: direction,
      lang: i18n.language,
    },
    children
  );
}

/**
 * RTL/LTR対応のフレックスコンテナコンポーネント
 */
export function DirectionalFlex({
  children,
  className = '',
  reverse = false,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly reverse?: boolean;
}) {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  
  let flexDirection: string;
  if (isRTL) {
    flexDirection = reverse ? 'flex-row' : 'flex-row-reverse';
  } else {
    flexDirection = reverse ? 'flex-row-reverse' : 'flex-row';
  }
  
  return (
    <div className={`flex ${flexDirection} ${className}`}>
      {children}
    </div>
  );
}

/**
 * RTL/LTR対応のマージン・パディングユーティリティ
 */
export function useDirectionalSpacing() {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  
  return {
    isRTL,
    // 開始側（LTRでは左、RTLでは右）
    marginStart: (value: string) => isRTL ? `mr-${value}` : `ml-${value}`,
    marginEnd: (value: string) => isRTL ? `ml-${value}` : `mr-${value}`,
    paddingStart: (value: string) => isRTL ? `pr-${value}` : `pl-${value}`,
    paddingEnd: (value: string) => isRTL ? `pl-${value}` : `pr-${value}`,
    
    // テキスト配置
    textStart: isRTL ? 'text-right' : 'text-left',
    textEnd: isRTL ? 'text-left' : 'text-right',
    
    // フロート
    floatStart: isRTL ? 'float-right' : 'float-left',
    floatEnd: isRTL ? 'float-left' : 'float-right',
    
    // 境界線
    borderStart: (value: string) => isRTL ? `border-r-${value}` : `border-l-${value}`,
    borderEnd: (value: string) => isRTL ? `border-l-${value}` : `border-r-${value}`,
  };
}
