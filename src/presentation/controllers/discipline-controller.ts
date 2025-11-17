import { PrismaClient } from '@prisma/client';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { ERROR_CODES } from '../../domain/constants.js';
import { PrismaDisciplineRepository } from '../../infra/repositories/prisma-discipline-repository.js';

const prisma = new PrismaClient();

export class ListLeagueCardsController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const leagueId = request.params?.leagueId;

    if (!leagueId) {
      return {
        statusCode: 400,
        body: { error: ERROR_CODES.INVALID_REQUEST },
      };
    }

    try {
      const repository = new PrismaDisciplineRepository(prisma);
      const cards = await repository.listLeagueCards(leagueId);

      return {
        statusCode: 200,
        body: { cards },
      };
    } catch (error) {
      console.error('[list_league_cards_error]', (error as Error).message);
      return {
        statusCode: 500,
        body: { error: ERROR_CODES.INTERNAL_ERROR },
      };
    }
  }
}

export class GetPlayerLeagueDisciplineController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const leagueId = request.params?.leagueId;
    const playerId = request.params?.playerId;

    if (!leagueId || !playerId) {
      return {
        statusCode: 400,
        body: { error: ERROR_CODES.INVALID_REQUEST },
      };
    }

    try {
      const repository = new PrismaDisciplineRepository(prisma);
      const discipline = await repository.getPlayerLeagueDiscipline(playerId, leagueId);

      return {
        statusCode: 200,
        body: discipline,
      };
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Player not found') {
        return {
          statusCode: 404,
          body: { error: ERROR_CODES.PLAYER_NOT_FOUND },
        };
      }
      console.error('[get_player_league_discipline_error]', err.message);
      return {
        statusCode: 500,
        body: { error: ERROR_CODES.INTERNAL_ERROR },
      };
    }
  }
}

export class GetPlayerFullDisciplineController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const playerId = request.params?.playerId;

    if (!playerId) {
      return {
        statusCode: 400,
        body: { error: ERROR_CODES.INVALID_REQUEST },
      };
    }

    try {
      const repository = new PrismaDisciplineRepository(prisma);
      const discipline = await repository.getPlayerFullDiscipline(playerId);

      return {
        statusCode: 200,
        body: discipline,
      };
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Player not found') {
        return {
          statusCode: 404,
          body: { error: ERROR_CODES.PLAYER_NOT_FOUND },
        };
      }
      console.error('[get_player_full_discipline_error]', err.message);
      return {
        statusCode: 500,
        body: { error: ERROR_CODES.INTERNAL_ERROR },
      };
    }
  }
}
