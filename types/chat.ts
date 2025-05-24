import { User } from './user';

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


export type Chat = {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  is_deleted: boolean;
  members: User[];  
};


