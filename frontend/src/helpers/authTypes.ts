export type LoginResponse = {
  ok: boolean;
  token?: string;
  error?: string;
};

export type TokenResponse = {
  ok: boolean;
  error?: string;
};
