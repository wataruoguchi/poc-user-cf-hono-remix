import app from "./hono";

console.log("Yo! This is the development server.");
await import("../tests/mocks/index.ts");

export default app;
