"use strict";

import express from "express";
import { addNewvitalsThreshold, getNewvitalsThreshold, getNewvitalsThresholdById, updateNewvitalsThreshold, updateNewvitalsThresholdByAction,getReferenceRangeById } from "../controllers/superadmin/newvitalthresholdController";
import { authorizeRole, verifyToken } from "../helpers/verifyToken";
const newvitalsThesholdRoute = express.Router();

newvitalsThesholdRoute.use(verifyToken);

newvitalsThesholdRoute.post("/add-vitals-threshold", authorizeRole(['superadmin']), addNewvitalsThreshold);
newvitalsThesholdRoute.get("/get-vitals-threshold", authorizeRole(['superadmin', 'INDIVIDUAL_DOCTOR', 'INDIVIDUAL_DOCTOR_ADMIN']), getNewvitalsThreshold);
newvitalsThesholdRoute.get("/get-reference-range", authorizeRole(['superadmin', 'INDIVIDUAL_DOCTOR']), getReferenceRangeById);
newvitalsThesholdRoute.get("/get-vitals-threshold/:id/:vitalsType", authorizeRole(['superadmin']), getNewvitalsThresholdById);
newvitalsThesholdRoute.put("/update-vitals-threshold", authorizeRole(['superadmin']), updateNewvitalsThreshold);
newvitalsThesholdRoute.delete("/delete-vitals-threshold", authorizeRole(['superadmin']), updateNewvitalsThresholdByAction);

export default newvitalsThesholdRoute;