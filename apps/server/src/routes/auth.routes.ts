import { Elysia, t } from "elysia";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post("/register", authController.register, {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 6 }),
    }),
  })
  .post("/login", authController.login, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 1 }),
    }),
  })
  .post("/refresh", authController.refresh, {
    body: t.Object({
      refreshToken: t.String(),
    }),
  })
  .use(authMiddleware)
  .post("/logout", authController.logout);
