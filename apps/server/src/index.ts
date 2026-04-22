import { app } from "./app";

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT);

  const bunVersion = typeof Bun !== "undefined" ? Bun.version : "unknown";
  console.log(
    `🦊 Amertask API berjalan di http://localhost:${app.server?.port}`,
  );
  console.log(`   Bun v${bunVersion}`);
  console.log(`📚 Swagger docs: http://localhost:${app.server?.port}/docs`);
}

export default app;
