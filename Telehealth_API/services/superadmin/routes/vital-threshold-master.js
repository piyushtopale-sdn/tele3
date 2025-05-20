"use strict";

import express from "express";
import { addNewvitalsThreshold, getNewvitalsThreshold, getNewvitalsThresholdById, updateNewvitalsThreshold, updateNewvitalsThresholdByAction,getReferenceRangeById } from "../controllers/superadmin/vitalThresholdMaster";
import { authorizeRole, verifyToken } from "../helpers/verifyToken";
const vitalThresholdMaster = express.Router();

vitalThresholdMaster.use(verifyToken);

vitalThresholdMaster.post("/add-vitals-threshold", authorizeRole(['superadmin']), addNewvitalsThreshold);
vitalThresholdMaster.get("/get-vitals-threshold", authorizeRole(['superadmin', 'INDIVIDUAL_DOCTOR', 'patient']), getNewvitalsThreshold);
vitalThresholdMaster.get("/get-reference-range", authorizeRole(['superadmin', 'INDIVIDUAL_DOCTOR', 'INDIVIDUAL_DOCTOR_ADMIN', 'SUPER_USER']), getReferenceRangeById);
vitalThresholdMaster.get("/get-vitals-threshold/:id/:vitalsType", authorizeRole(['superadmin']), getNewvitalsThresholdById);
vitalThresholdMaster.put("/update-vitals-threshold", authorizeRole(['superadmin']), updateNewvitalsThreshold);
vitalThresholdMaster.delete("/delete-vitals-threshold", authorizeRole(['superadmin']), updateNewvitalsThresholdByAction);

export default vitalThresholdMaster;