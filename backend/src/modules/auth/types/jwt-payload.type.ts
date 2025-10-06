export type JwtPayload = {
  sub: number;         // account id
  role: string;        // candidate | employer | admin
  purpose?: string;    // dùng cho verify-email hoặc reset-password
  iat?: number;        // issued at (Unix timestamp)
  exp?: number;        // expiration time (Unix timestamp)
};
