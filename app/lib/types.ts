export interface Post {
  _id?: string;
  id: string;
  slug: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}

export interface PostInput {
  id: string;
  slug: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
}

export interface User {
  _id?: string;
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserInput {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface Comment {
  _id?: string;
  id: string;
  postSlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}

export interface CommentInput {
  postSlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
}

export interface PasswordResetToken {
  _id?: string;
  id: string;
  userId: string;
  token: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}
