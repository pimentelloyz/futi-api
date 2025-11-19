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

import { openapi } from './docs/openapi.js';
import { openapiPlayer } from './docs/openapi-player.js';
import { openapiAdmin } from './docs/openapi-admin.js';
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

  // Página inicial com botões para as duas documentações
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
            }
            h1 {
              font-size: 2.5rem;
              margin-bottom: 0.5rem;
            }
            p {
              font-size: 1.1rem;
              margin-bottom: 3rem;
              opacity: 0.9;
            }
            .buttons {
              display: flex;
              gap: 1.5rem;
              justify-content: center;
              flex-wrap: wrap;
            }
            a {
              display: inline-block;
              padding: 1rem 2rem;
              background: white;
              color: #667eea;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 1rem;
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
            <p>Escolha a documentação que deseja visualizar:</p>
            <div class="buttons">
              <a href="/docs/all">📚 Todos os Endpoints</a>
              <a href="/docs/player">⚽ Endpoints do aplicativo do jogador</a>
              <a href="/docs/admin">🎯 Endpoints do painel administrativo</a>
            </div>
          </div>
        </body>
      </html>
    `);
  });

  // Swagger UI para todos os endpoints
  app.use('/docs/all', swaggerUi.serve);
  app.get(
    '/docs/all',
    swaggerUi.setup(enrichedOpenapi, { customSiteTitle: 'futi-api - Todos os Endpoints' }),
  );
  app.get('/docs/all.json', (_req, res) => res.json(enrichedOpenapi));

  // Swagger UI para endpoints do jogador
  app.use('/docs/player', swaggerUi.serve);
  app.get(
    '/docs/player',
    swaggerUi.setup(openapiPlayer, { customSiteTitle: 'futi-api - Player App' }),
  );
  app.get('/docs/player.json', (_req, res) => res.json(openapiPlayer));

  // Swagger UI para painel administrativo
  app.use('/docs/admin', swaggerUi.serve);
  app.get(
    '/docs/admin',
    swaggerUi.setup(openapiAdmin, { customSiteTitle: 'futi-api - Admin Panel' }),
  );
  app.get('/docs/admin.json', (_req, res) => res.json(openapiAdmin));

  // Mantém /docs redirecionando para a página principal (backward compatibility)
  app.get('/docs', (_req, res) => res.redirect('/'));
}
