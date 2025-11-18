import express from 'express';
import cookieParser from 'cookie-parser';

import { requestContext } from '../presentation/middlewares/request-context.js';
import { auditRequest } from '../presentation/middlewares/audit-request.middleware.js';

import { setupRoutes } from './setup-routes.js';

export function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  // contexto por request + auditoria de requests (latência, status, usuário)
  app.use(requestContext());
  app.use(auditRequest());
  setupRoutes(app);
  return app;
}

export const app = makeApp();
