import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./routes/auth.routes";
import { usersRoutes } from "./routes/users.routes";
import { teamsRoutes } from "./routes/teams.routes";
import { issuesRoutes } from "./routes/issues.routes";
import { triageRoutes } from "./routes/triage.routes";
import { inboxRoutes } from "./routes/inbox.routes";
import { analyticsRoutes } from "./routes/analytics.routes";
import { exportRoutes } from "./routes/export.routes";
import { AppError } from "./lib/errors";

const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3001")
  .split(",")
  .map((o) => o.trim());

export const app = new Elysia()
  .use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
  )
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Amertask API",
          version: "1.0.0",
          description: "Backend API untuk Amertask - Project Management System",
        },
        tags: [
          { name: "Auth", description: "Authentication endpoints" },
          { name: "Users", description: "User management" },
          { name: "Teams", description: "Team management" },
          { name: "Issues", description: "Issue tracking" },
          { name: "Triage", description: "Issue triage" },
          { name: "Inbox", description: "Notifications" },
          { name: "Analytics", description: "Analytics & reporting" },
        ],
      },
    }),
  )
  // Health check
  .get("/", () => ({
    message: "Amertask API",
    version: "1.0.0",
    status: "running",
  }))
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    runtime:
      typeof Bun !== "undefined" ? `bun ${Bun.version}` : process.version,
  }))
  // Routes
  .use(authRoutes)
  .use(usersRoutes)
  .use(teamsRoutes)
  .use(issuesRoutes)
  .use(triageRoutes)
  .use(inboxRoutes)
  .use(analyticsRoutes)
  .use(exportRoutes)
  // Global error handler
  .onError(({ code, error, set }) => {
    console.error("❌ Global error handler:", {
      code,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Ensure JSON response
    set.headers["content-type"] = "application/json";

    // Handle AppError
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return {
        error: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    // Handle validation errors
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        error: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Validation error",
        statusCode: 400,
      };
    }

    // Handle not found
    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        error: "NOT_FOUND",
        message: "Endpoint tidak ditemukan",
        statusCode: 404,
      };
    }

    // Default error
    set.status = 500;
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan server";
    return {
      error: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "Terjadi kesalahan server"
          : errorMessage,
      statusCode: 500,
      ...(process.env.NODE_ENV !== "production" && {
        details: error instanceof Error ? error.stack : String(error),
      }),
    };
  });

export type App = typeof app;
