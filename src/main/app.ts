import express from 'express';
import cookieParser from 'cookie-parser';

import { setupRoutes } from './setup-routes.js';

export function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  setupRoutes(app);
  return app;
}

export const app = makeApp();
