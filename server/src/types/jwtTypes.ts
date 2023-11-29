export interface JWTResult {
  username: string;
  userGroup: string;
  iat: number;
  exp: number;
  status: string;
  message: string;
}
