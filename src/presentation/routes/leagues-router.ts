import { Router } from 'express';
import multer from 'multer';

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
import {
  LeagueBannerUploadController,
  LeagueIconUploadController,
} from '../controllers/league-icon-upload-controller.js';

export const leaguesRouter = Router();

leaguesRouter.use(jwtAuth);

// Multer para uploads em memória (até 2MB por arquivo)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

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

// Uploads de imagens da liga (ícone e banner)
leaguesRouter.post('/:id/icon', upload.single('file'), async (req, res) => {
  const leagueId = req.params.id;
  const controller = new LeagueIconUploadController();
  const response = await controller.handle({ leagueId, file: req.file });
  return res.status(response.statusCode).json(response.body);
});

leaguesRouter.post('/:id/banner', upload.single('file'), async (req, res) => {
  const leagueId = req.params.id;
  const controller = new LeagueBannerUploadController();
  const response = await controller.handle({ leagueId, file: req.file });
  return res.status(response.statusCode).json(response.body);
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
