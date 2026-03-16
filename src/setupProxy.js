const fs = require("fs");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const DEFAULT_BACKEND_PORT = 8000;

const resolveBackendPort = () => {
  const explicitPort = Number(process.env.REACT_APP_BACKEND_PORT || process.env.BACKEND_PORT);
  if (Number.isInteger(explicitPort) && explicitPort > 0 && explicitPort <= 65535) {
    return explicitPort;
  }

  const serverEnvPath = path.resolve(__dirname, "..", "server", ".env");
  try {
    if (fs.existsSync(serverEnvPath)) {
      const content = fs.readFileSync(serverEnvPath, "utf8");
      const match = content.match(/^\s*PORT\s*=\s*([0-9]+)\s*$/m);
      if (match) {
        const envPort = Number(match[1]);
        if (Number.isInteger(envPort) && envPort > 0 && envPort <= 65535) {
          return envPort;
        }
      }
    }
  } catch {
    // fall back to default
  }

  return DEFAULT_BACKEND_PORT;
};

const backendPort = resolveBackendPort();
const target = `http://localhost:${backendPort}`;

module.exports = function setupProxy(app) {
  app.use(
    ["/api", "/uploads"],
    createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true,
      logLevel: "warn",
    })
  );
};
