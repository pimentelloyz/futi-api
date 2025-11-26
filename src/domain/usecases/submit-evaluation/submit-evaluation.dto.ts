export interface SubmitEvaluationInput {
  userId: string;
  assignmentId: string;
  rating: number;
  comment?: string;
}

export interface SubmitEvaluationOutput {
  id: string;
  assignmentId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}
