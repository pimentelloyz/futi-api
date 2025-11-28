import { CreateRecurringMatchesController } from '../../presentation/controllers/create-recurring-matches-controller.js';
import { CreateRecurringMatchesUseCase } from '../../domain/usecases/create-recurring-matches/create-recurring-matches.usecase.js';
import { prisma } from '../../infra/prisma/client.js';

export function makeCreateRecurringMatchesController() {
  const useCase = new CreateRecurringMatchesUseCase(prisma);
  return new CreateRecurringMatchesController(useCase);
}
