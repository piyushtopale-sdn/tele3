"use strict";

import express from "express";
import { addCategory, getCategory, updateCategory, updateCategoryByAction, allCategoryforexport } from "../controllers/superadmin/categoryManagementController";
import { authorizeRole, verifyToken } from "../helpers/verifyToken";
const categoryRoute = express.Router();

categoryRoute.use(verifyToken);

categoryRoute.post("/add-category", authorizeRole(['superadmin']), addCategory);
categoryRoute.get("/get-category", getCategory);
categoryRoute.put("/update-category", authorizeRole(['superadmin']), updateCategory);
categoryRoute.put("/delete-active-inactive-category", authorizeRole(['superadmin']), updateCategoryByAction);
categoryRoute.get('/exportsheetlist-category', authorizeRole(['superadmin']), allCategoryforexport)

export default categoryRoute;