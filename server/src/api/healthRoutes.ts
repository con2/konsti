import express from "express";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getHealthStatus } from "server/features/health/healthController";
import { allowCORS } from "server/middleware/cors";
import { logApiCall } from "server/middleware/logApiCall";

// A router of its own so it can stay mounted on an instance that serves no
// client traffic, which the deployment's liveness and readiness probes need
export const healthRoutes = express.Router();

/* GET routes */

// Route-level middleware, not router-level: this router is mounted at the app
// root, so a `use` here would run for every request. CORS because the client's
// network probe fetches this cross-origin from its own dev server.
healthRoutes.get(ApiEndpoint.HEALTH, logApiCall, allowCORS, getHealthStatus);
