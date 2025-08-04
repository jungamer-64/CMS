/**
 * アイコンコンポーネント集
 * LIB_COMMONIZATION_PLAN.md 対応
 */

'use client';

import React from 'react';

export interface IconProps {
  readonly size?: number;
  readonly className?: string;
  readonly color?: string;
}

// 基本的なSVGアイコンコンポーネント
export function HomeIcon({ size = 24, className, color = 'currentColor' }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  );
}

export function EditIcon({ size = 24, className, color = 'currentColor' }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 1-1-1V6a2 2 0 0 0-2-2h-7"/>
      <path d="m18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

export function DeleteIcon({ size = 24, className, color = 'currentColor' }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="3,6 5,6 21,6"/>
      <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1 2-2h4a2,2 0 0,1 2,2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  );
}

export function SaveIcon({ size = 24, className, color = 'currentColor' }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17,21 17,13 7,13 7,21"/>
      <polyline points="7,3 7,8 15,8"/>
    </svg>
  );
}

export function UserIcon({ size = 24, className, color = 'currentColor' }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

export function SettingsIcon({ size = 24, className, color = 'currentColor' }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="3"/>
      <path d="m12 1 2.1 1.1a3 3 0 0 1 1.5 1.5L16.7 6H20a2 2 0 0 1 2 2v3.3l-1.1 1.1a3 3 0 0 1-1.5 1.5L18.3 15.7L18.3 19a2 2 0 0 1-2 2h-3.3l-1.1-1.1a3 3 0 0 1-1.5-1.5L7.3 17H4a2 2 0 0 1-2-2v-3.3l1.1-1.1a3 3 0 0 1 1.5-1.5L5.7 8.3L5.7 5a2 2 0 0 1 2-2h3.3l1.1 1.1a3 3 0 0 1 1.5 1.5L14.7 6.3 18.3 6.3"/>
    </svg>
  );
}

export function MenuIcon({ size = 24, className, color = 'currentColor' }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

export function CloseIcon({ size = 24, className, color = 'currentColor' }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export function ChevronDownIcon({ size = 24, className, color = 'currentColor' }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6,9 12,15 18,9"/>
    </svg>
  );
}

export function LoadingIcon({ size = 24, className, color = 'currentColor' }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={`animate-spin ${className ?? ''}`}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

// アイコンコンポーネントのエクスポート
export const IconComponents = {
  Home: HomeIcon,
  Edit: EditIcon,
  Delete: DeleteIcon,
  Save: SaveIcon,
  User: UserIcon,
  Settings: SettingsIcon,
  Menu: MenuIcon,
  Close: CloseIcon,
  ChevronDown: ChevronDownIcon,
  Loading: LoadingIcon,
};
