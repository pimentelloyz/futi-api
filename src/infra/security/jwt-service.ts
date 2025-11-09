import pkg from 'jsonwebtoken';
import type { JwtPayload as LibJwtPayload, SignOptions } from 'jsonwebtoken';

import { getEnv } from '../../main/config/env.js';

export type AppJwtPayload = LibJwtPayload & {
  sub: string; // user id
  uid: string; // firebase uid
};

export const jwtService = {
  sign(payload: AppJwtPayload, expiresIn: string = '7d') {
    const { JWT_SECRET } = getEnv();
    const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
    return pkg.sign(payload, JWT_SECRET, options);
  },
  verify(token: string): AppJwtPayload {
    const { JWT_SECRET } = getEnv();
    const decoded = pkg.verify(token, JWT_SECRET);
    return decoded as AppJwtPayload;
  },
};
