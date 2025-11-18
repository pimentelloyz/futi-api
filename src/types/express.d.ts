import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      firebaseUid?: string;
      email?: string;
    };
    ctx?: {
      id: string;
      cache: Map<string, unknown>;
      startedAt: number;
    };
  }
}
