import { Router } from 'express';

import { jwtAuth } from '../middlewares/jwt-auth.js';
import { makeGetPendingEvaluationsController } from '../../main/factories/make-get-pending-evaluations-controller.js';
import { makeGetEvaluationFormController } from '../../domain/usecases/get-evaluation-form/make-get-evaluation-form-controller.js';
import { makeSubmitEvaluationController } from '../../domain/usecases/submit-evaluation/make-submit-evaluation-controller.js';

export const evaluationsRouter = Router();

evaluationsRouter.use(jwtAuth);

// List pending assignments for current player
// GET /api/evaluations/pending
// Response: { items: [{ id, matchId, targetPlayerId, targetName? }] }
evaluationsRouter.get('/pending', makeGetPendingEvaluationsController().handleExpress);

// Get active form and criteria for an assignment (to list questions)
// GET /api/evaluations/:assignmentId/form
evaluationsRouter.get('/:assignmentId/form', (req, res) => {
  makeGetEvaluationFormController().handle(req, res);
});

// Submit evaluation
// POST /api/evaluations/{assignmentId}
evaluationsRouter.post('/:assignmentId', (req, res) => {
  makeSubmitEvaluationController().handle(req, res);
});
