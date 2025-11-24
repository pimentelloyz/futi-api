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
        return res.status(400).json({ message: 'League ID is required' });
      }

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const result = await this.useCase.execute({ leagueId, phaseId, userId });
      res.json(result);
    } catch (error: any) {
      if (error.message === 'league_not_found') {
        return res.status(404).json({ message: 'League not found' });
      }
      if (error.message === 'phase_not_found') {
        return res.status(404).json({ message: 'Phase not found' });
      }
      if (error.message === 'unauthorized') {
        return res.status(403).json({ message: 'You do not have permission to view this league' });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
