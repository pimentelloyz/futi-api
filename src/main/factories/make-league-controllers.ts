import { CreateLeagueController } from '../../presentation/controllers/create-league-controller.js';
import { DeleteLeagueController } from '../../presentation/controllers/delete-league-controller.js';
import { GetLeagueController } from '../../presentation/controllers/get-league-controller.js';
import { ListLeaguesController } from '../../presentation/controllers/list-leagues-controller.js';
import { ListMyLeaguesController } from '../../presentation/controllers/list-my-leagues-controller.js';
import { UpdateLeagueController } from '../../presentation/controllers/update-league-controller.js';

import {
  makeCreateLeagueUseCase,
  makeDeleteLeagueUseCase,
  makeGetLeagueUseCase,
  makeListLeaguesUseCase,
  makeListMyLeaguesUseCase,
  makeUpdateLeagueUseCase,
} from './make-league-usecases.js';

export function makeCreateLeagueController() {
  const useCase = makeCreateLeagueUseCase();
  return new CreateLeagueController(useCase);
}

export function makeListLeaguesController() {
  const useCase = makeListLeaguesUseCase();
  return new ListLeaguesController(useCase);
}

export function makeListMyLeaguesController() {
  const useCase = makeListMyLeaguesUseCase();
  return new ListMyLeaguesController(useCase);
}

export function makeGetLeagueController() {
  const useCase = makeGetLeagueUseCase();
  return new GetLeagueController(useCase);
}

export function makeUpdateLeagueController() {
  const useCase = makeUpdateLeagueUseCase();
  return new UpdateLeagueController(useCase);
}

export function makeDeleteLeagueController() {
  const useCase = makeDeleteLeagueUseCase();
  return new DeleteLeagueController(useCase);
}
