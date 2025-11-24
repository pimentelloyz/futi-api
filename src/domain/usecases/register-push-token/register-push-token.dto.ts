export interface RegisterPushTokenInput {
  userId: string;
  token: string;
  platform?: 'ios' | 'android' | 'web';
}

export interface RegisterPushTokenOutput {
  success: boolean;
  message: string;
}
