#!/usr/bin/env node
import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const previewPort = process.env.PREVIEW_PORT ?? "5174";
const apiPort = process.env.PORT ?? "4110";

const processes = [
  spawn(npmCommand, ["run", "dev:api"], {
    stdio: "inherit",
    env: { ...process.env, PORT: apiPort, NODE_ENV: process.env.NODE_ENV ?? "production" }
  }),
  spawn(npmCommand, ["run", "preview", "--", "--port", previewPort, "--host", "0.0.0.0"], {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV ?? "production" }
  })
];

function shutdown() {
  for (const child of processes) {
    if (!child.killed) child.kill("SIGTERM");
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

for (const child of processes) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      shutdown();
      process.exit(code);
    }
  });
}
