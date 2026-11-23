import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const environmentFile = ["../.env.development", "../.env.production"]
  .map((fileName) => path.resolve(import.meta.dirname, fileName))
  .find((filePath) => fs.existsSync(filePath));

if (environmentFile) {
  dotenv.config({ path: [environmentFile, "../.env"], quiet: true });
}

const backendTarget = resolveBackendTarget();
console.log(`Target Backend: ${backendTarget}`);

function resolveBackendTarget() {
  let hostAddress = process.env.HTTP_ADDRESS || "localhost:8080";
  if (hostAddress.startsWith(":")) {
    hostAddress = "localhost" + hostAddress;
  }

  if (process.env.USE_SSL !== "TRUE") {
    return `http://${hostAddress}`;
  }

  const [host] = hostAddress.split(":");
  return `https://${host}:443`;
}

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    tailwindcss(),
  ],
  server: {
    host: new URL(backendTarget).hostname,
    open: true,
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,

        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            if (req.url !== "/api/status") {
              console.log(`${req.method} ${req.url} (origin: ${req.headers.origin})`);
            }

            // Server-sent events must reach the browser unbuffered.
            if (req.headers.accept === "text/event-stream") {
              proxyReq.setHeader("Connection", "keep-alive");
              proxyReq.setHeader("Cache-Control", "no-cache");
              proxyReq.setHeader("X-Accel-Buffering", "no");
            }
          });
        },
      },
    },
  },
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "node";
          }
          if (id.includes("src/components")) {
            return "components";
          }
        },
      },
    },
  },
  envDir: "../",
  // For backwards compatibility
  envPrefix: ["REACT_", "VITE_"],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
