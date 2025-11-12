import { RegisterPushTokenController } from '../../presentation/controllers/register-push-token-controller.js';
import { PrismaPushTokenRepository } from '../../infra/repositories/prisma-push-token-repository.js';

export function makeRegisterPushTokenController() {
  const repo = new PrismaPushTokenRepository();
  return new RegisterPushTokenController(repo);
}
