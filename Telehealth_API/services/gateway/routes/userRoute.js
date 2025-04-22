import express from "express";
import { assignStaff, listAssignedStaff } from "../controller/hospital/hospitalController";
import { listAllHospitalAdminUser } from "../controller/superadmin/hospitalController";

const userRoute = express.Router()


//Hospital Routes
userRoute.post('/hospital/assign-staff', assignStaff)
userRoute.get('/hospital/list-assigned-staff', listAssignedStaff)


//Super Admin routes
userRoute.get('/superadmin/list-all-hospital-admin-user', listAllHospitalAdminUser)

export default userRoute;