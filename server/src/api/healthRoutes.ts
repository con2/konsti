import express from "express";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getHealthStatus } from "server/features/health/healthController";
import { logApiCall } from "server/middleware/logApiCall";

// A router of its own so it can stay mounted on an instance that serves no
// client traffic, which the deployment's liveness and readiness probes need
export const healthRoutes = express.Router();

healthRoutes.use(logApiCall);

/* GET routes */

healthRoutes.get(ApiEndpoint.HEALTH, getHealthStatus);
