import { createApp } from "./app/app-shell.js";

const app = createApp();

void app.start().catch((error) => {
  console.error("Application startup failed:", error);
});
