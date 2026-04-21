import { Elysia } from "elysia";
import { verifyJWT } from "../lib/jwt";
import { errors } from "../lib/errors";

export const authMiddleware = new Elysia({ name: "auth" })
  .state("currentUser", null as any)
  .onBeforeHandle(async ({ headers, store, set }) => {
    console.log("🔐 [AUTH] Middleware executing...");

    const authHeader = headers.authorization;
    if (!authHeader) {
      console.log("❌ [AUTH] No authorization header");
      throw errors.unauthorized("Token tidak ditemukan");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("❌ [AUTH] No token in header");
      throw errors.unauthorized("Format token tidak valid");
    }

    try {
      const payload = await verifyJWT(token);
      console.log("✅ [AUTH] Token verified:", {
        sub: payload.sub,
        email: payload.email,
      });

      // Store in both store and set
      (store as any).currentUser = payload;
      (set as any).currentUser = payload;
    } catch (error) {
      console.log("❌ [AUTH] Token verification failed:", error);
      throw errors.unauthorized("Token tidak valid atau kedaluwarsa");
    }
  })
  .derive(({ store }) => ({
    currentUser: (store as any).currentUser,
  }));
