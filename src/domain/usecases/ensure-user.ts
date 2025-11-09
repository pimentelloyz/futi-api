export type EnsureUserInput = {
  firebaseUid: string;
  email?: string | null;
  displayName?: string | null;
};

export interface EnsureUser {
  ensure(input: EnsureUserInput): Promise<{ id: string; firebaseUid: string }>;
}
