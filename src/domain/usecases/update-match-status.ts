export interface UpdateMatchStatusInput {
  id: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
}

export interface UpdateMatchStatus {
  updateStatus(input: UpdateMatchStatusInput): Promise<{ id: string; status: string }>;
}
