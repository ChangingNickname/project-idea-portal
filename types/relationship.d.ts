import type { User } from './user'

export {}

declare global {
    type RelationStatus = 'friend' | 'blacklist' | 'pending_friend'
    
    const RELATION_STATUSES: readonly RelationStatus[] = ['friend', 'blacklist', 'pending_friend'] as const
    
    interface Relation {
        id: string;
        uid: string;
        targetUid: string;
        status: RelationStatus;
        createdAt: Date;
        updatedAt: Date;
      }
      
      
}
