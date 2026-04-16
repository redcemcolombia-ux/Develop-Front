export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  expiresAtIso: string;
}
