"use strict";

// models
import PortalUser from "../models/portal_user";
import OrderDetail from "../models/order/order_detail";
import AdminInfo from "../models/admin_info";
import MedicineDetail from "../models/order/medicine_detail";
import MedicineBill from "../models/order/medicine_bill";
const Http = require('../helpers/httpservice');
import StaffInfo from "../models/staff_info";
import mongoose from "mongoose";

// utils
import { sendResponse } from "../helpers/transmission";
import { generateSequenceNumber } from "../middleware/utils";
import { notification, sendNotification } from "../helpers/notification";
import moment from "moment";

const httpService = new Http()
const getAllDoctor = (paginatedResults, headers) => {
    return new Promise(async (resolve, reject) => {
      const doctorIdsArray = paginatedResults.map(val => val.doctorId)
      let doctorDetails = {}
      if (doctorIdsArray.length > 0) {
        const getDetails = await httpService.postStaging(
          "individual-doctor/get-patient-doctors",
          {
            doctorIds: doctorIdsArray,
          },
          headers,
          "doctorServiceUrl"
        );
        if (getDetails?.status) {
          for (const doctor of getDetails?.body?.results) {
            doctorDetails[doctor?.for_portal_user?._id] = doctor
          }
        }
      }
      resolve(doctorDetails)
    })
  }
    const getAllPatient = (paginatedResults) => {
        return new Promise(async (resolve, reject) => {
        const patientIdsArray = paginatedResults.map(val => val.patientId)
            let patientDetails = {}
            if (patientIdsArray.length > 0) {
            const getDetails = await httpService.postStaging(
                "patient/get-patient-details-by-id",
                { ids: patientIdsArray },
                {},
                "patientServiceUrl"
            );
        
            if (getDetails?.status) {
                patientDetails = getDetails?.data
            }
            }
        resolve(patientDetails)
        })
    }
class OrderController {
    async newOrder(req, res) {
        const headers = {
            'Authorization': req.headers['authorization']
        }
        try {
            const {
                medicineData,
                patientId,
                appointmentId,
                doctorId,
                orderFor,
                parentPatientId,
                pharmacyId,
                deliveryType,
                eprescriptionId
            } = req.body;

            // Save all data into medicine_details collection
            const ids = medicineData.map(val => val.medicineDosageId);
            const getData = await httpService.getStaging('patient-clinical-info/get-all-medicine-dosage-by-ids', { ids }, headers, 'doctorServiceUrl');
            let getAllDosageData = {}
            if (getData?.status) {
                getAllDosageData = getData?.body
            }
            const medicineDetailIds = []
            for (const ele of medicineData) {
                const addObject = {
                    medicineName: ele.medicineName,
                    medicineId: ele.medicineId,
                    medicineDosageId: ele.medicineDosageId,
                    quantityData: {
                        prescribed: ele.medicineDosageId in getAllDosageData ? getAllDosageData[ele.medicineDosageId]?.quantity : 0,
                        delivered: ele.medicineDosageId in getAllDosageData ? getAllDosageData[ele.medicineDosageId]?.quantity : 0
                    }
                }
                const saveData = new MedicineDetail(addObject)
                const result = await saveData.save()
                medicineDetailIds.push(result?._id)
            }
            //save order details
            const addObject = {
                orderId: await generateSequenceNumber(),
                medicineDetailIds,
                orderFor,
                parentPatientId,
                patientId,
                appointmentId,
                doctorId,
                deliveryType,
                forPortalUser: pharmacyId
            }
            const saveData = new OrderDetail(addObject)
            await saveData.save()
            //Update prescribed lab and radiology status
            await httpService.putStaging(
                "patient-clinical-info/update-epresciption-status",
                { id: eprescriptionId, status: 'ORDERED' },
                headers,
                "doctorServiceUrl"
            );

            let paramsData = {
                sendTo: 'pharmacy',
                madeBy: 'patient',
                patientId,
                doctorId,
                pharmacyId,
                appointment: {
                  _id: appointmentId
                },
                condition: 'ORDER_MEDICINE',
                notification: ['sms', 'email']
            }
      
            sendNotification(paramsData, headers)

            sendResponse(req, res, 200, {
                status: true,
                data: null,
                message: "successfully ordered medicine",
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to order medicine",
                errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async listOrder(req, res) {
        try {
            const headers = {
                'Authorization': req.headers['authorization']
            }
            const {
                page,
                limit,
                status,
                patientId,
                appointmentId,
                fromDate,
                toDate,
                doctorId,
                pharmacyId,
            } = req.body;

            let patientId_filter = {}
            if (patientId) {
                patientId_filter['patientId'] = mongoose.Types.ObjectId(patientId)
            }
            let appointmentId_filter = {}
            if (appointmentId) {
                appointmentId_filter['appointmentId'] = mongoose.Types.ObjectId(appointmentId)
            }
            let doctorId_filter = {}
            if (doctorId) {
                doctorId_filter['doctorId'] = mongoose.Types.ObjectId(doctorId)
            }
            let pharmacyId_filter = {}
            if (pharmacyId) {
                pharmacyId_filter['forPortalUser'] = mongoose.Types.ObjectId(pharmacyId)
            }
            let status_filter = ["new", "accepted", "scheduled", "completed", "cancelled"]
            if (status && !(status.includes('all') || status.includes('') || status == 'all')) {
                status_filter = status
            }
            let date_filter = {}
            if(fromDate && toDate) {
                const fromDateObj = new Date(`${fromDate} 00:00:00`);
                const toDateObj = new Date(`${toDate} 23:59:59`);
                date_filter = {
                  createdAt: { $gte: fromDateObj, $lte: toDateObj }
                }
            }
            const aggregateQuery = [
                {
                    $lookup: {
                        from: "medicinedetails",
                        localField: "medicineDetailIds",
                        foreignField: "_id",
                        as: "medicineDetailIds",
                    }
                },
                { 
                    $unwind: {
                        path: "$medicineDetailIds",
                        preserveNullAndEmptyArrays: true,
                    }
                },
                {
                    $addFields: {
                        medicineDosageId: "$medicineDetailIds.medicineDosageId",
                        quantityData: "$medicineDetailIds.quantityData",
                    }
                },
                {
                    $lookup: {
                        from: "portalusers",
                        localField: "forPortalUser",
                        foreignField: "_id",
                        as: "pharmacyDetails",
                    }
                },
                { 
                    $unwind: {
                        path: "$pharmacyDetails",
                        preserveNullAndEmptyArrays: true,
                    }
                },
                {
                    $addFields: {
                        pharmacy_name: "$pharmacyDetails.pharmacy_name",
                    }
                },
                {
                    $match: {
                        status: {$in: status_filter},
                        $and: [
                            patientId_filter,
                            appointmentId_filter,
                            doctorId_filter,
                            pharmacyId_filter,
                            date_filter
                        ]
                    } 
                },
                {
                    $group: {
                        _id: "$_id",
                        orderId: {$first: "$orderId"},
                        pharmacy_name: {$first: "$pharmacy_name"},
                        deliveryType: {$first: "$deliveryType"},
                        appointmentId: {$first: "$appointmentId"},
                        doctorId: {$first: "$doctorId"},
                        patientId: {$first: "$patientId"},
                        status: {$first: "$status"},
                        medicineDosageId: {$push: "$medicineDosageId"},
                        quantityData: {$first: "$quantityData"},
                        createdAt: {$first: "$createdAt"},
                    }
                },
                { $sort: {
                    createdAt: -1
                } },
                {
                    $facet: {
                        totalCount: [
                            {$count: 'count'}
                        ],
                        paginatedResults: limit != 0 ? [
                            { $skip: (page - 1) * limit }, 
                            { $limit: limit * 1 },
                        ] :
                        [
                            { $skip: 0 }, 
                        ]
                    }
                }
            ]
            const result = await OrderDetail.aggregate(aggregateQuery).exec();

            const paginatedResults = result[0].paginatedResults
            const patientDetails = getAllPatient(paginatedResults)
            const doctorDetails = getAllDoctor(paginatedResults, headers)
            const promisesResult = await Promise.all([patientDetails,doctorDetails])
            let dasageIdsArray = []
            for (const ele of paginatedResults) {
                dasageIdsArray = [...dasageIdsArray, ...ele.medicineDosageId]
            }
            let getAllDosageData = {}
            if (dasageIdsArray.length > 0) {
                const getData = await httpService.getStaging('patient-clinical-info/get-all-medicine-dosage-by-ids', { ids: dasageIdsArray }, headers, 'doctorServiceUrl');
                if (getData?.status) {
                    getAllDosageData = getData?.body
                }
            }
            for (let index = 0; index < paginatedResults.length; index++) {
                paginatedResults[index].patientName = promisesResult[0][paginatedResults[index].patientId.toString()]?.full_name
                paginatedResults[index].patientProfile = promisesResult[0][paginatedResults[index].patientId.toString()]?.profile_pic
                paginatedResults[index].doctorName = promisesResult[1][paginatedResults[index].doctorId.toString()]?.full_name
                paginatedResults[index].doctorNameArabic = promisesResult[1][paginatedResults[index].doctorId.toString()]?.full_name_arabic
                paginatedResults[index].doctorProfile = promisesResult[1][paginatedResults[index].doctorId.toString()]?.profilePicture
                // Get medicine dosage data
                let dosageData = []
                for (const ele of paginatedResults[index]?.medicineDosageId) {
                    dosageData.push(getAllDosageData[ele])
                }
                paginatedResults[index].dosageData = dosageData
                delete paginatedResults[index]?.medicineDosageId
                // send patient details when returning medicine data for appointment
                if (appointmentId) {
                    paginatedResults[index].patientDetails = patientDetails[paginatedResults[index].patientId.toString()]
                }
            }
            let totalCount = 0
            if (result[0].totalCount.length > 0) {
              totalCount = result[0].totalCount[0].count
            }
      
            sendResponse(req, res, 200, {
                status: true,
                data: {
                    totalRecords: totalCount,
                    currentPage: page,
                    totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
                    data: result[0]?.paginatedResults,
                },
                message: "successfully fetched order list",
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to fetch order list",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async getOrderById(req, res) {
        try {
            const headers = {
                'Authorization': req.headers['authorization']
            }
            const id = req.params.id
            let getOrder = await OrderDetail.findById(id)
                                            .populate({path: 'medicineDetailIds'}).lean()
            if (!getOrder) {
                return sendResponse(req, res, 200, {
                    status: false,
                    data: null,
                    message: "No record found",
                    errorCode: null,
                });
            }

            let doctorDetails = {}
            if (getOrder?.doctorId) {
              const getDetails = await httpService.postStaging(
                "individual-doctor/get-patient-doctors",
                {
                  doctorIds: [getOrder?.doctorId],
                },
                headers,
                "doctorServiceUrl"
              );
              if (getDetails?.status) {
                for (const doctor of getDetails?.body?.results) {
                  doctorDetails[doctor?.for_portal_user?._id] = doctor
                }
              }
            }
            let patientDetails = {}
            if (getOrder?.patientId) {
              const getDetails = await httpService.postStaging(
                "patient/get-patient-details-by-id",
                { ids: [getOrder?.patientId] },
                {},
                "patientServiceUrl"
              );
        
              if (getDetails?.status) {
                patientDetails = getDetails?.data
              }
            }
            let dasageIdsArray = []
            for (const ele of getOrder?.medicineDetailIds) {
                dasageIdsArray.push(ele.medicineDosageId)
            }
            const getData = await httpService.getStaging('patient-clinical-info/get-all-medicine-dosage-by-ids', { ids: dasageIdsArray }, headers, 'doctorServiceUrl');
            let getAllDosageData = {}
            if (getData?.status) {
                getAllDosageData = getData?.body
            }
            
            getOrder.patientName = patientDetails[getOrder.patientId.toString()]?.full_name
            getOrder.patientProfile = patientDetails[getOrder.patientId.toString()]?.profile_pic
            getOrder.doctorName = doctorDetails[getOrder.doctorId.toString()]?.full_name
            getOrder.doctorNameArabic = doctorDetails[getOrder.doctorId.toString()]?.full_name_arabic
            getOrder.doctorProfile = doctorDetails[getOrder.doctorId.toString()]?.profilePicture
            // Get medicine dosage data
            let dosageData = []
            for (const ele of dasageIdsArray) {
                dosageData.push(getAllDosageData[ele])
            }
            getOrder.dosageData = dosageData
            delete getOrder?.medicineDosageId
            // send patient details when returning medicine data for appointment
            getOrder.patientDetails = patientDetails[getOrder.patientId.toString()]
            sendResponse(req, res, 200, {
                status: true,
                data: getOrder,
                message: "successfully fetched order data",
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to fetch order",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async totalOrderCount(req, res) {
        try {
            const {
                portal,
                for_portal_user,
                patient_id,
                request_type
            } = req.query;
            const searchQuery = {
                $and: [
                    portal == "pharmacy" ? { for_portal_user: new mongoose.Types.ObjectId(for_portal_user) } : { "patient_details.user_id": new mongoose.Types.ObjectId(patient_id) },
                    { request_type: { $regex: request_type, $options: "i" } },
                ]
            }

            const result = await OrderDetail.aggregate([
                { $match: searchQuery },
                { $project: { status: 1, count: 1 } }
            ]).exec();
           
            let newCount = 0
            let acceptedCount = 0
            let scheduledCount = 0
            let completedCount = 0
            let cancelledCount = 0
            let rejectedCount = 0

            for (const data of result) {
                if (data.status === 'new') newCount += 1
                if (data.status === 'accepted') acceptedCount += 1
                if (data.status === 'scheduled') scheduledCount += 1
                if (data.status === 'completed') completedCount += 1
                if (data.status === 'cancelled') cancelledCount += 1
                if (data.status === 'rejected') rejectedCount += 1
            }
            const countResult = [
                {
                    _id: 'new',
                    count: newCount
                },
                {
                    _id: 'accepted',
                    count: acceptedCount
                },
                {
                    _id: 'scheduled',
                    count: scheduledCount
                },
                {
                    _id: 'completed',
                    count: completedCount
                },
                {
                    _id: 'cancelled',
                    count: cancelledCount
                },
                {
                    _id: 'rejected',
                    count: rejectedCount
                }
            ]
            sendResponse(req, res, 200, {
                status: true,
                data: countResult,
                message: "successfully fetched order count",
                errorCode: null,
            });
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to fetch order count",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async fetchOrderDetails(req, res) {
        try {
            const {
                for_order_id,
                for_portal_user
            } = req.body;
            const headers = {
                'Authorization': req.headers['authorization']
            }
            const orderData = await OrderDetail.findOne({ _id: for_order_id, for_portal_user }).lean();
            const patientId = orderData.patient_details.user_id

            const patientDetails = await httpService.getStaging('patient/patient-common-details', { patientId: patientId }, headers, 'patientServiceUrl');
            const pharmacyDetails = await AdminInfo.findOne({ for_portal_user }, { pharmacy_name: 1, address: 1, mobile_phone_number: 1, profile_picture: 1 })
                .populate({
                    path: "for_portal_user",
                    // select: ("email")
                    select: "email phone_number"
                })
            let pharmacyProfile
            if (pharmacyDetails.profile_picture != "" && pharmacyDetails.profile_picture != undefined) {
                const headers = {
                    Authorization: req.headers["authorization"],
                };
                const profilePictureArray = [pharmacyDetails.profile_picture];
                const profile_picdata = await httpService.postStaging(
                    "pharmacy/get-signed-url",
                    { url: profilePictureArray },
                    headers,
                    "pharmacyServiceUrl"
                );
                pharmacyProfile = profile_picdata.data[0]
                pharmacyDetails.profile_picture = profile_picdata;
            }

            const medicineDetails = await MedicineDetail.find({ for_order_id, for_portal_user }).lean();
            const medicineIDArray = []
            let getMedicines = {
                body: null
            }
            if (medicineDetails.length > 0) {
                for (const medicine of medicineDetails) {
                    medicineIDArray.push(medicine.medicine_id)
                }
                getMedicines = await httpService.postStaging('superadmin/get-all-medicine-byits-id', { medicineIds: medicineIDArray }, headers, 'superadminServiceUrl');
            }

            const medicineBill = await MedicineBill.findOne({ for_order_id, for_portal_user }).lean();
            medicineBill.prescription_url = prescriptionUrlArray
            sendResponse(req, res, 200, {
                status: true,
                data: {
                    orderData,
                    medicineDetails,
                    medicineBill,
                    medicineNameObject: getMedicines.body,
                    patientDetails: patientDetails.body,
                    pharmacyDetails,
                    pharmacyProfile
                },
                message: "successfully fetched order details",
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to fetch order details",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }
    // 
    async updateOrderDetails(req, res) {
        try {
            const {
                medicine_details,
                medicine_bill: { total_medicine_cost },
                for_portal_user,
                for_order_id,
                in_medicine_bill,
                request_type,
                status,
                name,
                total_cost,
                price_per_unit,
                medicine_id,

                // service
            } = req.body;
            const headers = {
                'Authorization': req.headers['authorization']
            }
            if (status == "completed") {
                const orderDataResult = await OrderDetail.updateOne({ _id: for_order_id }, {
                    $set: {
                        status,
                        // service
                    }
                }, { new: true, upsert: false }).exec();
                // For Notification
                const orderData = await OrderDetail.find({ _id: for_order_id })
                
                let message = `Prescription Price Received`
                let requestData = {
                    created_by_type: "pharmacy",
                    created_by: for_portal_user,
                    content: message,
                    url: '',
                    for_portal_user: orderData[0]?.patient_details?.user_id,
                    notitype: "Amount Send",
                    appointmentId: for_order_id,
                    title: "Sent Amount"
                }

                let result = await notification("patientServiceUrl", headers, requestData)
                
                sendResponse(req, res, 200, {
                    status: true,
                    data: orderDataResult,
                    message: "successfully updated medicine list",
                    errorCode: null,
                });
            }
            else {
                const medicineBillResult = await MedicineBill.updateOne({ for_portal_user, for_order_id }, {
                    $set: {
                        total_medicine_cost,
                    }
                }, { new: true, upsert: false }).exec();
                const orderDataResult = await OrderDetail.updateOne({ _id: for_order_id }, {
                    $set: {
                        request_type,
                        status,
                        // service
                    }
                }, { new: true, upsert: false }).exec();
                await MedicineDetail.deleteMany({ for_portal_user, for_order_id }, { new: true }).exec();
                const medicineDetailRecord = medicine_details.map((record) => (
                    {
                        ...record,
                        in_medicine_bill,
                        for_order_id,
                        for_portal_user
                    }
                ))
                const medicineDetailResult = await MedicineDetail.insertMany(medicineDetailRecord);

                // For Notification
                const orderData = await OrderDetail.find({ _id: for_order_id })
                
                let message = `Prescription Price Received`
                let requestData = {
                    created_by_type: "pharmacy",
                    created_by: for_portal_user,
                    content: message,
                    url: '',
                    for_portal_user: orderData[0]?.patient_details?.user_id,
                    notitype: "Amount Send",
                    appointmentId: for_order_id,
                    title: "Sent Amount"
                }

                let result = await notification("patientServiceUrl", headers, requestData)
                
                sendResponse(req, res, 200, {
                    status: true,
                    data: {
                        medicineBillResult,
                        medicineDetailResult,
                        orderDataResult
                    },
                    message: "successfully updated medicine list",
                    errorCode: null,
                });
            }

        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to update medicine list",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }
  
    async cancelAndApproveOrder(req, res) {
        const headers = {
            'Authorization': req.headers['authorization']
        }
        try {
            const {
                orderId,
                cancelReason,
                status,
            } = req.body;

            const getOrder = await OrderDetail.findById(orderId);
            if (!getOrder) {
                sendResponse(req, res, 200, {
                    status: false,
                    data: null,
                    message: `Order not found`,
                    errorCode: null,
                });
            }

            let updateObject = {
                status,
                cancelledOrAcceptedBy: req?.user?.portalUserId
            }
            if (status == 'cancelled') {
                updateObject['cancelReason'] = cancelReason
                updateObject['cancelledBy'] = req.user.role
            }
        
            await OrderDetail.findOneAndUpdate(
                { _id: { $eq: orderId } },
                {
                  $set: updateObject,
                },
                { new: true }
            ).exec();

            let paramsData = {
                sendTo: 'patient',
                madeBy: 'pharmacy',
                patientId: getOrder?.patientId,
                doctorId: getOrder?.doctorId,
                pharmacyId: getOrder?.forPortalUser,
                appointment: {
                  _id: getOrder?.appointmentId
                },
                condition: status == 'cancelled' ? 'REJECTED_MEDICINE_ORDER' : 'ACCEPTED_MEDICINE_ORDER',
                notification: ['push_notification', 'sms', 'email']
            }
      
            sendNotification(paramsData, headers)

            sendResponse(req, res, 200, {
                status: true,
                data: null,
                message: `Order ${status} successfully`,
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to update order status",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async updateDeliveryStatus(req, res) {
        const headers = {
            'Authorization': req.headers['authorization']
        }
        try {
            const {
                orderId,
                status,
            } = req.body;

            const getOrder = await OrderDetail.findById(orderId);
            if (!getOrder) {
                sendResponse(req, res, 200, {
                    status: false,
                    data: null,
                    message: `Order not found`,
                    errorCode: null,
                });
            }

            let updateObject = {
                deliveryStatus: status,
                cancelledOrAcceptedBy: req?.user?.portalUserId
            }
            if (status == "completed") {
                updateObject['status'] = "completed"
            }
        
            await OrderDetail.findOneAndUpdate(
                { _id: { $eq: orderId } },
                {
                  $set: updateObject,
                },
                { new: true }
            ).exec();

            let paramsData = {
                sendTo: 'patient',
                madeBy: 'pharmacy',
                patientId: getOrder?.patientId,
                doctorId: getOrder?.doctorId,
                pharmacyId: getOrder?.forPortalUser,
                appointment: {
                  _id: getOrder?.appointmentId
                },
                condition: status == 'under-process' ? 'UNDER_PROCESS_MEDICINE_ORDER' : 'COMPLETED_MEDICINE_ORDER',
                notification: ['push_notification', 'sms', 'email']
            }
      
            sendNotification(paramsData, headers)

            sendResponse(req, res, 200, {
                status: true,
                data: null,
                message: `Order ${status == 'under-process' ? 'under process' : 'completed'} successfully`,
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to update order status",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async updateConfirmScheduleorder(req, res) {
        try {
            let jsondata = {
                order_schedule_confirm: true,

            };
            const result = await OrderDetail.updateOne(
                { _id: mongoose.Types.ObjectId(req.body._id) },
                { $set: jsondata },
                { new: true }
            );
            if (!result) {
                res.send({ status: false, message: "Unable to update" });
            } else {
                res.send({
                    status: true,
                    message: "update successfully",
                    result: result,
                });
            }
        }
        catch (e) {
     
        }
    }

    async totalOrderDashboardCount(req, res) {
        try {
            const {
                for_portal_user,
            } = req.query;
            let checkUser = await PortalUser.findOne({ _id: mongoose.Types.ObjectId(for_portal_user) });

            if (checkUser.role === 'PHARMACY_STAFF') {

                let adminData = await StaffInfo.findOne({ for_portal_user: mongoose.Types.ObjectId(for_portal_user) });

                for_portal_user = adminData?.for_staff

            }
            
            const searchQuery = {
                $and: [
                    { for_portal_user: mongoose.Types.ObjectId(for_portal_user) },
                    { request_type: 'order_request' }
                ]
            };
            const result = await OrderDetail.aggregate([
                { $match: searchQuery },


            ]).exec();
       
            let totalOrder = 0;
            let totalScheduled = 0;
            let cancelled = 0;
            let pickUp = 0;
            let completed = 0;
            let rejected = 0;
            for (const data of result) {

                if (data) totalOrder += 1
                if (data.status === 'scheduled') totalScheduled += 1
                if (data.status === 'cancelled') cancelled += 1
                if (data.status === 'completed') completed += 1
                if (data.status === 'rejected') rejected += 1
                if (data.order_schedule_confirm === true) pickUp += 1
            }

            const finalcount = {
                totalOrder: totalOrder,
                totalScheduled: totalScheduled,
                cancelled: cancelled,
                pickUp: pickUp,
                completed: completed,
                rejected: rejected,

            }
            sendResponse(req, res, 200, {
                status: true,
                data: finalcount,
                message: "successfully fetched order count",
                errorCode: null,
            });
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to fetch order count",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }
    
    // edit medicine name from superadmin
    async editMedicineName(req, res) {
        const {
            medicines, medicineId
        } = req.body;
        try {
            const result = await MedicineDetail.findOneAndUpdate(
                { medicine_id: medicineId },
                {
                    $set: {
                        name: medicines.medicine_name
                    }
                },
                { new: true }
            )

            sendResponse(req, res, 200, {
                status: true,
                data: result,
                message: `Successfully update medicine name`,
                errorCode: null,
            });
        } catch (err) {
            
            sendResponse(req, res, 500, {
                status: false,
                data: err,
                message: `failed to update imaging test details`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async dashboardLineGraph(req, res) {
        try {
            const { for_portal_user, yearFilter } = req.query;
            const currentYear = yearFilter ? yearFilter : new Date().getFullYear();
            let checkUser = await PortalUser.findOne({ _id: mongoose.Types.ObjectId(for_portal_user) });

            if (checkUser.role === 'PHARMACY_STAFF') {

                let adminData = await StaffInfo.findOne({ for_portal_user: mongoose.Types.ObjectId(for_portal_user) });

                for_portal_user = adminData?.for_staff

            }

            let filter1 = {
                for_portal_user: mongoose.Types.ObjectId(for_portal_user), request_type: 'order_request', status: 'completed', createdAt: {
                    $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear, 11, 31)
                }
            };
            let filter2 = {
                for_portal_user: mongoose.Types.ObjectId(for_portal_user), request_type: 'order_request', status: 'rejected', createdAt: {
                    $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear, 11, 31)
                }
            };
            const pip = [
                {
                    $group: {
                        _id: { $month: '$createdAt' },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        month: '$_id',
                        count: 1
                    }
                },
                {
                    $sort: { month: 1 }
                }

            ];
            let data1 = {}
            if (filter1) {
                const result1 = await OrderDetail.aggregate([{ $match: filter1 }, ...pip]);
                const formattedResult = Object.fromEntries(
                    result1.map(item => [item.month, item.count])
                )
                const allMonths = Array.from({ length: 12 }, (_, i) => i + 1)
                    .map(month => new Date(0, month - 1).toLocaleString('en-US', { month: 'long' }));
                allMonths.forEach((month, i) => {
                    data1[month] = formattedResult[i + 1] || 0;

                });
            }
            let data2 = {}
            if (filter2) {
                const result2 = await OrderDetail.aggregate([{ $match: filter2 }, ...pip]);
                const formattedResult = Object.fromEntries(
                    result2.map(item => [item.month, item.count])
                )
                const allMonths = Array.from({ length: 12 }, (_, i) => i + 1)
                    .map(month => new Date(0, month - 1).toLocaleString('en-US', { month: 'long' }));
                allMonths.forEach((month, i) => {
                    data2[month] = formattedResult[i + 1] || 0;
                });
            }

            sendResponse(req, res, 200, {
                status: true,
                data: {
                    completed: data1,
                    rejected: data2
                },
                message: "successfully fetched order count",
                errorCode: null,
            });

        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to fetch order count",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }


    async getTotalCoPayment(req,res){
        try {
            let {pharmacyId,createdDate, updatedDate} = req.query;
            const dateFilter = {};
            if (createdDate && createdDate !== "" && updatedDate && updatedDate !== "") {
                const createdDateObj = new Date(createdDate);
                const updatedDateObj = new Date(updatedDate);
 
                dateFilter.$and = [
                    { createdAt: { $gte: createdDateObj } },
                    { createdAt: { $lte: updatedDateObj } },
                ];
            } else if (createdDate && createdDate !== "") {
                const createdDateObj = new Date(createdDate);
                dateFilter.createdAt = { $gte: createdDateObj };
            } else if (updatedDate && updatedDate !== "") {
                const updatedDateObj = new Date(updatedDate);
                dateFilter.createdAt = { $lte: updatedDateObj };
            }
            let coPayAmountDetails = await MedicineDetail.find({for_portal_user: pharmacyId,...dateFilter });
 
            let allco_payment = 0;
            coPayAmountDetails.forEach((item) => {
                if(item.co_payment != null && !isNaN(item.co_payment)){
                    allco_payment += parseFloat(item.co_payment);
                }
            });
           
            let monthlyCoPayment = {};
            let currentYear = moment().year();
 
            moment.months().forEach((month) => {
                monthlyCoPayment[month] = 0;
            });
 
            coPayAmountDetails.forEach((item) => {
                if (item) {
                    let createDate = moment(item.createdAt);
                    let year = createDate.year();
                    let month = createDate.format("MMMM");
                    if(item.co_payment != null && !isNaN(item.co_payment)){
                    if (year === currentYear) {
                        monthlyCoPayment[month] += parseFloat(item.co_payment);
                    }
                }
                }
            });
 
            sendResponse(req, res, 200, {
                status: true,
                data: {
                    allco_payment:allco_payment.toFixed(2),
                    graphdata:monthlyCoPayment
                },
                message: `All data fetched successfully`,
                errorCode: null,
            });
 
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: error.message ? error.message : "Something went wrong",
                errorCode: error.code ? error.code : "Internal server error",
            });
        }
    }

    async getOrderPaymentHistory(req, res) {
        try {
            const headers = {
                'Authorization': req.headers['authorization']
            }
            let {pharmacyId,createdDate, updatedDate,limit,page,searchKey} = req.query;

            let sort = req.query.sort
            let sortingarray = {};
            let keynew = '';
            let value = '';
            if (sort != 'undefined' && sort != '' && sort != undefined) {
                keynew = sort.split(":")[0];
                value = sort.split(":")[1];
                sortingarray[keynew] = Number(value);
            } else {
                sortingarray['createdAt'] = -1;
            }

           
            let orderDetails = await OrderDetail.find({for_portal_user: pharmacyId });

            let orderId = [];
            const promises1 = orderDetails.map(async (item) => {
                try {
                    orderId.push(item?._id)
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            });
            try {
                await Promise.all(promises1);
            } catch (error) {
                console.error("Error in one of the promises:", error);
            }
 
            let orderpaymentData = await httpService.getStaging('payment/get-pharmacy-order-payment-history', { orderId, createdDate ,updatedDate,searchKey }, headers, 'patientServiceUrl');

            let filteredData = data1.filter(item => item.totalApprovedAmount !== null );
           
            const promises2 = filteredData.map(async (item) => {
                try {
                    let totalPayment;
                    for (const key in item) {
                        if(key == "plan_price"){
                            return {
                                ...item,
                                totalPayment : item[key]
                            }
                        }
                        else if(key == "totalApprovedAmount"){
                            return {
                                ...item,
                                totalPayment : item[key]
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            });

            let result;
            let totalRecords = 0;
            try {
                let all_details= await Promise.all(promises2);

                if (keynew == 'createdAt') {
                    if (value == 1) {
                        all_details.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                    } else {
                        all_details.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                    }
                }

                if (keynew == 'patientName') {
                    if (value == 1) {
                        all_details.sort((a, b) => {
                            if (a.patientName < b.patientName) return -1;
                            if (a.patientName > b.patientName) return 1;
                            return 0;
                        });

                    } else {
                        all_details.sort((a, b) => {
                            if (a.patientName > b.patientName) return -1;
                            if (a.patientName < b.patientName) return 1;
                            return 0;
                        });
                    }
                }

                if (keynew == 'totalPayment') {
                    if (value == 1) {
                        all_details.sort((a, b) => parseInt(a.totalPayment) - parseInt(b.totalPayment));

                    } else {
                        all_details.sort((a, b) => parseInt(b.totalPayment) - parseInt(a.totalPayment));

                    }
                }

                if (keynew == 'payment_mode') {
                    if (value == 1) {
                        all_details.sort((a, b) => {
                            if (a.payment_mode < b.payment_mode) return -1;
                            if (a.payment_mode > b.payment_mode) return 1;
                            return 0;
                        });

                    } else {
                        all_details.sort((a, b) => {
                            if (a.payment_mode > b.payment_mode) return -1;
                            if (a.payment_mode < b.payment_mode) return 1;
                            return 0;
                        });
                    }
                }

                let start_index;
                let end_index;

                if (req.query.limit != 0) {
                    let skip = (page - 1) * limit
                    if (skip == 0) {
                        start_index = skip
                    } else {
                        start_index = skip;
                    }
    
                    end_index = parseInt(limit) + parseInt(skip);
                }
    
                result = all_details.slice(start_index, end_index);

            } catch (error) {
                console.error("Error in one of the promises:", error);
            }

            let totalAmount = 0;
            result?.forEach((item)=>{
                if(item?.totalPayment != null){
                    totalAmount = totalAmount + parseInt(item?.totalPayment)
                }
            })

            sendResponse(req, res, 200, {
                status: true,
                data: {
                    result:result,
                    totalAmount:totalAmount,
                    totalCount: filteredData.length,
                    currentPage: page,
                    totalPages: limit > 0 ? Math.ceil(filteredData.length/ limit) : 1,
                },
                message: `All data fetched successfully`,
                errorCode: null,
            });
 
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: error.message ? error.message : "Something went wrong",
                errorCode: error.code ? error.code : "Internal server error",
            });
        }
    }
    
    async getOrderMedicineOfAppointment(req, res) {
        try {
            const appointmentId = req.query.appointmentId
            const orderData = await OrderDetail.find({appointmentId: {$eq: appointmentId}, status: "completed"})
                                                .populate({path: 'medicineDetailIds', select: 'medicineName'})
                                                .select('status');
            sendResponse(req, res, 200, {
                status: true,
                data: orderData,
                message: `All data fetched successfully`,
                errorCode: null,
            });
 
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: error.message ? error.message : "Something went wrong",
                errorCode: error.code ? error.code : "Internal server error",
            });
        }
    }

}
module.exports = new OrderController();
