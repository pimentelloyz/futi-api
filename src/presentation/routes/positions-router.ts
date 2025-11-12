/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from 'express';

import { jwtAuth } from '../middlewares/jwt-auth.js';
import { requireAdmin } from '../middlewares/authorize.js';
import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

export const positionsRouter = Router();

type PositionListItem = { slug?: string; name?: string; description?: string | null };
type PositionGetItem = { slug: string; name: string; description: string | null };
type PositionClient = {
  findMany: (args: {
    orderBy?: { name?: 'asc' | 'desc' }[] | { name?: 'asc' | 'desc' };
    select?: { slug?: boolean; name?: boolean; description?: boolean };
  }) => Promise<PositionListItem[]>;
  update: (args: {
    where: { slug: string };
    data: { name?: string; description?: string };
    select: { slug: boolean; name: boolean; description: boolean };
  }) => Promise<PositionGetItem>;
  delete: (args: { where: { slug: string } }) => Promise<unknown>;
};

function getPositionClient(): PositionClient {
  const anyPrisma = prisma as any;
  return anyPrisma.position as PositionClient;
}

// All routes require JWT; edits require ADMIN
positionsRouter.use(jwtAuth);

// GET /api/positions - list all positions
positionsRouter.get('/', async (_req, res) => {
  try {
    const position = getPositionClient();
    const items = await position.findMany({
      orderBy: [{ name: 'asc' }],
      select: { slug: true, name: true, description: true },
    });
    return res.status(200).json({ items });
  } catch (e) {
    console.error('[positions_list_error]', (e as Error).message);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

// PATCH /api/positions/:slug - update name/description (admin)
positionsRouter.patch('/:slug', requireAdmin(), async (req, res) => {
  const { slug } = req.params;
  const { name, description } = req.body ?? {};
  if (!slug) return res.status(400).json({ error: ERROR_CODES.INVALID_BODY });
  if (name !== undefined && typeof name !== 'string')
    return res.status(400).json({ error: ERROR_CODES.INVALID_BODY });
  if (description !== undefined && typeof description !== 'string')
    return res.status(400).json({ error: ERROR_CODES.INVALID_BODY });
  try {
    const position = getPositionClient();
    const updated = await position.update({
      where: { slug },
      data: { name: name as string | undefined, description: description as string | undefined },
      select: { slug: true, name: true, description: true },
    });
    return res.status(200).json({ item: updated });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('Record to update not found'))
      return res.status(404).json({ error: 'position_not_found' });
    console.error('[positions_patch_error]', msg);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

// DELETE /api/positions/:slug (admin)
positionsRouter.delete('/:slug', requireAdmin(), async (req, res) => {
  const { slug } = req.params;
  if (!slug) return res.status(400).json({ error: ERROR_CODES.INVALID_BODY });
  try {
    const position = getPositionClient();
    await position.delete({ where: { slug } });
    return res.status(200).json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('Record to delete does not exist'))
      return res.status(404).json({ error: 'position_not_found' });
    console.error('[positions_delete_error]', msg);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});
