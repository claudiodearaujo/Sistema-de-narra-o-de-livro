/**
 * Group Models
 * 
 * Modelos e interfaces para o sistema de grupos literários.
 */

export type GroupPrivacy = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
export type GroupRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface GroupOwner {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  ownerId: string;
  privacy: GroupPrivacy;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  owner: GroupOwner;
  _count: {
    members: number;
    campaigns: number;
  };
  
  // Computed
  isMember?: boolean;
  memberRole?: GroupRole;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  
  // Relations
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    role?: string;
  };
}

export interface CampaignBook {
  id: string;
  campaignId: string;
  bookId: string;
  chapterId?: string;
  orderIndex: number;
  createdAt: string;
  
  // Relations
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
  };
}

export interface Campaign {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  livraReward: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  group: {
    id: string;
    name: string;
    coverUrl?: string;
  };
  books: CampaignBook[];
  _count: {
    progress: number;
  };
  
  // Computed
  userProgress?: CampaignProgress;
  totalBooks?: number;
}

export interface CampaignProgress {
  id: string;
  campaignId: string;
  userId: string;
  booksRead: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  campaign: {
    id: string;
    name: string;
    livraReward: number;
  };
  
  // Computed
  totalBooks?: number;
  percentComplete?: number;
  rewardEarned?: number;
}

// DTO Interfaces
export interface CreateGroupDto {
  name: string;
  description?: string;
  coverUrl?: string;
  privacy?: GroupPrivacy;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
  coverUrl?: string;
  privacy?: GroupPrivacy;
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  livraReward?: number;
  bookIds: string[];
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  status?: CampaignStatus;
  startDate?: string;
  endDate?: string;
  livraReward?: number;
}

// Response Interfaces for Groups and Campaigns
export interface GroupPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export type GroupsResponse = GroupPaginatedResponse<Group>;
export type MembersResponse = GroupPaginatedResponse<GroupMember>;
export type CampaignsResponse = GroupPaginatedResponse<Campaign>;
export type CampaignProgressResponse = GroupPaginatedResponse<CampaignProgress>;
