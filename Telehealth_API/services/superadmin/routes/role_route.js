"use strict";

import express from "express";
import { authorizeRole, verifyToken } from "../helpers/verifyToken";
import { add_role, all_role, update_role, delete_role } from "../controllers/roles/role";

const roleRoute = express.Router();

roleRoute.use(verifyToken);

roleRoute.post("/add-role", authorizeRole(['superadmin']), add_role);
roleRoute.get("/all-role", authorizeRole(['superadmin']), all_role);
roleRoute.post("/update-role", authorizeRole(['superadmin']), update_role);
roleRoute.post("/delete-role", authorizeRole(['superadmin']), delete_role);

export default roleRoute;