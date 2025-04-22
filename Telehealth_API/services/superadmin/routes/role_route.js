"use strict";

import express from "express";
import { authorizeRole, verifyToken } from "../helpers/verifyToken";
const roleController = require("../controllers/roles/role");
const roleRoute = express.Router();

roleRoute.use(verifyToken);

roleRoute.post("/add-role", authorizeRole(['superadmin']), roleController.add_role);
roleRoute.get("/all-role", authorizeRole(['superadmin']), roleController.all_role);
roleRoute.post("/update-role", authorizeRole(['superadmin']), roleController.update_role);
roleRoute.post("/delete-role", authorizeRole(['superadmin']), roleController.delete_role);

export default roleRoute;