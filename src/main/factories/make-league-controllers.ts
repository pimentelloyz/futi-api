import { AddTeamToGroupController } from '../../presentation/controllers/add-team-to-group-controller.js';
import { AddTeamToLeagueController } from '../../presentation/controllers/add-team-to-league-controller.js';
import { CreateGroupController } from '../../presentation/controllers/create-group-controller.js';
import { CreateLeagueController } from '../../presentation/controllers/create-league-controller.js';
import { DeleteLeagueController } from '../../presentation/controllers/delete-league-controller.js';
import { GenerateFixturesController } from '../../presentation/controllers/generate-fixtures-controller.js';
import { GenerateGroupsController } from '../../presentation/controllers/generate-groups-controller.js';
import { GetLeagueController } from '../../presentation/controllers/get-league-controller.js';
import { GetLeagueSettingsController } from '../../presentation/controllers/get-league-settings-controller.js';
import { GetMyLeagueDetailsController } from '../../presentation/controllers/get-my-league-details-controller.js';
import { GetTiebreakCriteriaController } from '../../presentation/controllers/get-tiebreak-criteria-controller.js';
import { ListLeaguesController } from '../../presentation/controllers/list-leagues-controller.js';
import { ListLeagueTeamsController } from '../../presentation/controllers/list-league-teams-controller.js';
import { ListMyLeaguesController } from '../../presentation/controllers/list-my-leagues-controller.js';
import { UpdateLeagueController } from '../../presentation/controllers/update-league-controller.js';
import { UpdateTiebreakRulesOrderController } from '../../presentation/controllers/update-tiebreak-rules-order-controller.js';

import {
  makeAddTeamToGroupUseCase,
  makeAddTeamToLeagueUseCase,
  makeCreateGroupUseCase,
  makeCreateLeagueUseCase,
  makeDeleteLeagueUseCase,
  makeGenerateFixturesUseCase,
  makeGenerateGroupsUseCase,
  makeGetLeagueUseCase,
  makeGetLeagueSettingsUseCase,
  makeGetLeagueTiebreakRulesUseCase,
  makeGetMyLeagueDetailsUseCase,
  makeListLeaguesUseCase,
  makeListLeagueTeamsUseCase,
  makeListMyLeaguesUseCase,
  makeUpdateLeagueUseCase,
  makeUpdateTiebreakRulesOrderUseCase,
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

export function makeGetMyLeagueDetailsController() {
  const useCase = makeGetMyLeagueDetailsUseCase();
  return new GetMyLeagueDetailsController(useCase);
}

export function makeListLeagueTeamsController() {
  const useCase = makeListLeagueTeamsUseCase();
  return new ListLeagueTeamsController(useCase);
}

export function makeAddTeamToLeagueController() {
  const useCase = makeAddTeamToLeagueUseCase();
  return new AddTeamToLeagueController(useCase);
}

export function makeCreateGroupController() {
  const useCase = makeCreateGroupUseCase();
  return new CreateGroupController(useCase);
}

export function makeAddTeamToGroupController() {
  const useCase = makeAddTeamToGroupUseCase();
  return new AddTeamToGroupController(useCase);
}

export function makeGenerateFixturesController() {
  const useCase = makeGenerateFixturesUseCase();
  return new GenerateFixturesController(useCase);
}

export function makeGenerateGroupsController() {
  const useCase = makeGenerateGroupsUseCase();
  return new GenerateGroupsController(useCase);
}

export function makeGetLeagueSettingsController() {
  const useCase = makeGetLeagueSettingsUseCase();
  return new GetLeagueSettingsController(useCase);
}

export function makeGetTiebreakCriteriaController() {
  const useCase = makeGetLeagueTiebreakRulesUseCase();
  return new GetTiebreakCriteriaController(useCase);
}

export function makeUpdateTiebreakRulesOrderController() {
  const useCase = makeUpdateTiebreakRulesOrderUseCase();
  return new UpdateTiebreakRulesOrderController(useCase);
}
