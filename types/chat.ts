import { User } from './user';
import { Post } from './posts';

export type Message = {
  id: string;
  content: string;
  sender: User;
  reader_by_ids: User[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  is_deleted: boolean;
};

export type MessageComment = Message & {
  parentMessageId: string;
};

export type PostComment = Message & {
  postId: string;
};

export type Comment = MessageComment | PostComment;

export type Chat = {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  is_deleted: boolean;
  members: User[];  
};