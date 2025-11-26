import type { Request, Response } from 'express';
import type { CheckPlayerExistsUseCase } from '../../domain/usecases/check-player-exists/check-player-exists.usecase.js';

export class CheckPlayerExistsController {
  constructor(private readonly useCase: CheckPlayerExistsUseCase) {}

  handleExpress = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
        return;
      }

      const result = await this.useCase.execute({ userId });

      if (!result.exists) {
        res.status(404).json({ error: 'PLAYER_NOT_FOUND', message: 'Player profile not found for this user' });
        return;
      }

      res.status(200).send();
    } catch (error: any) {
      console.error('Error checking player exists:', error);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error' });
    }
  };
}
