import { Request, Response } from 'express';
import { GetEvaluationFormUseCase, PlayerNotFoundError, AssignmentNotFoundError, ForbiddenError, NoActiveFormError } from './get-evaluation-form.usecase.js';

export class GetEvaluationFormController {
  constructor(private readonly useCase: GetEvaluationFormUseCase) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { assignmentId } = req.params;

      const result = await this.useCase.execute({ userId, assignmentId });

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof PlayerNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error instanceof AssignmentNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error instanceof ForbiddenError) {
        res.status(403).json({ error: error.message });
        return;
      }

      if (error instanceof NoActiveFormError) {
        res.status(404).json({ error: error.message });
        return;
      }

      console.error('Error in GetEvaluationFormController:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
