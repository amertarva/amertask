import type { JWTPayload } from "jose";

export interface TokenPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
