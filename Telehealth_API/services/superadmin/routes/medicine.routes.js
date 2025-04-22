"use strict";

import express from "express";
import { addMedicine, listMedicine, getMedicineById, editMedicine, updateMedicineByAction, allMedicineListforexport } from "../controllers/superadmin/medicineController";
import { authorizeRole, verifyToken } from "../helpers/verifyToken";
const medicineRoute = express.Router();

medicineRoute.use(verifyToken);

medicineRoute.post("/add-medicine", authorizeRole(['superadmin']), addMedicine);
medicineRoute.get("/get-medicine", authorizeRole(['superadmin', 'INDIVIDUAL_DOCTOR']), listMedicine);
medicineRoute.get("/get-medicine-by-id/:id", authorizeRole(['superadmin', 'INDIVIDUAL_DOCTOR']), getMedicineById);
medicineRoute.put("/update-medicine", authorizeRole(['superadmin']), editMedicine);
medicineRoute.put("/delete-active-inactive-medicine", authorizeRole(['superadmin']), updateMedicineByAction);
medicineRoute.get('/exportsheetlist-medicine', authorizeRole(['superadmin']), allMedicineListforexport)

export default medicineRoute;