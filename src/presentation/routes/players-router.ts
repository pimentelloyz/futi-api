import { Router } from 'express';

import { makeAddPlayerController } from '../../main/factories/make-add-player-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';

export const playersRouter = Router();

// Protege todas as rotas de players
playersRouter.use(jwtAuth);

playersRouter.post('/', async (req, res) => {
  const controller = makeAddPlayerController();
  const response = await controller.handle({ body: req.body });
  res.status(response.statusCode).json(response.body);
});
