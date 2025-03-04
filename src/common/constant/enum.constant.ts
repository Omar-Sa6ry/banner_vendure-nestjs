export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  PARTNER = 'partner',
  MANAGER = 'manager',
}

export enum UserStatus {
  PUBLIC = 'public',
  PRIVACY = 'privacy',
}

export enum Status {
  BLOCK = 'block',
  REJECTED = 'rejected',
  FOLLOW = 'follow',
  PENDING = 'pending',
  FRIEND = 'friend',
}


export enum InterActionType {
  VIEW = 'view',
  CLICK = 'click',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}
