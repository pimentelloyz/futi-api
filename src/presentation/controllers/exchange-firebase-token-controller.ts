import { z } from 'zod';

import { verifyIdToken } from '../../infra/firebase/admin.js';
import { DbEnsureUser } from '../../data/usecases/db-ensure-user.js';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository.js';
import { jwtService } from '../../infra/security/jwt-service.js';
import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';

const schema = z.object({ idToken: z.string().min(10) });

export class ExchangeFirebaseTokenController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return { statusCode: 400, body: { error: 'invalid_request' } };
    }
    try {
      const decoded = await verifyIdToken(parsed.data.idToken);
      const repo = new PrismaUserRepository();
      const ensureUser = new DbEnsureUser(repo);
      const user = await ensureUser.ensure({
        firebaseUid: decoded.uid,
        email: decoded.email ?? null,
        displayName: decoded.name ?? null,
      });
      const accessToken = jwtService.sign({ sub: user.id, uid: decoded.uid });
      return { statusCode: 200, body: { accessToken } };
    } catch {
      return { statusCode: 401, body: { error: 'invalid_token' } };
    }
  }
}
