import { Router } from 'express';

import { makeAddTeamController } from '../../main/factories/make-add-team-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
// import { firebaseAuth } from '../middlewares/firebase-auth.js';

export const teamsRouter = Router();

// Proteger todas as rotas de teams com JWT interno
teamsRouter.use(jwtAuth);

teamsRouter.post('/', async (req, res) => {
  const controller = makeAddTeamController();
  const response = await controller.handle({ body: req.body });
  res.status(response.statusCode).json(response.body);
});

// Editar um time (parcial)
teamsRouter.patch('/:id', async (req, res) => {
  const teamId = req.params.id;
  if (!teamId) return res.status(400).json({ error: 'invalid_team_id' });
  const { name, icon, description, isActive } = req.body || {};
  const updateData: Record<string, unknown> = {};
  if (typeof name === 'string') updateData.name = name;
  if (typeof icon === 'string' || icon === null) updateData.icon = icon;
  if (typeof description === 'string' || description === null) updateData.description = description;
  if (typeof isActive === 'boolean') updateData.isActive = isActive;
  if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'invalid_body' });
  try {
    const prisma = (await import('../../infra/prisma/client.js')).prisma;
    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } });
    if (!team) return res.status(404).json({ error: 'team_not_found' });
    const updated = await prisma.team.update({ where: { id: teamId }, data: updateData });
    return res.json({
      id: updated.id,
      name: updated.name,
      icon: updated.icon,
      description: updated.description,
      isActive: updated.isActive,
    });
  } catch (e) {
    console.error('[team_update_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Listar jogadores de um time
teamsRouter.get('/:id/players', async (req, res) => {
  const teamId = req.params.id;
  if (!teamId) return res.status(400).json({ error: 'invalid_team_id' });
  // Query params: page, limit, sort, order, includeTeam
  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 100);
  const sort = String(req.query.sort ?? 'name') as 'name' | 'number' | 'position' | 'isActive';
  const order = String(req.query.order ?? 'asc') === 'desc' ? 'desc' : 'asc';
  const includeTeam = String(req.query.includeTeam ?? 'false') === 'true';
  const validSorts = new Set(['name', 'number', 'position', 'isActive']);
  const sortKey = validSorts.has(sort) ? sort : 'name';
  try {
    const prisma = (await import('../../infra/prisma/client.js')).prisma;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        isActive: true,
        id: includeTeam ? true : undefined,
        name: includeTeam ? true : undefined,
        players: { select: { id: true, name: true, position: true, number: true, isActive: true } },
      },
    });
    if (!team || (team as { isActive?: boolean }).isActive === false) {
      return res.status(404).json({ error: 'team_not_found' });
    }
    // Ordenar e paginar em memória
    type PlayerLite = {
      id: string;
      name: string;
      position: string | null;
      number: number | null;
      isActive: boolean;
    };
    const items = [...team.players].sort((a: PlayerLite, b: PlayerLite) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return order === 'asc' ? -1 : 1;
      if (bVal == null) return order === 'asc' ? 1 : -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (aVal === bVal) return 0;
      return order === 'asc' ? (aVal < bVal ? -1 : 1) : aVal > bVal ? -1 : 1;
    });
    const total = items.length;
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);
    const payload: {
      items: PlayerLite[];
      page: number;
      limit: number;
      total: number;
      team?: { id: string; name: string };
    } = { items: paged, page, limit, total };
    if (includeTeam)
      payload.team = { id: (team as { id?: string }).id!, name: (team as { name?: string }).name! };
    res.json(payload);
  } catch (e) {
    console.error('[team_players_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Vincular jogador a um time
teamsRouter.post('/:id/players', async (req, res) => {
  const teamId = req.params.id;
  const { playerId } = req.body || {};
  if (!teamId) return res.status(400).json({ error: 'invalid_team_id' });
  if (!playerId || typeof playerId !== 'string') {
    return res.status(400).json({ error: 'invalid_player_id' });
  }
  try {
    const prisma = (await import('../../infra/prisma/client.js')).prisma;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, isActive: true },
    });
    if (!team || team.isActive === false) return res.status(404).json({ error: 'team_not_found' });
    const updated = await prisma.player.update({
      where: { id: playerId },
      data: { teams: { connect: [{ id: teamId }] } },
    });
    if (!updated) return res.status(404).json({ error: 'player_not_found' });
    return res.status(204).send();
  } catch (e) {
    console.error('[team_add_player_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Soft delete de um time (usa isActive=false para evitar migração agora)
teamsRouter.delete('/:id', async (req, res) => {
  const teamId = req.params.id;
  if (!teamId) return res.status(400).json({ error: 'invalid_team_id' });
  try {
    const prisma = (await import('../../infra/prisma/client.js')).prisma;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, isActive: true },
    });
    if (!team) return res.status(404).json({ error: 'team_not_found' });
    if (team.isActive) {
      await prisma.team.update({ where: { id: teamId }, data: { isActive: false } });
    }
    return res.status(204).send();
  } catch (e) {
    console.error('[team_soft_delete_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});
