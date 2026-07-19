// Must run before any other import reads process.env.
import "dotenv/config";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { startScheduler } from "./scheduler";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: false,
  limit: '50mb'
}));

// Import and register domain routing middleware BEFORE all other routes

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler - must be last
  const { errorHandler } = await import("./middleware/errorHandler");
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  // Use BUILD_MODE to control whether to serve built files or use Vite dev server
  // This allows NODE_ENV to be set to 'production' for other purposes (like PayFast)
  // Serve the built client in production, Vite's dev middleware otherwise.
  // BUILD_MODE can still force either mode, but NODE_ENV is the default signal
  // so that `npm start` serves the real build without extra configuration.
  const buildMode = process.env.BUILD_MODE
    || (process.env.NODE_ENV === 'production' ? 'production' : 'development');

  if (buildMode === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  // Bind 0.0.0.0 so the app is reachable inside Docker / behind a proxy.
  // reusePort is deliberately not set: it is unsupported on Windows and on
  // some Linux kernels, and throws ENOTSUP at boot there.
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);

    // Automated follow-ups (quote chasers, appointment and deposit reminders,
    // overdue-invoice notices) and the outbound email queue. Runs in-process
    // so a single container needs no external cron; ENABLE_SCHEDULER=false
    // turns it off, e.g. when running more than one instance.
    startScheduler();
  });
})();