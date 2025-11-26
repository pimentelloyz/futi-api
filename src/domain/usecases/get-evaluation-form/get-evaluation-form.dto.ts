export interface GetEvaluationFormInput {
  userId: string;
  assignmentId: string;
}

export interface EvaluationCriteria {
  id: string;
  key: string;
  name: string;
  weight: number;
  min: number;
  max: number;
}

export interface GetEvaluationFormOutput {
  assignmentId: string;
  form: {
    id: string;
    name: string;
    positionType: string;
    version: number;
    criteria: EvaluationCriteria[];
  };
}
