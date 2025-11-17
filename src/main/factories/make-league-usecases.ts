import { PrismaClient } from '@prisma/client';

import { AddTeamToGroupUseCase } from '../../domain/usecases/add-team-to-group/add-team-to-group.usecase.js';
import { AddTeamToLeagueUseCase } from '../../domain/usecases/add-team-to-league/add-team-to-league.usecase.js';
import { CreateGroupUseCase } from '../../domain/usecases/create-group/create-group.usecase.js';
import { CreateLeagueUseCase } from '../../domain/usecases/create-league/create-league.usecase.js';
import { DeleteLeagueUseCase } from '../../domain/usecases/delete-league/delete-league.usecase.js';
import { GenerateFixturesUseCase } from '../../domain/usecases/generate-fixtures/generate-fixtures.usecase.js';
import { GetLeagueUseCase } from '../../domain/usecases/get-league/get-league.usecase.js';
import { GetMyLeagueDetailsUseCase } from '../../domain/usecases/get-my-league-details/get-my-league-details.usecase.js';
import { ListLeaguesUseCase } from '../../domain/usecases/list-leagues/list-leagues.usecase.js';
import { ListLeagueTeamsUseCase } from '../../domain/usecases/list-league-teams/list-league-teams.usecase.js';
import { ListMyLeaguesUseCase } from '../../domain/usecases/list-my-leagues/list-my-leagues.usecase.js';
import { UpdateLeagueUseCase } from '../../domain/usecases/update-league/update-league.usecase.js';
import { PrismaLeagueFixturesRepository } from '../../infra/repositories/prisma-league-fixtures-repository.js';
import { PrismaLeagueGroupRepository } from '../../infra/repositories/prisma-league-group-repository.js';
import { PrismaLeagueRepository } from '../../infra/repositories/prisma-league-repository.js';
import { PrismaLeagueTeamRepository } from '../../infra/repositories/prisma-league-team-repository.js';
import { PrismaUserAccessRepository } from '../../infra/repositories/prisma-user-access-repository.js';

const prisma = new PrismaClient();
const leagueRepository = new PrismaLeagueRepository(prisma);
const userAccessRepository = new PrismaUserAccessRepository(prisma);
const leagueTeamRepository = new PrismaLeagueTeamRepository(prisma);
const leagueGroupRepository = new PrismaLeagueGroupRepository(prisma);
const matchRepository = new PrismaLeagueFixturesRepository(prisma);

export function makeCreateLeagueUseCase() {
  return new CreateLeagueUseCase(leagueRepository);
}

export function makeListLeaguesUseCase() {
  return new ListLeaguesUseCase(leagueRepository);
}

export function makeListMyLeaguesUseCase() {
  return new ListMyLeaguesUseCase(leagueRepository, userAccessRepository);
}

export function makeGetLeagueUseCase() {
  return new GetLeagueUseCase(leagueRepository);
}

export function makeUpdateLeagueUseCase() {
  return new UpdateLeagueUseCase(leagueRepository);
}

export function makeDeleteLeagueUseCase() {
  return new DeleteLeagueUseCase(leagueRepository);
}

export function makeGetMyLeagueDetailsUseCase() {
  return new GetMyLeagueDetailsUseCase(leagueRepository, userAccessRepository);
}

export function makeListLeagueTeamsUseCase() {
  return new ListLeagueTeamsUseCase(leagueRepository, leagueTeamRepository);
}

export function makeAddTeamToLeagueUseCase() {
  return new AddTeamToLeagueUseCase(leagueRepository, leagueTeamRepository);
}

export function makeCreateGroupUseCase() {
  return new CreateGroupUseCase(leagueRepository, leagueGroupRepository);
}

export function makeAddTeamToGroupUseCase() {
  return new AddTeamToGroupUseCase(leagueGroupRepository);
}

export function makeGenerateFixturesUseCase() {
  return new GenerateFixturesUseCase(leagueGroupRepository, matchRepository);
}
