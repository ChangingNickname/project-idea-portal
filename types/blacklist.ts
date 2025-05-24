import { User } from './user';

export type Blacklist = {
  id: string;
  user: User;
  blocked_users: User[];
};