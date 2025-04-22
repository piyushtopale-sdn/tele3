"use strict";

import express from "express";
import { addAlphaResult, getAlphaResult, updateAlphaResult, updateAlphaResultByAction, allAlphaResultforexport } from "../controllers/superadmin/alphaResultManagementController";
import { authorizeRole, verifyToken } from "../helpers/verifyToken";
const alphaResultRoute = express.Router();

alphaResultRoute.use(verifyToken);

alphaResultRoute.post("/add-alpha-result", authorizeRole(['superadmin']), addAlphaResult);
alphaResultRoute.get("/get-alpha-result", authorizeRole(['superadmin', 'INDIVIDUAL', 'ADMIN']), getAlphaResult);
alphaResultRoute.put("/update-alpha-result", authorizeRole(['superadmin']), updateAlphaResult);
alphaResultRoute.put("/delete-active-inactive-alpha-result", authorizeRole(['superadmin']), updateAlphaResultByAction);
alphaResultRoute.get('/exportsheetlist-alphaResult', authorizeRole(['superadmin']), allAlphaResultforexport)

export default alphaResultRoute;