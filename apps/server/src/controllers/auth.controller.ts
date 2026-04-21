import { authService } from "../services/auth.service";
import { generateTokens, verifyJWT } from "../lib/jwt";

export const authController = {
  async register({ body }: any) {
    const { name, email, password } = body;

    const user = await authService.register(name, email, password);
    const tokens = await generateTokens(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        initials: user.initials,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  async login({ body }: any) {
    const { email, password } = body;

    const user = await authService.login(email, password);
    const tokens = await generateTokens(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        initials: user.initials,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  async refresh({ body }: any) {
    const { refreshToken } = body;

    // Verify refresh token (stateless JWT)
    const payload = await verifyJWT(refreshToken);

    // Generate new tokens
    const tokens = await generateTokens({
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  async logout() {
    // Stateless logout - client removes tokens
    return { message: "Logout berhasil" };
  },
};
