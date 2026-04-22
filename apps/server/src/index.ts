import { app } from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT);

const bunVersion = typeof Bun !== "undefined" ? Bun.version : "unknown";
console.log(`🦊 Amertask API berjalan di http://localhost:${app.server?.port}`);
console.log(`   Bun v${bunVersion}`);
console.log(`📚 Swagger docs: http://localhost:${app.server?.port}/docs`);
