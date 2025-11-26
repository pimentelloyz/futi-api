import type { Request, Response } from 'express';
import type { GetLeagueTiebreakRulesUseCase } from '../../domain/usecases/get-league-tiebreak-rules/get-league-tiebreak-rules.usecase.js';

export class GetTiebreakCriteriaController {
  constructor(private readonly useCase: GetLeagueTiebreakRulesUseCase) {}

  async handleExpress(req: Request, res: Response): Promise<void> {
    try {
      const leagueId = req.params.id;
      const phaseId = req.query.phaseId as string | undefined;
      const userId = req.user?.id;

      if (!leagueId) {
        res.status(400).json({ message: 'League ID is required' });
        return;
      }

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const result = await this.useCase.execute({ leagueId, phaseId, userId });
      res.json(result);
    } catch (error: any) {
      if (error.message === 'league_not_found') {
        res.status(404).json({ message: 'League not found' });
        return;
      }
      if (error.message === 'phase_not_found') {
        res.status(404).json({ message: 'Phase not found' });
        return;
      }
      if (error.message === 'unauthorized') {
        res.status(403).json({ message: 'You do not have permission to view this league' });
        return;
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
