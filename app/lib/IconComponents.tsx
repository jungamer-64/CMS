import type { JSX } from 'react';

interface IconProps {
  readonly className?: string;
  readonly strokeWidth?: number;
}

export const ChevronUpIcon = ({ className = "w-4 h-4", strokeWidth = 2 }: IconProps): JSX.Element => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M5 15l7-7 7 7" />
  </svg>
);

export const ChevronDownIcon = ({ className = "w-4 h-4", strokeWidth = 2 }: IconProps): JSX.Element => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M19 9l-7 7-7-7" />
  </svg>
);

export const ChevronLeftIcon = ({ className = "w-4 h-4", strokeWidth = 2 }: IconProps): JSX.Element => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M15 19l-7-7 7-7" />
  </svg>
);

export const ChevronRightIcon = ({ className = "w-4 h-4", strokeWidth = 2 }: IconProps): JSX.Element => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M9 5l7 7-7 7" />
  </svg>
);

// Menu icons with optimized sizing
export const NewPostIcon = ({ className = "w-5 h-5 mr-3 flex-shrink-0", strokeWidth = 2 }: IconProps): JSX.Element => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export const PostManagementIcon = ({ className = "w-5 h-5 mr-3 flex-shrink-0", strokeWidth = 2 }: IconProps): JSX.Element => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 3v4M8 3v4M3 9h18" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MediaManagementIcon = ({ className = "w-5 h-5 mr-3 flex-shrink-0", strokeWidth = 2 }: IconProps): JSX.Element => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth={strokeWidth} />
    <circle cx="8.5" cy="8.5" r="2.5" strokeWidth={strokeWidth} />
    <path d="M21 17l-5-5a3 3 0 0 0-4.24 0l-7.76 7" strokeWidth={strokeWidth} />
  </svg>
);

export const CommentManagementIcon = ({ className = "w-5 h-5 mr-3 flex-shrink-0", strokeWidth = 2 }: IconProps): JSX.Element => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

export const UserManagementIcon = ({ className = "w-5 h-5 mr-3 flex-shrink-0", strokeWidth = 2 }: IconProps): JSX.Element => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

export const SettingsIcon = ({ className = "w-5 h-5 mr-3 flex-shrink-0", strokeWidth = 2 }: IconProps): JSX.Element => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const ApiKeyIcon = ({ className = "w-5 h-5 mr-3 flex-shrink-0 text-white", strokeWidth = 2 }: IconProps): JSX.Element => (
  <svg className={className} fill="none" stroke="white" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

export const ViewSiteIcon = ({ className = "w-5 h-5 mr-3 flex-shrink-0", strokeWidth = 2 }: IconProps): JSX.Element => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export const AdminHomeIcon = ({ className = "w-5 h-5 mr-3 flex-shrink-0", strokeWidth = 2 }: IconProps): JSX.Element => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const IconComponents = {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  NewPostIcon,
  PostManagementIcon,
  MediaManagementIcon,
  CommentManagementIcon,
  UserManagementIcon,
  SettingsIcon,
  ApiKeyIcon,
  ViewSiteIcon,
  AdminHomeIcon,
};

export default IconComponents;
