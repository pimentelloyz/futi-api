import { Router } from 'express';

import { jwtAuth } from '../middlewares/jwt-auth.js';
import {
  makeSubscribeToTopicController,
  makeUnsubscribeFromTopicController,
  makeSendToTopicController,
} from '../../main/factories/make-topics-controller.js';

export const topicsRouter = Router();

// POST /api/topics/subscribe - inscrever em tópico
topicsRouter.post('/subscribe', jwtAuth, async (req, res) => {
  const controller = makeSubscribeToTopicController();
  return controller.handle(req, res);
});

// POST /api/topics/unsubscribe - desinscrever de tópico
topicsRouter.post('/unsubscribe', jwtAuth, async (req, res) => {
  const controller = makeUnsubscribeFromTopicController();
  return controller.handle(req, res);
});

// POST /api/topics/send - enviar notificação para tópico (admin)
topicsRouter.post('/send', jwtAuth, async (req, res) => {
  const controller = makeSendToTopicController();
  return controller.handle(req, res);
});
