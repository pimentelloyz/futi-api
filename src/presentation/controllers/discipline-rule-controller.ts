import type { Request, Response } from 'express';

import { prisma } from '../../infra/prisma/client.js';
import { DisciplineRuleService } from '../../domain/services/discipline-rule.service.js';

const disciplineRuleService = new DisciplineRuleService(prisma);

/**
 * POST /api/leagues/:leagueId/discipline-rules
 * Criar ou atualizar regras de disciplina para uma liga
 * Acesso: ADMIN, LEAGUE_MANAGER
 */
export async function createOrUpdateRules(req: Request, res: Response) {
  try {
    const { leagueId } = req.params;
    const { yellowCardsForSuspension, resetYellowsAfterPhaseOrder, redCardMinimumGames } =
      req.body as {
        yellowCardsForSuspension?: number;
        resetYellowsAfterPhaseOrder?: number | null;
        redCardMinimumGames?: number;
      };

    if (!leagueId) {
      return res.status(400).json({ message: 'leagueId é obrigatório' });
    }

    // Verificar se já existem regras
    const existingRules = await disciplineRuleService.getRulesByLeagueId(leagueId);

    let rules;
    if (existingRules) {
      // Atualizar
      rules = await disciplineRuleService.updateRules(leagueId, {
        yellowCardsForSuspension,
        resetYellowsAfterPhaseOrder: resetYellowsAfterPhaseOrder ?? undefined,
        redCardMinimumGames,
      });
    } else {
      // Criar
      rules = await disciplineRuleService.createRules({
        leagueId,
        yellowCardsForSuspension: yellowCardsForSuspension ?? 3,
        resetYellowsAfterPhaseOrder: resetYellowsAfterPhaseOrder ?? undefined,
        redCardMinimumGames: redCardMinimumGames ?? 1,
      });
    }

    return res.status(200).json(rules);
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
 * GET /api/leagues/:leagueId/discipline-rules
 * Obter regras de disciplina de uma liga
 * Acesso: Qualquer usuário autenticado
 */
export async function getRules(req: Request, res: Response) {
  try {
    const { leagueId } = req.params;

    if (!leagueId) {
      return res.status(400).json({ message: 'leagueId é obrigatório' });
    }

    const rules = await disciplineRuleService.getRulesByLeagueId(leagueId);

    if (!rules) {
      return res.status(404).json({ message: 'Regras de disciplina não encontradas' });
    }

    return res.json(rules);
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /api/leagues/:leagueId/players/:playerId/suspension-check
 * Verificar se um jogador está suspenso
 * Acesso: Qualquer usuário autenticado
 */
export async function checkPlayerSuspension(req: Request, res: Response) {
  try {
    const { leagueId, playerId } = req.params;

    if (!leagueId || !playerId) {
      return res.status(400).json({ message: 'leagueId e playerId são obrigatórios' });
    }

    const suspensionCheck = await disciplineRuleService.checkPlayerSuspension(playerId, leagueId);

    return res.json(suspensionCheck);
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
 * POST /api/leagues/:leagueId/phases/:phaseOrder/reset-yellow-cards
 * Resetar cartões amarelos após uma fase específica
 * Acesso: ADMIN, LEAGUE_MANAGER
 */
export async function resetYellowCards(req: Request, res: Response) {
  try {
    const { leagueId, phaseOrder } = req.params;

    if (!leagueId || !phaseOrder) {
      return res.status(400).json({ message: 'leagueId e phaseOrder são obrigatórios' });
    }

    const phaseOrderNum = parseInt(phaseOrder, 10);
    if (isNaN(phaseOrderNum)) {
      return res.status(400).json({ message: 'phaseOrder deve ser um número' });
    }

    await disciplineRuleService.resetYellowCardsAfterPhase(leagueId, phaseOrderNum);

    return res.status(200).json({ message: 'Cartões amarelos resetados com sucesso' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({ message: error.message });
      }
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}
