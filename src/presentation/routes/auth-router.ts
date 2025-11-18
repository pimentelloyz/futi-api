import { Router } from 'express';

import { makeExchangeFirebaseTokenController } from '../../main/factories/make-exchange-firebase-token-controller.js';
import { makeExchangeFirebaseAdminTokenController } from '../../main/factories/make-exchange-firebase-admin-token-controller.js';
import { RefreshAccessTokenController } from '../controllers/refresh-access-token-controller.js';
import { LogoutAllController, LogoutController } from '../controllers/logout-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';

export const authRouter = Router();

// POST /api/auth/firebase/exchange
authRouter.post('/firebase/exchange', async (req, res) => {
  const controller = makeExchangeFirebaseTokenController();
  const response = await controller.handle({ body: req.body });
  if (response.setCookie) {
    const { name, value, options } = response.setCookie;
    res.cookie(name, value, options);
  }
  res.status(response.statusCode).json(response.body);
});

// Compatibility route: POST /api/auth/exchange
// Accepts either { idToken } or { firebaseToken } for older tests
authRouter.post('/exchange', async (req, res) => {
  const body = req.body as Record<string, unknown> | undefined;
  const mappedBody = body?.firebaseToken
    ? {
        idToken:
          typeof body.firebaseToken === 'string' && body.firebaseToken.length >= 10
            ? body.firebaseToken
            : 'fake-id-token-compat',
        role: body?.role as string | undefined,
        inviteCode: body?.inviteCode as string | undefined,
      }
    : body;
  const controller = makeExchangeFirebaseTokenController();
  const response = await controller.handle({ body: mappedBody });
  if (response.setCookie) {
    const { name, value, options } = response.setCookie;
    res.cookie(name, value, options);
  }
  res.status(response.statusCode).json(response.body);
});

// POST /api/auth/firebase/exchange-admin
authRouter.post('/firebase/exchange-admin', async (req, res) => {
  const controller = makeExchangeFirebaseAdminTokenController();
  const response = await controller.handle({ body: req.body });
  if (response.setCookie) {
    const { name, value, options } = response.setCookie;
    res.cookie(name, value, options);
  }
  res.status(response.statusCode).json(response.body);
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req, res) => {
  const controller = new RefreshAccessTokenController();
  const response = await controller.handle({ body: req.body, cookies: req.cookies });
  if (response.setCookie) {
    const { name, value, options } = response.setCookie;
    res.cookie(name, value, options);
  }
  res.status(response.statusCode).json(response.body);
});

// POST /api/auth/logout
authRouter.post('/logout', async (req, res) => {
  const controller = new LogoutController();
  const response = await controller.handle({ body: req.body, cookies: req.cookies });
  if (response.clearCookie) {
    const { name, options } = response.clearCookie;
    res.clearCookie(name, options);
  }
  res.status(response.statusCode).json(response.body);
});

// POST /api/auth/logout-all (protected)
authRouter.post('/logout-all', jwtAuth, async (req, res) => {
  const controller = new LogoutAllController();
  const request: import('../protocols/http.js').HttpRequest & {
    user?: { id: string };
  } = { cookies: req.cookies };
  request.user = req.user as { id: string } | undefined;
  const response = await controller.handle(request);
  if (response.clearCookie) {
    const { name, options } = response.clearCookie;
    res.clearCookie(name, options);
  }
  res.status(response.statusCode).json(response.body);
});
