"use strict";

import express from "express";
const roleController = require("../controllers/roles/role");
const roleRoute = express.Router();

roleRoute.post("/add-role", roleController.add_role);
roleRoute.get("/all-role", roleController.all_role);
roleRoute.post("/update-role", roleController.update_role);
roleRoute.post("/delete-role", roleController.delete_role);

export default roleRoute;