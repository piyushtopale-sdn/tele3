"use strict";

import express from "express";
import {add_role,all_role,update_role,delete_role} from "../controllers/roles/role.js";
const roleRoute = express.Router();

roleRoute.post("/add-role", add_role);
roleRoute.get("/all-role", all_role);
roleRoute.post("/update-role", update_role);
roleRoute.post("/delete-role", delete_role);

export default roleRoute;