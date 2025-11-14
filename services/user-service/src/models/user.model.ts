export type User = {
  id: number;
  username: string;
  createdAt: string;
};

export type CreateUserInput = {
  username: string;
};

export type UpdateUserInput = {
  username: string;
};
