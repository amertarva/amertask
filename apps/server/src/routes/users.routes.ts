import { Elysia, t } from "elysia";
import { verifyJWT } from "../lib/jwt";
import { errors } from "../lib/errors";
import { usersService } from "../services/users.service";

export const usersRoutes = new Elysia({ prefix: "/users" })
  .get("/me", async ({ headers }) => {
    console.log("👤 GET /users/me called");

    // Inline auth check
    const authHeader = headers.authorization;
    if (!authHeader) {
      throw errors.unauthorized("Token tidak ditemukan");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw errors.unauthorized("Format token tidak valid");
    }

    const payload = await verifyJWT(token);
    console.log("✅ Token verified, userId:", payload.sub);

    const user = await usersService.getProfile(payload.sub, payload.email);
    return user;
  })
  .patch(
    "/me",
    async ({ headers, body }) => {
      console.log("✏️ PATCH /users/me called");

      // Inline auth check
      const authHeader = headers.authorization;
      if (!authHeader) {
        throw errors.unauthorized("Token tidak ditemukan");
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        throw errors.unauthorized("Format token tidak valid");
      }

      const payload = await verifyJWT(token);
      console.log("✅ Token verified, userId:", payload.sub);

      const user = await usersService.updateProfile(
        payload.sub,
        body,
        payload.email,
      );
      return user;
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        avatar: t.Optional(t.String()),
      }),
    },
  )
  .get("/me/activity", async ({ headers, query }) => {
    console.log("📊 GET /users/me/activity called");

    // Inline auth check
    const authHeader = headers.authorization;
    if (!authHeader) {
      throw errors.unauthorized("Token tidak ditemukan");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw errors.unauthorized("Format token tidak valid");
    }

    const payload = await verifyJWT(token);
    console.log("✅ Token verified, userId:", payload.sub);

    const days = parseInt((query as any).days || "365");
    const activity = await usersService.getUserActivity(
      payload.sub,
      days,
      payload.email,
    );
    return activity;
  });
