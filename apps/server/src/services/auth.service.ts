export { registerUser } from "./auth/register.service";
export type { RegisterPayload } from "./auth/register.service";
export { loginUser } from "./auth/login.service";
export type { LoginPayload } from "./auth/login.service";
export { refreshTokens } from "./auth/refresh.service";
export { logoutUser } from "./auth/logout.service";
export {
  verifyToken,
  signAccessToken,
  signRefreshToken,
} from "./auth/jwt.service";
export type { TokenPayload } from "./auth/jwt.service";
export { hashPassword, verifyPassword } from "./auth/password.service";
export {
  saveRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from "./auth/token.service";

import { registerUser } from "./auth/register.service";
import { loginUser } from "./auth/login.service";
import {
  saveRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from "./auth/token.service";

export const authService = {
  register: async (name: string, email: string, password: string) => {
    const result = await registerUser({ name, email, password });
    return result.user;
  },
  login: async (email: string, password: string) => {
    return loginUser({ email, password });
  },
  saveRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
};
