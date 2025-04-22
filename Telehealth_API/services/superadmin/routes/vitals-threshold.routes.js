"use strict";

import express from "express";
import { addVitalsThreshold, getVitalsThreshold, getVitalsThresholdById, updateVitalsThreshold, updateVitalsThresholdByAction } from "../controllers/superadmin/vitalsThresholdManagementController";
import { authorizeRole, verifyToken } from "../helpers/verifyToken";
const vitalsThesholdRoute = express.Router();

vitalsThesholdRoute.use(verifyToken);

vitalsThesholdRoute.post("/add-vitals-threshold", authorizeRole(['superadmin']), addVitalsThreshold);
vitalsThesholdRoute.get("/get-vitals-threshold", authorizeRole(['superadmin', 'INDIVIDUAL_DOCTOR']), getVitalsThreshold);
vitalsThesholdRoute.get("/get-vitals-threshold/:id/:vitalsType", authorizeRole(['superadmin']), getVitalsThresholdById);
vitalsThesholdRoute.put("/update-vitals-threshold", authorizeRole(['superadmin']), updateVitalsThreshold);
vitalsThesholdRoute.delete("/delete-vitals-threshold", authorizeRole(['superadmin']), updateVitalsThresholdByAction);

export default vitalsThesholdRoute;