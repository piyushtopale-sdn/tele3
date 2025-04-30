import express from "express";
import {
    addMedicine,
    listMedicine,
    editMedicine,
    deleteMedicine,
    uploadCSVForMedicine,
    allSubscriptionPlans,
    approvePharmacyAdmin,
    createSpeciality,
    createSubscriptionPlan,
    deleteSubscriptionPlan,
    editSubscriptionPlan,
    forgotPassword,
    getPeriodicList,
    getServiceField,
    getSubscriptionPlanDetails,
    matchEmailOtpFor2fa,
    matchSmsOtpFor2fa,
    resetForgotPassword,
    sendEmailOtpFor2fa,
    sendSmsOtpFor2fa,
    specialityDelete,
    specialityList,
    specialityUpdate,
    superadminLogin,
    setMaximumRequest,
} from "../controller/superadminController";
import { addStaff, listStaff, getAllStaff, editStaff, viewStaff, deleteActiveLockStaff, listStaffForChat } from "../controller/superadmin/staffManagementController";
import { subscriptionPlanListing, allSubscriptionPlansConfig } from "../controller/subscription/subscriptionController";
const superadminRoute = express.Router()
superadminRoute.post("/login", superadminLogin)
superadminRoute.post("/send-email-otp-for-2fa", sendEmailOtpFor2fa)
superadminRoute.post("/send-sms-otp-for-2fa", sendSmsOtpFor2fa)
superadminRoute.post("/match-email-otp-for-2fa", matchEmailOtpFor2fa)
superadminRoute.post("/match-sms-otp-for-2fa", matchSmsOtpFor2fa)
superadminRoute.post("/forgot-password", forgotPassword)
superadminRoute.post("/reset-forgot-password", resetForgotPassword);

//Subscription Plan
superadminRoute.get("/get-service-field", getServiceField);
superadminRoute.post("/create-subscription-plan", createSubscriptionPlan)
superadminRoute.get("/all-subscription-plans", allSubscriptionPlans);
superadminRoute.get("/get-subscription-plan-details", getSubscriptionPlanDetails);
superadminRoute.put("/update-subscription-plan", editSubscriptionPlan)
superadminRoute.post("/delete-subscription-plan", deleteSubscriptionPlan)
superadminRoute.get("/get-periodic-list", getPeriodicList);

//speciality 
superadminRoute.post('/create', createSpeciality)
superadminRoute.get('/speciality-list', specialityList)
superadminRoute.put('/update', specialityUpdate)
superadminRoute.delete('/delete', specialityDelete)

//Subscription Routes
superadminRoute.get('/subscription/subscription-plan-listing', subscriptionPlanListing)
superadminRoute.get("/all-subscription-plans-config", allSubscriptionPlansConfig);

//pharmacy routes
superadminRoute.put("/approve-pharmacy-admin", approvePharmacyAdmin)
//Medicine
superadminRoute.post("/add-medicine", addMedicine);
superadminRoute.post("/edit-medicine", editMedicine);
superadminRoute.post("/delete-medicine", deleteMedicine);
superadminRoute.get("/list-medicine", listMedicine);
superadminRoute.post("/upload-csv-for-medicine", uploadCSVForMedicine);

// Set Maximum Request
superadminRoute.post("/set-maximum-request", setMaximumRequest);

//Staff Management
superadminRoute.post('/add-staff', addStaff)
superadminRoute.post('/edit-staff', editStaff)
superadminRoute.get('/view-staff-details', viewStaff)
superadminRoute.get("/list-staff", listStaff);
superadminRoute.get("/get-all-staff", getAllStaff)
superadminRoute.get("/get-all-staff", getAllStaff)
superadminRoute.get("/list-staff-forchat", listStaffForChat)


superadminRoute.post('/delete-active-lock-staff', deleteActiveLockStaff)




export default superadminRoute;