export interface GetLeagueSetupProgressInput {
  leagueId: string;
  userId: string;
}

export interface LeagueSetupStep {
  step: number;
  name: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'blocked';
  isRequired: boolean;
  actionRequired?: string;
  completedAt?: Date | null;
}

export interface GetLeagueSetupProgressOutput {
  leagueId: string;
  leagueName: string;
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  isSetupComplete: boolean;
  canStartLeague: boolean;
  steps: LeagueSetupStep[];
  nextAction?: {
    step: number;
    title: string;
    description: string;
    endpoint?: string;
  };
}
