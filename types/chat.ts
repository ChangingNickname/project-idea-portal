export interface User {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  disabled: boolean;
  isAnonymous: boolean;
  providerData: {
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  }[];
  customClaims: Record<string, any> | null;
  metadata: {
    creationTime: string | null;
    lastSignInTime: string | null;
    lastRefreshTime: string | null;
  };
  tenantId: string | null;
  multiFactor: any[];
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  reader_by_ids: User[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  is_deleted: boolean;
}

export type MessageComment = Message & {
  parentId: string;
};

export type PostComment = {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  is_deleted: boolean;
  parentId: string;
};

export type Comment = MessageComment | PostComment;

export interface Chat {
  id: string;
  messages: Message[];
  members: User[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  is_deleted: boolean;
  // Additional fields for ChatCard display
  lastMessage?: {
    content: string;
    sender: User;
    createdAt: Date;
  };
  unreadCount?: number;
  isGroupChat: boolean;
  name?: string;
  photoURL?: string | null;
}