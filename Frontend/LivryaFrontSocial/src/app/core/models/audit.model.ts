export type AuditAction =
  | 'AUTH_LOGIN' | 'AUTH_LOGIN_FAILED' | 'AUTH_LOGOUT' | 'AUTH_LOGOUT_ALL'
  | 'AUTH_SIGNUP' | 'AUTH_TOKEN_REFRESH' | 'AUTH_PASSWORD_CHANGE'
  | 'AUTH_PASSWORD_RESET_REQUEST' | 'AUTH_PASSWORD_RESET_COMPLETE' | 'AUTH_EMAIL_VERIFY'
  | 'BOOK_CREATE' | 'BOOK_UPDATE' | 'BOOK_DELETE' | 'BOOK_VIEW'
  | 'CHAPTER_CREATE' | 'CHAPTER_UPDATE' | 'CHAPTER_DELETE' | 'CHAPTER_REORDER'
  | 'CHARACTER_CREATE' | 'CHARACTER_UPDATE' | 'CHARACTER_DELETE'
  | 'SPEECH_CREATE' | 'SPEECH_UPDATE' | 'SPEECH_DELETE'
  | 'NARRATION_START' | 'NARRATION_COMPLETE' | 'NARRATION_FAIL'
  | 'AUDIO_GENERATE' | 'AUDIO_DELETE'
  | 'POST_CREATE' | 'POST_UPDATE' | 'POST_DELETE'
  | 'COMMENT_CREATE' | 'COMMENT_DELETE'
  | 'LIKE_TOGGLE' | 'FOLLOW_TOGGLE'
  | 'MESSAGE_SEND' | 'MESSAGE_DELETE'
  | 'PROFILE_UPDATE' | 'AVATAR_UPLOAD'
  | 'GROUP_CREATE' | 'GROUP_UPDATE' | 'GROUP_DELETE' | 'GROUP_JOIN' | 'GROUP_LEAVE'
  | 'GROUP_MEMBER_ROLE_CHANGE' | 'GROUP_MEMBER_REMOVE'
  | 'CAMPAIGN_CREATE' | 'CAMPAIGN_UPDATE' | 'CAMPAIGN_DELETE' | 'CAMPAIGN_JOIN'
  | 'STORY_CREATE' | 'STORY_DELETE'
  | 'SUBSCRIPTION_CREATE' | 'SUBSCRIPTION_CANCEL' | 'SUBSCRIPTION_UPGRADE' | 'SUBSCRIPTION_DOWNGRADE'
  | 'LIVRA_PURCHASE' | 'LIVRA_SPEND' | 'LIVRA_EARN'
  | 'AI_TEXT_GENERATE' | 'AI_IMAGE_GENERATE' | 'AI_TTS_GENERATE'
  | 'ADMIN_USER_BAN' | 'ADMIN_USER_UNBAN' | 'ADMIN_USER_ROLE_CHANGE' | 'ADMIN_CONTENT_REMOVE' | 'ADMIN_CONFIG_CHANGE'
  | 'RATE_LIMIT_EXCEEDED' | 'PERMISSION_DENIED' | 'PLAN_LIMIT_REACHED'
  | 'SYSTEM_MAINTENANCE';

export type AuditCategory =
  | 'AUTH' | 'BOOK' | 'CHAPTER' | 'CHARACTER' | 'SPEECH' | 'NARRATION'
  | 'SOCIAL' | 'MESSAGE' | 'PROFILE' | 'GROUP' | 'CAMPAIGN' | 'STORY'
  | 'FINANCIAL' | 'AI' | 'ADMIN' | 'SYSTEM';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  category: AuditCategory;
  severity: AuditSeverity;
  resource?: string;
  resourceId?: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  metadata?: any;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
  duration?: number;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface AuditQueryFilters {
  userId?: string;
  action?: AuditAction | AuditAction[];
  category?: AuditCategory | AuditCategory[];
  severity?: AuditSeverity | AuditSeverity[];
  resource?: string;
  resourceId?: string;
  success?: boolean;
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditPaginatedResult {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: any;
}

export interface AuditStats {
  total: number;
  last24h: number;
  bySeverity: Record<AuditSeverity, number>;
  byCategory: Record<AuditCategory, number>;
}
