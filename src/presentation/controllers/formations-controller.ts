import { Request, Response } from 'express';

import {
  getAllFormations,
  getFormationsByFormat,
  getFormationById,
  type MatchFormat,
} from '../../domain/constants/formations.js';

/**
 * GET /api/formations
 * Listar todas as formações disponíveis ou filtrar por formato
 */
export async function listFormations(req: Request, res: Response) {
  try {
    const { format } = req.query;

    if (format && typeof format === 'string') {
      const upperFormat = format.toUpperCase() as MatchFormat;
      if (!['FUTSAL', 'FUT7', 'FUT11'].includes(upperFormat)) {
        return res.status(400).json({
          error: 'INVALID_FORMAT',
          message: 'Formato deve ser FUTSAL, FUT7 ou FUT11',
        });
      }

      const formations = getFormationsByFormat(upperFormat);
      return res.json({ formations });
    }

    const formations = getAllFormations();
    return res.json({ formations });
  } catch (error) {
    console.error('[list_formations_error]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

/**
 * GET /api/formations/:id
 * Obter detalhes de uma formação específica
 */
export async function getFormation(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const formation = getFormationById(id);

    if (!formation) {
      return res.status(404).json({
        error: 'FORMATION_NOT_FOUND',
        message: 'Formação não encontrada',
      });
    }

    return res.json(formation);
  } catch (error) {
    console.error('[get_formation_error]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}
