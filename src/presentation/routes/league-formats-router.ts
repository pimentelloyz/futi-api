import { Router } from 'express';

import { jwtAuth } from '../middlewares/jwt-auth.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { AccessRole } from '../../domain/constants/access-roles.js';
import {
  createFormat,
  getFormat,
  getFormatBySlug,
  listFormats,
  updateFormat,
  deleteFormat,
  applyFormatToLeague,
} from '../controllers/league-format-controller.js';
import {
  createOrUpdateRules,
  getRules,
  checkPlayerSuspension,
  resetYellowCards,
} from '../controllers/discipline-rule-controller.js';
import {
  initializeStandings,
  getStandings,
  processMatchResult,
  recalculatePositions,
  deleteStandings,
} from '../controllers/league-standing-controller.js';

export const leagueFormatsRouter = Router();

// ============================================================================
// FORMATOS DE CAMPEONATO (LEAGUE FORMATS)
// ============================================================================

// Rotas públicas (não requerem autenticação)
leagueFormatsRouter.get('/formats', listFormats);
leagueFormatsRouter.get('/formats/:id', getFormat);
leagueFormatsRouter.get('/formats/slug/:slug', getFormatBySlug);

// Rotas protegidas (requerem autenticação)
leagueFormatsRouter.use(jwtAuth);

// Gerenciar formatos (apenas ADMIN)
leagueFormatsRouter.post('/formats', requireRole([AccessRole.ADMIN]), createFormat);
leagueFormatsRouter.patch('/formats/:id', requireRole([AccessRole.ADMIN]), updateFormat);
leagueFormatsRouter.delete('/formats/:id', requireRole([AccessRole.ADMIN]), deleteFormat);

// Aplicar formato a uma liga (ADMIN ou LEAGUE_MANAGER)
leagueFormatsRouter.post(
  '/leagues/:leagueId/apply-format/:formatId',
  requireRole([AccessRole.ADMIN, AccessRole.LEAGUE_MANAGER]),
  applyFormatToLeague,
);

// ============================================================================
// REGRAS DE DISCIPLINA (DISCIPLINE RULES)
// ============================================================================

// Obter regras de disciplina (usuário autenticado)
leagueFormatsRouter.get('/leagues/:leagueId/discipline-rules', getRules);

// Criar/atualizar regras (ADMIN ou LEAGUE_MANAGER)
leagueFormatsRouter.post(
  '/leagues/:leagueId/discipline-rules',
  requireRole([AccessRole.ADMIN, AccessRole.LEAGUE_MANAGER]),
  createOrUpdateRules,
);

leagueFormatsRouter.patch(
  '/leagues/:leagueId/discipline-rules',
  requireRole([AccessRole.ADMIN, AccessRole.LEAGUE_MANAGER]),
  createOrUpdateRules,
);

// Verificar suspensão de jogador (usuário autenticado)
leagueFormatsRouter.get(
  '/leagues/:leagueId/players/:playerId/suspension-check',
  checkPlayerSuspension,
);

// Resetar cartões amarelos (ADMIN ou LEAGUE_MANAGER)
leagueFormatsRouter.post(
  '/leagues/:leagueId/phases/:phaseOrder/reset-yellow-cards',
  requireRole([AccessRole.ADMIN, AccessRole.LEAGUE_MANAGER]),
  resetYellowCards,
);

// ============================================================================
// CLASSIFICAÇÃO (STANDINGS)
// ============================================================================

// Obter classificação (usuário autenticado)
leagueFormatsRouter.get('/phases/:phaseId/standings', getStandings);

// Inicializar classificação (ADMIN ou LEAGUE_MANAGER)
leagueFormatsRouter.post(
  '/phases/:phaseId/standings/initialize',
  requireRole([AccessRole.ADMIN, AccessRole.LEAGUE_MANAGER]),
  initializeStandings,
);

// Processar resultado de partida (ADMIN ou LEAGUE_MANAGER)
leagueFormatsRouter.post(
  '/phases/:phaseId/standings/process-match',
  requireRole([AccessRole.ADMIN, AccessRole.LEAGUE_MANAGER]),
  processMatchResult,
);

// Recalcular posições (ADMIN ou LEAGUE_MANAGER)
leagueFormatsRouter.post(
  '/phases/:phaseId/standings/recalculate',
  requireRole([AccessRole.ADMIN, AccessRole.LEAGUE_MANAGER]),
  recalculatePositions,
);

// Deletar classificação (ADMIN)
leagueFormatsRouter.delete(
  '/phases/:phaseId/standings',
  requireRole([AccessRole.ADMIN]),
  deleteStandings,
);
