/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from 'express';

import { jwtAuth } from '../middlewares/jwt-auth.js';
import { requireAdmin } from '../middlewares/authorize.js';
import { ERROR_CODES } from '../../domain/constants.js';
import { ListPositionsController } from '../controllers/list-positions-controller.js';
import { UpdatePositionController } from '../controllers/update-position-controller.js';
import { DeletePositionController } from '../controllers/delete-position-controller.js';

export const positionsRouter = Router();

// Controllers
const listController = new ListPositionsController();
const updateController = new UpdatePositionController();
const deleteController = new DeletePositionController();

// All routes require JWT; edits require ADMIN
positionsRouter.use(jwtAuth);

// GET /api/positions - list all positions
positionsRouter.get('/', async (req, res) => {
  try {
    const httpRes = await listController.handle(req as any);
    return res.status(httpRes.statusCode).json(httpRes.body);
  } catch (e) {
    console.error('[positions_list_error]', (e as Error).message);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

// PATCH /api/positions/:slug - update name/description (admin)
positionsRouter.patch('/:slug', requireAdmin(), async (req, res) => {
  try {
    const httpRes = await updateController.handle(req as any);
    return res.status(httpRes.statusCode).json(httpRes.body);
  } catch (e) {
    const msg = (e as Error).message;
    console.error('[positions_patch_error]', msg);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});

// DELETE /api/positions/:slug (admin)
positionsRouter.delete('/:slug', requireAdmin(), async (req, res) => {
  try {
    const httpRes = await deleteController.handle(req as any);
    return res.status(httpRes.statusCode).json(httpRes.body);
  } catch (e) {
    const msg = (e as Error).message;
    console.error('[positions_delete_error]', msg);
    return res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
  }
});
