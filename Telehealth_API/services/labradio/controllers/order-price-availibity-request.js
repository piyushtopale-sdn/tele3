import DocumentInfo from "../models/document_info";
import OrdertestBill from "../models/order/order_test_bill";
import OrderDetail from "../models/order/order_detail";
import OrderTestDetails from "../models/order/order_test_detail";
import { getNextSequenceValue } from "../middleware/utils";
import mongoose from "mongoose";
import { sendResponse } from "../helpers/transmission";
import Basic_info from "../models/basic_info";
import {notification} from "../helpers/notification";
import PortalUser from "../models/portal_user";
const Http = require('../helpers/httpservice');
const httpService = new Http()
class OrderFlow {
    // list
    async listOrder(req, res) {
        try {
            const {
                page,
                limit,
                name,
                status,
                start_date,
                portal,
                patient_id,
                end_date,
                request_type,
                for_portal_user,
                portal_type
            } = req.body;

            let sort = req.body.sort
            let sortingarray = {};
            if (sort != 'undefined' && sort != '' && sort != undefined) {
                let keynew = sort.split(":")[0];
                let value = sort.split(":")[1];
                sortingarray[keynew] = Number(value);
            } else {
                sortingarray['createdAt'] = -1;

            }

            let id_search = null;
            if (portal == "patient") {
                id_search = { "patient_details.user_id": new mongoose.Types.ObjectId(patient_id), portal_type }
            } else {
                id_search = { for_portal_user: new mongoose.Types.ObjectId(for_portal_user), portal_type }
            }
            let end_date_search = {}
            if (end_date != "") {
                end_date_search = { createdAt: { $lte: new Date(end_date) } }
            }
            let start_date_search = {}
            if (start_date != "") {
                start_date_search = { createdAt: { $gte: new Date(start_date) } }
            }
            const searchQuery = {
                $and: [
                    id_search,
                    { request_type: { $regex: request_type, $options: "i" } },
                    {
                        status: { $eq: status },
                    },
                    {
                        "patient_details.user_name": { $regex: name || "", $options: "i" },
                    },
                    // { createdAt: { $lte: new Date(end_date) } },
                    // { createdAt: { $gte: new Date(start_date) } },
                    end_date_search,
                    start_date_search
                ],
            };

            const aggregateQuery = [
                {
                    $lookup: {
                        from: "portalusers",
                        localField: "for_portal_user",
                        foreignField: "_id",
                        as: "portaldetails",
                    }
                },
                { $unwind: "$portaldetails" },
                {
                    $lookup: {
                        from: "basicinfos",
                        localField: "portaldetails._id",
                        foreignField: "for_portal_user",
                        as: "basicinfosData",
                    }
                },
                { $unwind: "$basicinfosData" },
                {
                    $addFields: {
                        portal_name: "$basicinfosData.full_name",
                        portal_profile_picture: "$basicinfosData.profile_picture",
                    }
                },
                {
                    $unset: [
                        "portaldetails",
                        "basicinfosData"
                    ]
                },
                { $match: searchQuery },
                {
                    $lookup: {
                        from: "ordertestbills",
                        let: { orderId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: ["$for_order_id", "$$orderId"],
                                            },
                                        ],
                                    },
                                },
                            },
                            {
                                $project: {
                                    total_test_cost: 1,
                                    mode: 1,
                                },
                            },
                        ],
                        as: "ordertestbills",
                    },
                },
                { $unwind: "$ordertestbills" },
                { $sort: sortingarray },
                { $skip: limit * (page - 1) },
                { $limit: limit },
            ]

            const result = await OrderDetail.aggregate(aggregateQuery).exec();
            const count = await OrderDetail.countDocuments(searchQuery);

            sendResponse(req, res, 200, {
                status: true,
                data: {
                    order_list: result,
                    total_count: count,
                    totalPages: Math.ceil(count / limit),
                    currentPage: page,
                    totalResult: count,
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
    // count
    async totalOrderCount(req, res) {
        try {
            const {
                portal,
                for_portal_user,
                patient_id,
                request_type,
                portal_type
            } = req.query;
            let portalArray = ["Radiology", "Laboratory"];

            const searchQuery = {
                $and: [
                    portalArray.includes(portal) ? { for_portal_user: new mongoose.Types.ObjectId(for_portal_user), portal_type } : { "patient_details.user_id": new mongoose.Types.ObjectId(patient_id), portal_type },
                    { request_type: { $regex: request_type, $options: "i" } },
                ]
            }



            const result = await OrderDetail.aggregate([
                { $match: searchQuery },
                { $project: { status: 1, count: 1 } }
            ]).exec();
            const resultData = []
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
    // newOrder
    async newOrder(req, res) {
        try {
            const {
                from_user,
                patient_details,
                request_type,
                for_portal_user,
                prescription_url,
                test_list,
                action,
                eprescription_number,
                portal_type
            } = req.body;
            let ordertest_From
            const headers = {
                'Authorization': req.headers['authorization']
            }
            if (action == 'eprecription') {
                let checkEprescriptionNumberExist;
                // Check if e-prescription number is available or not
                 checkEprescriptionNumberExist = await httpService.getStaging("labradio/checkEprescriptionAvailabilityForFourPortal", { eprescription_number, portal_type }, headers, "labradioServiceUrl");
                if (!checkEprescriptionNumberExist.status) {
                    checkEprescriptionNumberExist = await httpService.getStaging("hospital-doctor/check-eprescription-availability", { eprescription_number,test_type:portal_type }, headers, "hospitalServiceUrl");
                }

                if (!checkEprescriptionNumberExist.status) {
                    return sendResponse(req, res, 200, checkEprescriptionNumberExist);
                }
                const testDosage = checkEprescriptionNumberExist.body.medicineDosageData;
                ordertest_From = testDosage
            } else {
                ordertest_From = test_list
            }
            let list = []
            let patientdetails;
            for (let index = 0; index < for_portal_user.length; index++) {
                const element = for_portal_user[index];
                const order_id = await getNextSequenceValue("orderid");
                let from_user_id = from_user.user_id;
                let patient_details_id = patient_details.user_id;
                let from_userdetails = await httpService.getStaging("patient/patient-details", { patient_id: from_user_id }, headers, "patientServiceUrl");
                let from_userimage = from_userdetails?.body?.personalDetails?.profile_pic;
                from_user.image = from_userimage
                patientdetails = await httpService.getStaging("patient/patient-details", { patient_id: patient_details_id }, headers, "patientServiceUrl");
                let patient_detailsimage = patientdetails?.body?.personalDetails?.profile_pic;
                patient_details.image = patient_detailsimage
                const obj = {
                    from_user: from_user,
                    patient_details: patient_details,
                    request_type: request_type,
                    for_portal_user: element,
                    order_id: "ORD-" + order_id,
                    portal_type: portal_type
                }
                list.push(obj)
            }

            const orderData = await OrderDetail.insertMany(list)

            const labtest_DataArray = orderData.map((singleData) => ({
                prescription_url: prescription_url,
                for_portal_user: singleData.for_portal_user,
                for_order_id: singleData._id,
                portal_type: portal_type

            }));
            const ordertest_Bill = await OrdertestBill.insertMany(labtest_DataArray)

            let ordertestDetails = null;
            if (ordertest_From.length >= 1) {
                let ordertestList = []
                for (let index = 0; index < ordertest_Bill.length; index++) {
                    for (let index1 = 0; index1 < ordertest_From.length; index1++) {
                        const test = ordertest_From[index1];
                        let obj = {}
                        if (action == 'eprecription') {
                            let prescribed = 0
                            let days = 0
                            let frequency = 0

                            let testname;
                            let testId;
                            if(test.imaging_name){
                                testname = test.imaging_name,
                                testId = test.imagingId
                            }else if(test?.lab_name ){
                                testname = test.lab_name,
                                testId = test.labId
                            }else if(test?.other_name ){
                                testname = test?.other_name,
                                testId = test.otherId
                            }else if(test?.eyeglass_name ){
                                testname = test.eyeglass_name,
                                testId = test.eyeglassId
                            }
                            obj = {
                                name:testname,
                                test_id: testId,
                                quantity_data: {
                                    prescribed
                                },
                                frequency,
                                duration: days,
                                for_order_id: ordertest_Bill[index].for_order_id,
                                in_ordertest_bill: ordertest_Bill[index]._id,
                                for_portal_user: ordertest_Bill[index].for_portal_user,
                                portal_type: portal_type
                            }
                        } else {
                            obj = {
                                ...test,
                                for_order_id: ordertest_Bill[index].for_order_id,
                                in_ordertest_bill: ordertest_Bill[index]._id,
                                for_portal_user: ordertest_Bill[index].for_portal_user,
                                portal_type: portal_type
                            }
                        }

                        ordertestList.push(obj)
                    }
                }
               await OrderTestDetails.insertMany(ordertestList);
            }

            let data= orderData[0]?.request_type.split('_').join(' ')

            for (const user of for_portal_user) {
                let message = `${data} by ${patientdetails?.body?.personalDetails?.full_name}`
                let requestData = {
                    created_by_type: "patient",
                    created_by: from_user?.user_id,
                    content: message,
                    url: '',
                    for_portal_user: user,
                    notitype: data,
                    appointmentId: orderData[0]?._id,
                    title:"Order Request"
                }
                
               await notification('','',"labradioServiceUrl",'','','', headers, requestData)
                
            }

            sendResponse(req, res, 200, {
                status: true,
                data: orderData,
                message: "Order successfully",
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: error.message ? error.message : "failed to order",
                errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
            });
        }
    }
    // orderdetail
    async fetchOrderDetails(req, res) {
        try {
            const {
                for_order_id,
                for_portal_user,
                portal_type
            } = req.body;
            const headers = {
                'Authorization': req.headers['authorization']
            }
            const orderData = await OrderDetail.findOne({ _id: for_order_id, for_portal_user, portal_type }).lean();
            const patientId = orderData.patient_details.user_id

            const patientDetails = await httpService.getStaging('patient/patient-common-details', { patientId: patientId }, headers, 'patientServiceUrl');
            const portal_Details = await Basic_info.findOne({ for_portal_user, type: portal_type }, { full_name: 1, address: 1, main_phone_number: 1, profile_picture: 1 })
                .populate({
                    path: "for_portal_user",
                    select: ("email")
                })
                .populate({
                    path: "in_location",
                    model: "LocationInfo",
                    select: "address"
                });
            let portal_Profile
            if (portal_Details.profile_picture != "" && portal_Details.profile_picture != undefined) {
          
                const profilePictureArray = [portal_Details.profile_picture];
                await DocumentInfo.findOne({ _id: profilePictureArray })
                let image;
                portal_Profile = image;

            }

            const testDetails = await OrderTestDetails.find({ for_order_id, for_portal_user, portal_type }).lean();
            let checkTesttype = orderData?.portal_type
            let getTestData;
            const testIDArray = []
            
            if (checkTesttype === 'Radiology') {
                if (testDetails.length > 0) {
                    for (const data of testDetails) {
                        testIDArray.push(data.test_id)
                    }
                    getTestData = await httpService.getStaging('hospital/lab-test-byId', { labTestId: testIDArray }, headers, 'hospitalServiceUrl');

                }
            }
            
            if (checkTesttype === 'Laboratory') {
                if (testDetails.length > 0) {
                    for (const data of testDetails) {
                        testIDArray.push(data.test_id)
                    }
                    getTestData = await httpService.getStaging('hospital/imaging-test-byId', { imagingId: testIDArray }, headers, 'hospitalServiceUrl');

                }
            }


            const testBill = await OrdertestBill.findOne({ for_order_id, for_portal_user, portal_type }).lean();
            sendResponse(req, res, 200, {
                status: true,
                data: {
                    orderData,
                    testDetails,
                    testBill,
                    testNameObject: getTestData,
                    patientDetails: patientDetails.body,
                    portal_Details,
                    portal_Profile
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
    // updatedetail
    async updateOrderDetails(req, res) {
        const headers = {
            'Authorization': req.headers['authorization']
        }
        try {
            const {
                test_details,
                test_bill: { total_test_cost },
                for_portal_user,
                for_order_id,
                in_ordertest_bill,
                request_type,
                status,
                portal_type


            } = req.body;

            if (status == "completed") {
                const orderDataResult = await OrderDetail.updateOne({ _id: for_order_id, portal_type }, {
                    $set: {
                        status,
                    }
                }, { new: true, upsert: false }).exec();

                 // For Notification
                 const orderData= await OrderDetail.find({ _id: for_order_id })
                 let message = `Prescription Price Received`
                 let requestData = {
                     created_by_type:portal_type,
                     created_by:for_portal_user,
                     content: message,
                     url: '',
                     for_portal_user: orderData[0]?.patient_details?.user_id,
                     notitype: "Amount Send",
                     appointmentId: for_order_id,
                     title:"Sent Amount"
                 }
     
                 await notification('','', "patientServiceUrl",'','','', headers, requestData)
                 

                sendResponse(req, res, 200, {
                    status: true,
                    data: orderDataResult,
                    message: "Successfully updated list",
                    errorCode: null,
                });
            }
            else {
                const testBillResult = await OrdertestBill.updateOne({ for_portal_user, for_order_id, portal_type }, {
                    $set: {
                        total_test_cost,
                    }
                }, { new: true, upsert: false }).exec();
                const orderDataResult = await OrderDetail.updateOne({ _id: for_order_id, portal_type }, {
                    $set: {
                        request_type,
                        status,
                    }
                }, { new: true, upsert: false }).exec();
                await OrderTestDetails.deleteMany({ for_portal_user, for_order_id, portal_type }, { new: true }).exec();
                const testDetailRecord = test_details.map((record) => (
                    {
                        ...record,
                        in_ordertest_bill,
                        for_order_id,
                        for_portal_user,
                        portal_type
                    }
                ))
                const testDetailResult = await OrderTestDetails.insertMany(testDetailRecord);

                // For Notification
                const orderData= await OrderDetail.find({ _id: for_order_id })
                let message = `Prescription Price Received`
                let requestData = {
                    created_by_type:portal_type,
                    created_by:for_portal_user,
                    content: message,
                    url: '',
                    for_portal_user: orderData[0]?.patient_details?.user_id,
                    notitype: "Amount Send",
                    appointmentId: for_order_id,
                    title:"Sent Amount"
                }
    
                await notification('','', "patientServiceUrl",'','','', headers, requestData)
                

                sendResponse(req, res, 200, {
                    status: true,
                    data: {
                        testBillResult,
                        testDetailResult,
                        orderDataResult
                    },
                    message: "Successfully updated list",
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

    //cancelOrder 
    async cancelOrder(req, res) {
        const headers = {
            'Authorization': req.headers['authorization']
        }
        try {
            const { cancelled_by, for_portal_user, status, _id, portal_type } = req.body;
            const orderDataResult = await OrderDetail.updateOne({ _id, for_portal_user, portal_type }, {
                $set: {
                    cancelled_by,
                    status
                }
            }).exec();

            const orderData= await OrderDetail.find({ _id: _id })

            const pharmacy_details = await PortalUser.find({_id: for_portal_user});
            let message = `${pharmacy_details[0]?.user_name} has Cancelled Medicine Order`
            let requestData = {
                created_by_type: portal_type,
                created_by:for_portal_user,
                content: message,
                url: '',
                for_portal_user: orderData[0]?.patient_details?.user_id,
                notitype: "Order Cancelled",
                appointmentId: _id,
                title:"Order Confirmed"
            }

            await notification('','', "patientServiceUrl",'','','', headers, requestData)
            
            sendResponse(req, res, 200, {
                status: true,
                data: {
                    orderDataResult
                },
                message: "Successfully cancelled order.",
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to cancel order details",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }
    async confirmOrder(req, res) {
        const headers = {
            'Authorization': req.headers['authorization']
        };
        try {
            let {
                _id,
                for_portal_user,
                patient_details,
                payment_type,
                portal_type
            } = req.body;
    
            // Check if req.body has a 'data' property
            if (req.body.data) {
                ({
                    _id,
                    for_portal_user,
                    patient_details,
                    payment_type,
                    portal_type
                } = req.body.data);
            }
    
    
            const orderDataResult = await OrderDetail.updateOne({
                _id,
                for_portal_user,
                portal_type
            }, {
                $set: {
                    patient_details,
                    payment_type
                }
            }).exec();
            let message = `${patient_details?.user_name} has confirmed Medicine order`;
            let requestData = {
                created_by_type: "patient",
                created_by: patient_details?.user_id,
                content: message,
                url: '',
                for_portal_user: for_portal_user,
                notitype: "Order Confirmed",
                appointmentId: _id,
                title: "Order Confirmed"
            };
    
           await notification('', '', "labradioServiceUrl", '', '', '', headers, requestData);
            
            sendResponse(req, res, 200, {
                status: true,
                data: {
                    orderDataResult
                },
                message: "Successfully confirmed order",
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to confirm order",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }
    
    // confirmschedule
    async updateConfirmScheduleorder(req, res) {
        try {
            let jsondata = {
                order_schedule_confirm: true,

            };
            const result = await OrderDetail.updateOne(
                { _id: mongoose.Types.ObjectId((req.body._id)), portal_type: req.body.portal_type },
                { $set: jsondata },
                { new: true }
            );
            if (!result) {
                sendResponse(req, res, 200,{ status: false, message: "Unable to update" });
            } else {
                sendResponse(req, res, 200,{
                    status: true,
                    message: "Update successfully",
                    result: result,
                });
            }
        }
        catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to confirm order",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async fourPortalSavePdf(req, res) {
        const { order_id, online_pdf,fourPortalId ,portalType} = req.body;
        try {    
            const headers = {
                'Authorization': req.headers['authorization']
            }
            let orderDetails;
            if(order_id) {
                orderDetails = await OrderDetail.findOne({_id:order_id})
                if (orderDetails) {
                    orderDetails.online_pdf = online_pdf?.url;
                    await orderDetails.save(); // Save the changes to the database
                } 
            }

           const fourPortalDetails = await PortalUser.findOne({_id: fourPortalId});

           let message = `Your ${portalType} result has been uploaded by ${fourPortalDetails?.full_name}.`
           let requestData = {
             created_by_type: portalType,
             created_by: fourPortalId,
             content: message,
             url: '',
             for_portal_user: orderDetails?.patient_details?.user_id,
             notitype: 'New Result Uploaded',
             appointmentId: order_id
           }
          await notification('', '', "patientServiceUrl", '', '', '', headers, requestData);
        
          sendResponse(req, res, 200, {
            status: true,
            data: orderDetails,
            message: "PDF Added Successfully",
            errorCode: null
          });
        } catch (error) {
          
          sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: error.message ? error.message : "Something went wrong",
            errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
          });
        }
    }

    // edit medicine name from superadmin
    async editImagingName(req,res){
        const {
            imagingTestId,
            ImagingTestData,
        } = req.body;
        try {
            const result = await OrderTestDetails.findOneAndUpdate(
                { test_id: imagingTestId },
                {
                    $set: {
                        name:ImagingTestData.imaging
                    }
                },
                { new: true }
            )
            
            sendResponse(req, res, 200, {
                status: true,
                data: result,
                message: `Successfully update imaging test details`,
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
}

module.exports = new OrderFlow();