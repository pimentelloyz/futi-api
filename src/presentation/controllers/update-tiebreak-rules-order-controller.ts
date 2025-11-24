import type { Request, Response } from 'express';
import type { UpdateTiebreakRulesOrderUseCase } from '../../domain/usecases/update-tiebreak-rules-order/update-tiebreak-rules-order.usecase.js';

export class UpdateTiebreakRulesOrderController {
  constructor(private readonly useCase: UpdateTiebreakRulesOrderUseCase) {}

  async handleExpress(req: Request, res: Response): Promise<Response | void> {
    try {
      const leagueId = req.params.id;
      const phaseId = req.params.phaseId;
      const userId = req.user?.id;
      const { rules } = req.body;

      if (!leagueId) {
        return res.status(400).json({ message: 'League ID is required' });
      }

      if (!phaseId) {
        return res.status(400).json({ message: 'Phase ID is required' });
      }

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (!rules || !Array.isArray(rules)) {
        return res.status(400).json({ message: 'Rules array is required' });
      }

      const result = await this.useCase.execute({ leagueId, phaseId, userId, rules });
      return res.json(result);
    } catch (error: any) {
      console.error('[UpdateTiebreakRulesOrder] Error:', error.message);
      if (error.message === 'league_not_found') {
        return res.status(404).json({ message: 'League not found' });
      }
      if (error.message === 'phase_not_found') {
        return res.status(404).json({ message: 'Phase not found' });
      }
      if (error.message === 'phase_config_not_found') {
        return res.status(404).json({ message: 'Phase configuration not found' });
      }
      if (error.message === 'league_already_started') {
        return res.status(403).json({ message: 'Cannot edit tiebreak rules after league has started' });
      }
      if (error.message === 'unauthorized') {
        return res.status(403).json({ message: 'You do not have permission to edit this league' });
      }
      console.error('Error updating tiebreak rules order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
