import { Router } from 'express';

import { jwtAuth } from '../middlewares/jwt-auth.js';
import {
  createLeague,
  listLeagues,
  listMyLeagues,
  getMyLeagueDetails,
  getLeague,
  updateLeague,
  deleteLeague,
  addTeamToLeague,
  createGroup,
  addTeamToGroup,
  generateFixturesForGroup,
} from '../controllers/league-controller.js';

export const leaguesRouter = Router();

leaguesRouter.use(jwtAuth);

leaguesRouter.post('/', async (req, res) => {
  return createLeague(req, res);
});

leaguesRouter.get('/', async (req, res) => {
  return listLeagues(req, res);
});

leaguesRouter.get('/me', async (req, res) => {
  return listMyLeagues(req, res);
});

leaguesRouter.get('/me/:id', async (req, res) => {
  return getMyLeagueDetails(req, res);
});

leaguesRouter.get('/:id', async (req, res) => {
  return getLeague(req, res);
});

leaguesRouter.patch('/:id', async (req, res) => {
  return updateLeague(req, res);
});

leaguesRouter.delete('/:id', async (req, res) => {
  return deleteLeague(req, res);
});

leaguesRouter.post('/:id/teams', async (req, res) => {
  return addTeamToLeague(req, res);
});

leaguesRouter.post('/:id/groups', async (req, res) => {
  return createGroup(req, res);
});

leaguesRouter.post('/:id/groups/:groupId/teams', async (req, res) => {
  return addTeamToGroup(req, res);
});

leaguesRouter.post('/:id/groups/:groupId/fixtures', async (req, res) => {
  return generateFixturesForGroup(req, res);
});
