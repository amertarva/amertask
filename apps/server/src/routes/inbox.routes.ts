import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { inboxController } from "../controllers/inbox.controller";

export const inboxRoutes = new Elysia({ prefix: "/inbox" })
  .use(authMiddleware)
  .get("/", (context: any) => inboxController.list(context), {
    query: t.Object({
      unread: t.Optional(t.String()),
    }),
  })
  .patch("/:id/read", (context: any) => inboxController.markAsRead(context))
  .patch("/read-all", (context: any) => inboxController.markAllAsRead(context));
