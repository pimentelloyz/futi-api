import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import { teamsRouter } from '../presentation/routes/teams-router.js';
import { playersRouter } from '../presentation/routes/players-router.js';
import { matchesRouter } from '../presentation/routes/matches-router.js';
import { evaluationsRouter } from '../presentation/routes/evaluations-router.js';
import { usersRouter } from '../presentation/routes/users-router.js';
import { authRouter } from '../presentation/routes/auth-router.js';
import { accessRouter } from '../presentation/routes/access-router.js';
import { positionsRouter } from '../presentation/routes/positions-router.js';

import { openapi } from './docs/openapi.js';

export function setupRoutes(app: Express) {
  app.use('/api/teams', teamsRouter);
  app.use('/api/players', playersRouter);
  app.use('/api/matches', matchesRouter);
  app.use('/api/evaluations', evaluationsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/access', accessRouter);
  app.use('/api/positions', positionsRouter);
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() }),
  );
  // Swagger UI and JSON
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
  app.get('/docs.json', (_req, res) => res.json(openapi));
}
