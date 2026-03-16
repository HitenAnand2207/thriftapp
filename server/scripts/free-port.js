#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const DEFAULT_PORT = 8000;
const rawPort = process.argv[2];

const getPortFromServerEnv = () => {
  try {
    const envPath = path.resolve(__dirname, "..", ".env");
    if (!fs.existsSync(envPath)) return null;
    const content = fs.readFileSync(envPath, "utf8");
    const match = content.match(/^\s*PORT\s*=\s*([0-9]+)\s*$/m);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
};

const portFromCli = rawPort ? Number(rawPort) : null;
const portFromEnv = process.env.PORT ? Number(process.env.PORT) : null;
const portFromServerEnv = getPortFromServerEnv();
const port = portFromCli || portFromEnv || portFromServerEnv || DEFAULT_PORT;

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error(`❌ Invalid port: ${rawPort}`);
  process.exit(1);
}

const getPidsWindows = (targetPort) => {
  try {
    const output = execSync("netstat -ano -p tcp", { encoding: "utf8" });
    return Array.from(
      new Set(
        output
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line && /LISTENING/i.test(line))
          .filter((line) => line.includes(`:${targetPort}`))
          .map((line) => line.split(/\s+/).pop())
          .map((pid) => Number(pid))
          .filter((pid) => Number.isInteger(pid) && pid > 0)
      )
    );
  } catch {
    return [];
  }
};

const getPidsUnix = (targetPort) => {
  try {
    const output = execSync(`lsof -ti tcp:${targetPort} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return Array.from(
      new Set(
        output
          .split(/\r?\n/)
          .map((s) => Number(s.trim()))
          .filter((pid) => Number.isInteger(pid) && pid > 0)
      )
    );
  } catch {
    return [];
  }
};

const getListeningPids = (targetPort) =>
  process.platform === "win32" ? getPidsWindows(targetPort) : getPidsUnix(targetPort);

const killPid = (pid) => {
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    return;
  }

  // Give process a moment to exit cleanly, then force if needed.
  setTimeout(() => {
    try {
      process.kill(pid, 0);
      process.kill(pid, "SIGKILL");
    } catch {
      // already exited
    }
  }, 400);
};

const pids = getListeningPids(port);

if (pids.length === 0) {
  console.log(`✅ Port ${port} is free`);
  process.exit(0);
}

console.log(`⚠️ Port ${port} is in use by PID(s): ${pids.join(", ")}. Releasing...`);
pids.forEach(killPid);

setTimeout(() => {
  const remaining = getListeningPids(port);
  if (remaining.length > 0) {
    console.error(`❌ Could not free port ${port}. Still in use by PID(s): ${remaining.join(", ")}`);
    process.exit(1);
  }
  console.log(`✅ Port ${port} released`);
  process.exit(0);
}, 900);
