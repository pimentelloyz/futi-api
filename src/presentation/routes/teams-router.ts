import { Router } from 'express';

import { makeAddTeamController } from '../../main/factories/make-add-team-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
// import { firebaseAuth } from '../middlewares/firebase-auth.js';

export const teamsRouter = Router();

// Proteger todas as rotas de teams com JWT interno
teamsRouter.use(jwtAuth);

teamsRouter.post('/', async (req, res) => {
  const controller = makeAddTeamController();
  const response = await controller.handle({ body: req.body });
  res.status(response.statusCode).json(response.body);
});
