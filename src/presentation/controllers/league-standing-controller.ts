import type { Request, Response } from 'express';

import { prisma } from '../../infra/prisma/client.js';
import { LeagueStandingService } from '../../domain/services/league-standing.service.js';

const leagueStandingService = new LeagueStandingService(prisma);

/**
 * POST /api/phases/:phaseId/standings/initialize
 * Inicializar tabela de classificação para uma fase
 * Acesso: ADMIN, LEAGUE_MANAGER
 */
export async function initializeStandings(req: Request, res: Response) {
  try {
    const { phaseId } = req.params;
    const { groupId } = req.body as { groupId?: string | null };

    if (!phaseId) {
      return res.status(400).json({ message: 'phaseId é obrigatório' });
    }

    await leagueStandingService.createStandingsForPhase(phaseId, groupId ?? undefined);

    return res.status(201).json({ message: 'Classificação inicializada com sucesso' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({ message: error.message });
      }
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /api/phases/:phaseId/standings
 * Obter classificação de uma fase (opcionalmente filtrada por grupo)
 * Acesso: Qualquer usuário autenticado
 */
export async function getStandings(req: Request, res: Response) {
  try {
    const { phaseId } = req.params;
    const { groupId } = req.query as { groupId?: string };

    if (!phaseId) {
      return res.status(400).json({ message: 'phaseId é obrigatório' });
    }

    const standings = await leagueStandingService.getStandingsByPhase(
      phaseId,
      groupId ?? undefined,
    );

    return res.json(standings);
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * POST /api/phases/:phaseId/standings/process-match
 * Processar resultado de uma partida e atualizar classificação
 * Acesso: ADMIN, LEAGUE_MANAGER
 */
export async function processMatchResult(req: Request, res: Response) {
  try {
    const { phaseId } = req.params;
    const {
      homeTeamId,
      awayTeamId,
      homeScore,
      awayScore,
      homeYellowCards,
      awayYellowCards,
      homeRedCards,
      awayRedCards,
      groupId,
    } = req.body as {
      homeTeamId: string;
      awayTeamId: string;
      homeScore: number;
      awayScore: number;
      homeYellowCards?: number;
      awayYellowCards?: number;
      homeRedCards?: number;
      awayRedCards?: number;
      groupId?: string | null;
    };

    if (
      !phaseId ||
      !homeTeamId ||
      !awayTeamId ||
      homeScore === undefined ||
      awayScore === undefined
    ) {
      return res
        .status(400)
        .json({
          message: 'phaseId, homeTeamId, awayTeamId, homeScore e awayScore são obrigatórios',
        });
    }

    await leagueStandingService.processMatchResult(
      phaseId,
      {
        homeTeamId,
        awayTeamId,
        homeScore,
        awayScore,
        homeYellowCards: homeYellowCards ?? 0,
        awayYellowCards: awayYellowCards ?? 0,
        homeRedCards: homeRedCards ?? 0,
        awayRedCards: awayRedCards ?? 0,
      },
      groupId ?? undefined,
    );

    return res.status(200).json({ message: 'Resultado processado com sucesso' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({ message: error.message });
      }
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * POST /api/phases/:phaseId/standings/recalculate
 * Recalcular posições da classificação com base nos critérios de desempate
 * Acesso: ADMIN, LEAGUE_MANAGER
 */
export async function recalculatePositions(req: Request, res: Response) {
  try {
    const { phaseId } = req.params;
    const { groupId } = req.body as { groupId?: string | null };

    if (!phaseId) {
      return res.status(400).json({ message: 'phaseId é obrigatório' });
    }

    await leagueStandingService.recalculatePositions(phaseId, groupId ?? undefined);

    return res.status(200).json({ message: 'Posições recalculadas com sucesso' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({ message: error.message });
      }
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * DELETE /api/phases/:phaseId/standings
 * Deletar toda a classificação de uma fase
 * Acesso: ADMIN, LEAGUE_MANAGER
 */
export async function deleteStandings(req: Request, res: Response) {
  try {
    const { phaseId } = req.params;

    if (!phaseId) {
      return res.status(400).json({ message: 'phaseId é obrigatório' });
    }

    await leagueStandingService.deleteStandingsByPhase(phaseId);

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
