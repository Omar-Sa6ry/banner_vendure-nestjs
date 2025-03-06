import { registerEnumType } from '@nestjs/graphql'

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  VENDOR = 'vendor',
  PARTNER = 'partner',
  MANAGER = 'manager',
}
registerEnumType(Role, {
  name: 'Role',
  description: 'User roles in the system',
})

export enum UserStatus {
  PUBLIC = 'public',
  PRIVACY = 'privacy',
}
registerEnumType(UserStatus, {
  name: 'UserStatus',
  description: 'User privacy settings',
})

export enum Status {
  BLOCK = 'block',
  REJECTED = 'rejected',
  FOLLOW = 'follow',
  PENDING = 'pending',
  FRIEND = 'friend',
}
registerEnumType(Status, {
  name: 'Status',
  description: 'Follow request statuses',
})

export enum InterActionType {
  VIEW = 'view',
  CLICK = 'click',
}
registerEnumType(InterActionType, {
  name: 'InterActionType',
  description: 'Types of interactions',
})

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
registerEnumType(CampaignStatus, {
  name: 'CampaignStatus',
  description: 'Campaign lifecycle statuses',
})
