import { Router } from 'express';

import { makeAddTeamController } from '../../main/factories/make-add-team-controller.js';
// import { firebaseAuth } from '../middlewares/firebase-auth.js';

export const teamsRouter = Router();

// Para exigir autenticação, descomente a linha abaixo:
// teamsRouter.use(firebaseAuth);

teamsRouter.post('/', async (req, res) => {
  const controller = makeAddTeamController();
  const response = await controller.handle({ body: req.body });
  res.status(response.statusCode).json(response.body);
});
