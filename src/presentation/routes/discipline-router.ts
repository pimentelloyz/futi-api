import { Router } from 'express';

import { jwtAuth } from '../middlewares/jwt-auth.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { AccessRole } from '../../domain/constants/access-roles.js';
import {
  ListLeagueCardsController,
  GetPlayerLeagueDisciplineController,
  GetPlayerFullDisciplineController,
} from '../controllers/discipline-controller.js';

export const disciplineRouter = Router();

disciplineRouter.use(jwtAuth);

// GET /api/discipline/leagues/:leagueId/cards
// Lista todos os cartões de uma liga
disciplineRouter.get(
  '/leagues/:leagueId/cards',
  requireRole([AccessRole.REFEREE_COMMISSION, AccessRole.LEAGUE_MANAGER, AccessRole.ADMIN]),
  async (req, res) => {
    const controller = new ListLeagueCardsController();
    const response = await controller.handle({ params: req.params });
    return res.status(response.statusCode).json(response.body);
  },
);

// GET /api/discipline/leagues/:leagueId/players/:playerId
// Histórico disciplinar de um jogador em uma liga específica
disciplineRouter.get(
  '/leagues/:leagueId/players/:playerId',
  requireRole([AccessRole.REFEREE_COMMISSION, AccessRole.LEAGUE_MANAGER, AccessRole.ADMIN]),
  async (req, res) => {
    const controller = new GetPlayerLeagueDisciplineController();
    const response = await controller.handle({ params: req.params });
    return res.status(response.statusCode).json(response.body);
  },
);

// GET /api/discipline/players/:playerId/history
// Histórico disciplinar completo de um jogador (todas as ligas)
disciplineRouter.get(
  '/players/:playerId/history',
  requireRole([AccessRole.REFEREE_COMMISSION, AccessRole.ADMIN]),
  async (req, res) => {
    const controller = new GetPlayerFullDisciplineController();
    const response = await controller.handle({ params: req.params });
    return res.status(response.statusCode).json(response.body);
  },
);
