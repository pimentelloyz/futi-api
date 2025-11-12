export const ERROR_CODES = {
  INVALID_BODY: 'invalid_body',
  INVALID_TOKEN: 'invalid_token',
  NOT_AUTHORIZED: 'not_authorized',
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
