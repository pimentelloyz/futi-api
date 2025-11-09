import type { Express } from 'express';

import { teamsRouter } from '../presentation/routes/teams-router.js';

export function setupRoutes(app: Express) {
  app.use('/api/teams', teamsRouter);
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() }),
  );
}
