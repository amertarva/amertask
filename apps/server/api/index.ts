import { app } from "../src/app";

// Vercel Bun Runtime memanggil handler ini dengan Web Standard Request
// ElysiaJS .handle() mengembalikan Web Standard Response — langsung compatible
export default app.handle;
