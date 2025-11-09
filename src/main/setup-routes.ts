import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import { teamsRouter } from '../presentation/routes/teams-router.js';

import { openapi } from './docs/openapi.js';

export function setupRoutes(app: Express) {
  app.use('/api/teams', teamsRouter);
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() }),
  );
  // Swagger UI and JSON
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
  app.get('/docs.json', (_req, res) => res.json(openapi));
}
