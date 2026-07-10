#!/usr/bin/env node
import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const apiPort = process.env.PORT ?? "4110";

const child = spawn(npmCommand, ["run", "dev:api"], {
  stdio: "inherit",
  env: { ...process.env, PORT: apiPort, NODE_ENV: process.env.NODE_ENV ?? "production" }
});

function shutdown() {
  if (!child.killed) child.kill("SIGTERM");
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

child.on("exit", (code) => {
  if (code && code !== 0) process.exit(code);
});
