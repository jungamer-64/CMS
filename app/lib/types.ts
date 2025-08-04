import type { Post } from './core/types';

export interface PostResource extends Post {
  readonly status: 'draft' | 'published';
}