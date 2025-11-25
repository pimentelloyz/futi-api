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
import { leaguesRouter } from '../presentation/routes/leagues-router.js';
import { invitationCodesRouter } from '../presentation/routes/invitation-codes-router.js';
import { disciplineRouter } from '../presentation/routes/discipline-router.js';
import { auditRouter } from '../presentation/routes/audit-router.js';
import { leagueFormatsRouter } from '../presentation/routes/league-formats-router.js';
import { topicsRouter } from '../presentation/routes/topics-router.js';
import { formationsRouter } from '../presentation/routes/formations-router.js';

import { openapi } from './docs/openapi.js';
import { openapiPlayer } from './docs/openapi-player.js';
import { openapiAdmin } from './docs/openapi-admin.js';
import { openapiManager } from './docs/openapi-manager.js';
import { openapiAssistant } from './docs/openapi-assistant.js';
import { openapiLeagueManager } from './docs/openapi-league-manager.js';
import { openapiMatchManager } from './docs/openapi-match-manager.js';
import { openapiRefereeCommission } from './docs/openapi-referee-commission.js';
import { openapiFan } from './docs/openapi-fan.js';
import { rbacComponents, rbacRolesDocumentation } from './docs/rbac-openapi.js';

export function setupRoutes(app: Express) {
  app.use('/api/teams', teamsRouter);
  app.use('/api/players', playersRouter);
  app.use('/api/matches', matchesRouter);
  app.use('/api/evaluations', evaluationsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/access', accessRouter);
  app.use('/api/positions', positionsRouter);
  app.use('/api/leagues', leaguesRouter);
  app.use('/api/invites', invitationCodesRouter);
  app.use('/api/discipline', disciplineRouter);
  app.use('/api/admin/audit', auditRouter);
  app.use('/api/topics', topicsRouter);
  app.use('/api/formations', formationsRouter);
  app.use('/api', leagueFormatsRouter);
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() }),
  );

  // Enriquece OpenAPI com documentação RBAC
  const enrichedOpenapi = {
    ...openapi,
    components: {
      ...openapi.components,
      schemas: {
        ...(openapi.components?.schemas || {}),
        ...rbacComponents.schemas,
      },
    },
    tags: [rbacRolesDocumentation, ...(openapi.tags || [])],
  };

  // Página inicial com botões para todas as documentações por role
  app.get('/', (_req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>futi-api - Documentação</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 1200px;
            }
            h1 {
              font-size: 2.5rem;
              margin-bottom: 0.5rem;
            }
            p {
              font-size: 1.1rem;
              margin-bottom: 2rem;
              opacity: 0.9;
            }
            .section {
              margin-bottom: 2rem;
            }
            .section h2 {
              font-size: 1.3rem;
              margin-bottom: 1rem;
              opacity: 0.95;
            }
            .buttons {
              display: flex;
              gap: 1rem;
              justify-content: center;
              flex-wrap: wrap;
            }
            a {
              display: inline-block;
              padding: 0.8rem 1.5rem;
              background: white;
              color: #667eea;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 0.95rem;
              transition: transform 0.2s, box-shadow 0.2s;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            a:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 futi-api</h1>
            <p>Escolha a documentação de acordo com sua role:</p>
            
            <div class="section">
              <h2>📋 Documentações Gerais</h2>
              <div class="buttons">
                <a href="/docs/all">📚 Todos os Endpoints</a>
              </div>
            </div>

            <div class="section">
              <h2>👥 Documentações por Role</h2>
              <div class="buttons">
                <a href="/docs/admin">🎯 Admin Panel (MASTER/ADMIN)</a>
                <a href="/docs/manager">👔 Manager (Técnico)</a>
                <a href="/docs/assistant">📋 Assistant (Auxiliar)</a>
                <a href="/docs/player">⚽ Player (Jogador)</a>
                <a href="/docs/league-manager">🏆 League Manager</a>
                <a href="/docs/match-manager">⚽ Match Manager</a>
                <a href="/docs/referee-commission">📊 Referee Commission</a>
                <a href="/docs/fan">🎭 Fan (Torcedor)</a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  });

  // Swagger UI - usando serveFiles separado para cada rota
  const swaggerOptions = { customSiteTitle: 'futi-api' };

  // Swagger UI para todos os endpoints
  app.get('/docs/all.json', (_req, res) => res.json(enrichedOpenapi));
  app.use('/docs/all', swaggerUi.serveFiles(enrichedOpenapi, swaggerOptions));
  app.get(
    '/docs/all',
    swaggerUi.setup(enrichedOpenapi, { customSiteTitle: 'futi-api - Todos os Endpoints' }),
  );

  // Swagger UI para endpoints do jogador
  app.get('/docs/player.json', (_req, res) => res.json(openapiPlayer));
  app.use('/docs/player', swaggerUi.serveFiles(openapiPlayer, swaggerOptions));
  app.get(
    '/docs/player',
    swaggerUi.setup(openapiPlayer, { customSiteTitle: 'futi-api - Player App' }),
  );

  // Swagger UI para painel administrativo
  app.get('/docs/admin.json', (_req, res) => res.json(openapiAdmin));
  app.use('/docs/admin', swaggerUi.serveFiles(openapiAdmin, swaggerOptions));
  app.get(
    '/docs/admin',
    swaggerUi.setup(openapiAdmin, { customSiteTitle: 'futi-api - Admin Panel' }),
  );

  // Swagger UI para Manager (Técnico)
  app.get('/docs/manager.json', (_req, res) => res.json(openapiManager));
  app.use('/docs/manager', swaggerUi.serveFiles(openapiManager, swaggerOptions));
  app.get(
    '/docs/manager',
    swaggerUi.setup(openapiManager, { customSiteTitle: 'futi-api - Manager' }),
  );

  // Swagger UI para Assistant (Auxiliar)
  app.get('/docs/assistant.json', (_req, res) => res.json(openapiAssistant));
  app.use('/docs/assistant', swaggerUi.serveFiles(openapiAssistant, swaggerOptions));
  app.get(
    '/docs/assistant',
    swaggerUi.setup(openapiAssistant, { customSiteTitle: 'futi-api - Assistant' }),
  );

  // Swagger UI para League Manager
  app.get('/docs/league-manager.json', (_req, res) => res.json(openapiLeagueManager));
  app.use('/docs/league-manager', swaggerUi.serveFiles(openapiLeagueManager, swaggerOptions));
  app.get(
    '/docs/league-manager',
    swaggerUi.setup(openapiLeagueManager, { customSiteTitle: 'futi-api - League Manager' }),
  );

  // Swagger UI para Match Manager
  app.get('/docs/match-manager.json', (_req, res) => res.json(openapiMatchManager));
  app.use('/docs/match-manager', swaggerUi.serveFiles(openapiMatchManager, swaggerOptions));
  app.get(
    '/docs/match-manager',
    swaggerUi.setup(openapiMatchManager, { customSiteTitle: 'futi-api - Match Manager' }),
  );

  // Swagger UI para Referee Commission
  app.get('/docs/referee-commission.json', (_req, res) => res.json(openapiRefereeCommission));
  app.use(
    '/docs/referee-commission',
    swaggerUi.serveFiles(openapiRefereeCommission, swaggerOptions),
  );
  app.get(
    '/docs/referee-commission',
    swaggerUi.setup(openapiRefereeCommission, { customSiteTitle: 'futi-api - Referee Commission' }),
  );

  // Swagger UI para Fan (Torcedor)
  app.get('/docs/fan.json', (_req, res) => res.json(openapiFan));
  app.use('/docs/fan', swaggerUi.serveFiles(openapiFan, swaggerOptions));
  app.get('/docs/fan', swaggerUi.setup(openapiFan, { customSiteTitle: 'futi-api - Fan' }));

  // Mantém /docs redirecionando para a página principal (backward compatibility)
  app.get('/docs', (_req, res) => res.redirect('/'));
}
