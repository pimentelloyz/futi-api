import { Request, Response } from 'express';
import {
  GetPendingEvaluationsUseCase,
  PlayerNotFoundError,
} from '../../domain/usecases/get-pending-evaluations/get-pending-evaluations.usecase.js';
import { ERROR_CODES } from '../../domain/constants.js';

export class GetPendingEvaluationsController {
  constructor(private readonly useCase: GetPendingEvaluationsUseCase) {}

  handleExpress = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
        return;
      }

      const result = await this.useCase.execute({ userId });

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof PlayerNotFoundError) {
        res.status(404).json({ error: ERROR_CODES.PLAYER_NOT_FOUND });
        return;
      }

      console.error('[GetPendingEvaluationsController]', (error as Error).message);
      res.status(500).json({ error: ERROR_CODES.INTERNAL_ERROR });
    }
  };
}
