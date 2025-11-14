export const ERROR_CODES = {
  INVALID_BODY: 'invalid_body',
  INVALID_TOKEN: 'invalid_token',
  INVALID_REQUEST: 'invalid_request',
  INVALID_QUERY: 'invalid_query',
  INVALID_REFRESH: 'invalid_refresh',
  INVALID_MULTIPART: 'invalid_multipart',
  UNSUPPORTED_MEDIA_TYPE: 'unsupported_media_type',
  INVALID_TEAM_ID: 'invalid_team_id',
  INVALID_PLAYER_ID: 'invalid_player_id',
  INVALID_ASSIGNMENT_ID: 'invalid_assignment_id',
  NOT_AUTHORIZED: 'not_authorized',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  MISSING_ID: 'missing_id',
  MATCH_NOT_FOUND: 'match_not_found',
  TEAM_NOT_FOUND: 'team_not_found',
  PLAYER_NOT_FOUND: 'player_not_found',
  ASSIGNMENT_NOT_FOUND: 'assignment_not_found',
  ALREADY_COMPLETED: 'already_completed',
  INTERNAL_ERROR: 'internal_error',
  FIREBASE_CONFIG_ERROR: 'firebase_config_error',
} as const;
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const MATCH_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
  CANCELED: 'CANCELED',
} as const;
export type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

export const EVENT_TYPES = {
  GOAL: 'GOAL',
  FOUL: 'FOUL',
  YELLOW_CARD: 'YELLOW_CARD',
  RED_CARD: 'RED_CARD',
  OWN_GOAL: 'OWN_GOAL',
} as const;
export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export const PUSH_PLATFORM = {
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
} as const;
export type PushPlatform = (typeof PUSH_PLATFORM)[keyof typeof PUSH_PLATFORM];

// Evaluation window (24h) for pending player evaluations and banner visibility
export const EVALUATION_WINDOW_MS = 24 * 60 * 60 * 1000;
