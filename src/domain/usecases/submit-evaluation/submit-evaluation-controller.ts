import { Request, Response } from 'express';
import { z } from 'zod';
import { SubmitEvaluationUseCase, PlayerNotFoundError, AssignmentNotFoundError, ForbiddenError, AlreadyCompletedError } from './submit-evaluation.usecase.js';

const submitEvaluationSchema = z.object({
  rating: z.number().min(0).max(10),
  comment: z.string().max(500).optional(),
});

export class SubmitEvaluationController {
  constructor(private readonly useCase: SubmitEvaluationUseCase) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { assignmentId } = req.params;

      const validation = submitEvaluationSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ error: validation.error.format() });
        return;
      }

      const { rating, comment } = validation.data;

      const result = await this.useCase.execute({
        userId,
        assignmentId,
        rating,
        comment,
      });

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

      if (error instanceof AlreadyCompletedError) {
        res.status(409).json({ error: error.message });
        return;
      }

      console.error('Error in SubmitEvaluationController:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
