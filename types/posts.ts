import { UUID, ISODateString } from './common';

export interface Post {
  id: UUID;
  name: string;
  shortDesc: string;
  fullDesc: string;
  tags: string[];
  image: string; // base64
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

// Type guard to check if an object is a valid Post
export function isPost(value: unknown): value is Post {
  if (!value || typeof value !== 'object') return false;
  
  const post = value as Post;
  return (
    typeof post.id === 'string' &&
    typeof post.name === 'string' &&
    typeof post.shortDesc === 'string' &&
    typeof post.fullDesc === 'string' &&
    Array.isArray(post.tags) &&
    post.tags.every(tag => typeof tag === 'string') &&
    typeof post.image === 'string' &&
    (!post.createdAt || typeof post.createdAt === 'string') &&
    (!post.updatedAt || typeof post.updatedAt === 'string')
  );
} 