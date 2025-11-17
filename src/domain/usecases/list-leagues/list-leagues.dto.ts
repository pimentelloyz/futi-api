export interface ListLeaguesInput {
  q?: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
  startAtFrom?: string;
  startAtTo?: string;
  endAtFrom?: string;
  endAtTo?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface ListLeaguesOutput {
  items: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    banner: string | null;
    startAt: Date | null;
    endAt: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
}
