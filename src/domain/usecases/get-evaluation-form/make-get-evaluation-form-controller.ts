import { GetEvaluationFormUseCase } from './get-evaluation-form.usecase.js';
import { GetEvaluationFormController } from './get-evaluation-form-controller.js';
import { prisma } from '../../../infra/prisma/client.js';

export function makeGetEvaluationFormController() {
  const useCase = new GetEvaluationFormUseCase(prisma);
  return new GetEvaluationFormController(useCase);
}
