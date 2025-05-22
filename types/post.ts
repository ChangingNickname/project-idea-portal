export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  status?: 'Open' | 'Closed' | 'In Progress';
  tags?: string[];
  image?: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  tags?: string[];
  image?: string;
}

export interface PostResponse {
  success: boolean;
  data?: Post | Post[];
  error?: string;
} 