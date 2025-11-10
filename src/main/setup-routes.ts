import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import { teamsRouter } from '../presentation/routes/teams-router.js';
import { playersRouter } from '../presentation/routes/players-router.js';
import { matchesRouter } from '../presentation/routes/matches-router.js';
import { jwtAuth } from '../presentation/middlewares/jwt-auth.js';
import { GetMyUserController } from '../presentation/controllers/get-my-user-controller.js';
import { RefreshAccessTokenController } from '../presentation/controllers/refresh-access-token-controller.js';
import {
  LogoutAllController,
  LogoutController,
} from '../presentation/controllers/logout-controller.js';
import { GrantAccessController } from '../presentation/controllers/grant-access-controller.js';
import { RevokeAccessController } from '../presentation/controllers/revoke-access-controller.js';
import { ListMyAccessController } from '../presentation/controllers/list-my-access-controller.js';

import { makeExchangeFirebaseTokenController } from './factories/make-exchange-firebase-token-controller.js';
import { openapi } from './docs/openapi.js';

export function setupRoutes(app: Express) {
  app.use('/api/teams', teamsRouter);
  app.use('/api/players', playersRouter);
  app.use('/api/matches', matchesRouter);
  app.post('/api/auth/firebase/exchange', async (req, res) => {
    const controller = makeExchangeFirebaseTokenController();
    const response = await controller.handle({ body: req.body });
    if (response.setCookie) {
      const { name, value, options } = response.setCookie;
      res.cookie(name, value, options);
    }
    res.status(response.statusCode).json(response.body);
  });
  app.post('/api/auth/refresh', async (req, res) => {
    const controller = new RefreshAccessTokenController();
    const response = await controller.handle({ body: req.body, cookies: req.cookies });
    if (response.setCookie) {
      const { name, value, options } = response.setCookie;
      res.cookie(name, value, options);
    }
    res.status(response.statusCode).json(response.body);
  });
  app.post('/api/auth/logout', async (req, res) => {
    const controller = new LogoutController();
    const response = await controller.handle({ body: req.body, cookies: req.cookies });
    if (response.clearCookie) {
      const { name, options } = response.clearCookie;
      res.clearCookie(name, options);
    }
    res.status(response.statusCode).json(response.body);
  });
  app.post('/api/auth/logout-all', jwtAuth, async (req, res) => {
    const controller = new LogoutAllController();
    const request: import('../presentation/protocols/http.js').HttpRequest & {
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
  app.get('/api/users/me', jwtAuth, async (req, res) => {
    const controller = new GetMyUserController();
    const request: import('../presentation/protocols/http.js').HttpRequest & {
      user?: { id: string };
    } = {};
    request.user = req.user as { id: string } | undefined;
    const response = await controller.handle(request);
    res.status(response.statusCode).json(response.body);
  });
  // Access control routes
  app.post('/api/access/grant', jwtAuth, async (req, res) => {
    const controller = new GrantAccessController();
    const request: import('../presentation/protocols/http.js').HttpRequest & {
      user?: { id: string };
    } = { body: req.body };
    request.user = req.user as { id: string } | undefined;
    const response = await controller.handle(request);
    res.status(response.statusCode).json(response.body);
  });
  app.post('/api/access/revoke', jwtAuth, async (req, res) => {
    const controller = new RevokeAccessController();
    const request: import('../presentation/protocols/http.js').HttpRequest & {
      user?: { id: string };
    } = { body: req.body };
    request.user = req.user as { id: string } | undefined;
    const response = await controller.handle(request);
    res.status(response.statusCode).json(response.body);
  });
  app.get('/api/access/me', jwtAuth, async (req, res) => {
    const controller = new ListMyAccessController();
    const request: import('../presentation/protocols/http.js').HttpRequest & {
      user?: { id: string };
    } = {};
    request.user = req.user as { id: string } | undefined;
    const response = await controller.handle(request);
    res.status(response.statusCode).json(response.body);
  });
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() }),
  );
  // Swagger UI and JSON
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
  app.get('/docs.json', (_req, res) => res.json(openapi));
}
