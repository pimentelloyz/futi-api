import type { Request, Response } from 'express';
import type { GetLeagueSetupProgressUseCase } from '../../domain/usecases/get-league-setup-progress/get-league-setup-progress.usecase.js';

export class GetLeagueSetupProgressController {
  constructor(private readonly useCase: GetLeagueSetupProgressUseCase) {}

  async handleExpress(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = req.params.id;
      const userId = req.user?.id;

      if (!leagueId) {
        res.status(400).json({ error: 'INVALID_LEAGUE_ID', message: 'League ID is required' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
        return;
      }

      const result = await this.useCase.execute({ leagueId, userId });
      res.json(result);
    } catch (error: any) {
      if (error.message === 'LEAGUE_NOT_FOUND') {
        res.status(404).json({ error: 'LEAGUE_NOT_FOUND', message: 'League not found' });
        return;
      }
      if (error.message === 'UNAUTHORIZED') {
        res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have permission to view this league setup progress' });
        return;
      }
      console.error('Error getting league setup progress:', error);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error' });
    }
  }
}
