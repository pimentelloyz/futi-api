import { RefreshAccessTokenController } from '../../presentation/controllers/refresh-access-token-controller.js';

export function makeRefreshAccessTokenController() {
  return new RefreshAccessTokenController();
}
