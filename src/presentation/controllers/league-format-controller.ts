import type { Request, Response } from 'express';

import { prisma } from '../../infra/prisma/client.js';
import { LeagueFormatService } from '../../domain/services/league-format.service.js';

const leagueFormatService = new LeagueFormatService(prisma);

/**
 * POST /api/league-formats
 * Criar um novo formato de campeonato
 * Acesso: ADMIN
 */
export async function createFormat(req: Request, res: Response) {
  try {
    const { name, slug, type, description, isTemplate, phases } = req.body as {
      name?: string;
      slug?: string;
      type?: string;
      description?: string | null;
      isTemplate?: boolean;
      phases?: Array<{
        name: string;
        order: number;
        type: string;
        teamsCount?: number | null;
        groupsCount?: number | null;
        hasHomeAway?: boolean;
        hasExtraTime?: boolean;
        hasPenalties?: boolean;
        hasAwayGoal?: boolean;
        advancingTeams?: number | null;
        tiebreakRules: Array<{
          order: number;
          criterion: string;
        }>;
      }>;
    };

    if (!name || !slug || !type) {
      return res.status(400).json({ message: 'name, slug e type são obrigatórios' });
    }

    if (!phases || !Array.isArray(phases) || phases.length === 0) {
      return res
        .status(400)
        .json({ message: 'phases é obrigatório e deve conter ao menos 1 fase' });
    }

    const format = await leagueFormatService.createFormat({
      name,
      slug,
      type,
      description: description ?? undefined,
      isTemplate: isTemplate ?? true,
      phases: phases.map((phase) => ({
        name: phase.name,
        order: phase.order,
        type: phase.type,
        teamsCount: phase.teamsCount ?? undefined,
        groupsCount: phase.groupsCount ?? undefined,
        hasHomeAway: phase.hasHomeAway ?? false,
        hasExtraTime: phase.hasExtraTime ?? false,
        hasPenalties: phase.hasPenalties ?? false,
        hasAwayGoal: phase.hasAwayGoal ?? false,
        advancingTeams: phase.advancingTeams ?? undefined,
        tiebreakRules: phase.tiebreakRules.map((rule) => ({
          order: rule.order,
          criterion: rule.criterion,
        })),
      })),
    });

    return res.status(201).json(format);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('já existe')) {
        return res.status(409).json({ message: error.message });
      }
      if (error.message.includes('inválid')) {
        return res.status(400).json({ message: error.message });
      }
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /api/league-formats/:id
 * Obter detalhes de um formato específico
 * Acesso: Público
 */
export async function getFormat(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'ID do formato é obrigatório' });
    }

    const format = await leagueFormatService.getFormatById(id);

    if (!format) {
      return res.status(404).json({ message: 'Formato não encontrado' });
    }

    return res.json(format);
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /api/league-formats/slug/:slug
 * Obter formato por slug
 * Acesso: Público
 */
export async function getFormatBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ message: 'Slug do formato é obrigatório' });
    }

    const format = await leagueFormatService.getFormatBySlug(slug);

    if (!format) {
      return res.status(404).json({ message: 'Formato não encontrado' });
    }

    return res.json(format);
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /api/league-formats
 * Listar formatos (templates ou todos)
 * Acesso: Público
 */
export async function listFormats(req: Request, res: Response) {
  try {
    const { templatesOnly } = req.query as { templatesOnly?: string };

    const formats = await leagueFormatService.listFormats(templatesOnly === 'true' ? true : false);

    return res.json(formats);
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * PATCH /api/league-formats/:id
 * Atualizar metadados de um formato
 * Acesso: ADMIN
 */
export async function updateFormat(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, isTemplate } = req.body as {
      name?: string;
      description?: string | null;
      isTemplate?: boolean;
    };

    if (!id) {
      return res.status(400).json({ message: 'ID do formato é obrigatório' });
    }

    const format = await leagueFormatService.updateFormat(id, {
      name,
      description: description ?? undefined,
      isTemplate,
    });

    return res.json(format);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('já existe')) {
        return res.status(409).json({ message: error.message });
      }
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * DELETE /api/league-formats/:id
 * Deletar um formato (se não estiver em uso)
 * Acesso: ADMIN
 */
export async function deleteFormat(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'ID do formato é obrigatório' });
    }

    await leagueFormatService.deleteFormat(id);

    return res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('em uso')) {
        return res.status(409).json({ message: error.message });
      }
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * POST /api/leagues/:leagueId/apply-format/:formatId
 * Aplicar um template de formato a uma liga
 * Acesso: ADMIN, LEAGUE_MANAGER
 */
export async function applyFormatToLeague(req: Request, res: Response) {
  try {
    const { leagueId, formatId } = req.params;

    if (!leagueId || !formatId) {
      return res.status(400).json({ message: 'leagueId e formatId são obrigatórios' });
    }

    await leagueFormatService.applyFormatToLeague(leagueId, formatId);

    return res.status(200).json({ message: 'Formato aplicado com sucesso' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrad')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('já possui')) {
        return res.status(409).json({ message: error.message });
      }
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}
