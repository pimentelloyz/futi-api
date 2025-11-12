export interface PushTokenRepository {
  upsert(userId: string, token: string, platform: string | null): Promise<void>;
}
