import { app } from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT);

console.log(`🦊 Amertask API berjalan di http://localhost:${app.server?.port}`);
console.log(`   Bun v${Bun.version}`);
console.log(`📚 Swagger docs: http://localhost:${app.server?.port}/docs`);
