export interface AccountChoice {
  id: string;
  type: string;
}

export interface DatedMovement {
  id: string;
  date: string;
  createdAt?: string;
}
