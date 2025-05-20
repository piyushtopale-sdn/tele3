"use strict";

import express from "express";
import { verifyRole, verifyToken } from "../helpers/verifyToken"
import { 
    addLabTestConfiguration, 
    getLabTestConfiguration, 
    editLabTestConfiguration, 
    deleteLabTestConfiguration, 
    getLabTestConfigurationById,
    getLabTest,
    getLabTestById,
    addLabTest,
    editLabTest,
    deleteLabTest,
    allLabTestforexport,
    allLabTestConfigforexport,
    getRadioTest,
    getRadioTestById,
    addRadioTest,
    editRadioTest,
    deleteRadioTest,
    allRadioTestforexport,
    uploadLabSubTest,
    bulkImportLabMainTest,
    getRadioTestexp,
    getLabTestExport,
    bulkImportRadioTests,
    getLabTestConfigurationExport
} from "../controllers/lab_test_configuration.controller";
import { handleResponse } from "../middleware/utils";
import fs from "fs";
const labRadioManagementRoute = express.Router();
labRadioManagementRoute.use(verifyToken);

const uploadFileToLocalStorage = async (req, res, next) => {
 
    if (!req.files) {
      return handleResponse(req, res, 500, {
        status: false,
        body: null,
        message: "No files found",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
    const file = req.files.file;
    if (
      file.mimetype !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return handleResponse(req, res, 500, {
        status: false,
        body: null,
        message: "Only excel allowed!",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  
    const filename = file.name.split(".")[0] + "-" + Date.now() + ".xlsx";
    req.filename = filename;
    const newPath = `${__dirname.replace("routes", "uploads")}/${filename}`;
    fs.writeFile(newPath, file.data, (err) => {
      if (err) {
        return handleResponse(req, res, 500, {
          status: false,
          body: err,
          message: "Something went wrong while uploading file",
          errorCode: "INTERNAL_SERVER_ERROR",
        });
      }
      next();
    });
};

// Lab Test Configuration for superadmin
labRadioManagementRoute.get("/get-lab-test-configuration-list", verifyRole(['superadmin', 'INDIVIDUAL', 'ADMIN', 'SUPER_USER']), getLabTestConfiguration);
labRadioManagementRoute.get("/get-lab-test-configuration-list-export", verifyRole(['superadmin', 'INDIVIDUAL', 'ADMIN', 'SUPER_USER']), getLabTestConfigurationExport);
labRadioManagementRoute.get("/get-lab-test-configuration-by-id/:id", verifyRole(['superadmin', 'INDIVIDUAL', 'ADMIN', 'SUPER_USER']), getLabTestConfigurationById);
labRadioManagementRoute.post("/add-lab-test-configuration", verifyRole(['superadmin']), addLabTestConfiguration);
labRadioManagementRoute.put("/edit-lab-test-configuration", verifyRole(['superadmin']), editLabTestConfiguration);
labRadioManagementRoute.delete("/delete-lab-test-configuration/:id", verifyRole(['superadmin']), deleteLabTestConfiguration);
labRadioManagementRoute.get('/exportsheetlist-labTestConfig', verifyRole(['superadmin', 'INDIVIDUAL', 'ADMIN', 'SUPER_USER']), allLabTestConfigforexport)

// Lab Test for superadmin
labRadioManagementRoute.get("/get-lab-test-list", verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR', 'INDIVIDUAL', 'ADMIN', "patient", 'SUPER_USER']), getLabTest);
labRadioManagementRoute.get("/get-lab-test-by-id/:id", verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR', 'INDIVIDUAL', 'ADMIN', 'SUPER_USER']), getLabTestById);
labRadioManagementRoute.post("/add-lab-test", verifyRole(['superadmin']), addLabTest);
labRadioManagementRoute.put("/edit-lab-test", verifyRole(['superadmin']), editLabTest);
labRadioManagementRoute.delete("/delete-lab-test/:id", verifyRole(['superadmin']), deleteLabTest);
labRadioManagementRoute.get('/exportsheetlist-labTest', verifyRole(['superadmin', 'INDIVIDUAL', 'ADMIN', 'SUPER_USER']), allLabTestforexport)
labRadioManagementRoute.get('/exportsheetlistExport-labTest', verifyRole(['superadmin', 'INDIVIDUAL', 'ADMIN', 'SUPER_USER']), getLabTestExport)

// Radio Test for superadmin
labRadioManagementRoute.get("/get-radiology-test-list", verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR', 'INDIVIDUAL', 'ADMIN',"patient", 'SUPER_USER']), getRadioTest);
labRadioManagementRoute.get("/get-radiology-test-by-id/:id", verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR', 'INDIVIDUAL', 'ADMIN', 'SUPER_USER']), getRadioTestById);
labRadioManagementRoute.post("/add-radiology-test", verifyRole(['superadmin']), addRadioTest);
labRadioManagementRoute.put("/edit-radiology-test", verifyRole(['superadmin']), editRadioTest);
labRadioManagementRoute.delete("/delete-radiology-test/:id", verifyRole(['superadmin']), deleteRadioTest);
labRadioManagementRoute.get('/exportsheetlist-radioTest', verifyRole(['superadmin', 'INDIVIDUAL', 'ADMIN', 'SUPER_USER']), allRadioTestforexport)
labRadioManagementRoute.get('/exportsheetlistExport-radioTest', verifyRole(['superadmin', 'INDIVIDUAL', 'ADMIN', 'SUPER_USER']), getRadioTestexp)

//Import sub tests for lab
labRadioManagementRoute.post('/upload-labSub-test', verifyRole(['superadmin']), uploadFileToLocalStorage, uploadLabSubTest)
labRadioManagementRoute.post('/upload-labMain-test', verifyRole(['superadmin']), uploadFileToLocalStorage, bulkImportLabMainTest)
labRadioManagementRoute.post('/upload-radio-tests', verifyRole(['superadmin']), uploadFileToLocalStorage, bulkImportRadioTests)


export default labRadioManagementRoute;