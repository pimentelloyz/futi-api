import { Router } from 'express';

import { jwtAuth } from '../middlewares/jwt-auth.js';
import { listFormations, getFormation } from '../controllers/formations-controller.js';

export const formationsRouter = Router();

// Endpoints públicos (não requer autenticação para facilitar uso)
formationsRouter.get('/', listFormations);
formationsRouter.get('/:id', getFormation);
