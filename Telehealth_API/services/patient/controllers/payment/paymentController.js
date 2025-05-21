"use strict";

import { handleResponse } from "../../helpers/transmission";
import PurchaseHistory from "../../models/subscription/purchasehistory";
import { config } from "../../config/constants";
import Http from "../../helpers/httpservice"
import moment from "moment";
import axios from "axios";
import mongoose from "mongoose";
import PortalUser from "../../models/portal_user";
import Profile_info from "../../models/profile_info";
import { generateToken } from "../../middleware/utils";
const { MOYASAR_SECRET_KEY } = config
const httpService = new Http();

const generateInvoiceNumber = () => {
    const prefix = "INV";
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random
    return `${prefix}-${datePart}-${randomPart}`;
};

const getPayment = (paymentId) => {
    return new Promise(async(resolve, reject) => {
        try {
            const getData = await axios.get(`https://api.moyasar.com/v1/payments/${paymentId}`, {
                auth: {
                  username: MOYASAR_SECRET_KEY,
                  password: ''
                }
              })
            resolve(getData.data)
        } catch (error) {
            reject(error);
        }
    })
}
const saveData = (getPaymentData, existingSubscription, params) => {
    return new Promise(async(resolve, reject) => {
       try {
            const currentDate = moment(getPaymentData?.created_at).utc(); // Current date
            let endDate
            if (params?.trialDays) {
                endDate = currentDate.add(params?.trialDays, 'days').toISOString();
            } else {
                const duration = params?.planDuration == "monthly" ? 30 : 365
                endDate = currentDate.add(duration, 'days').toISOString();
            }
            const period = {
                start: getPaymentData?.created_at,
                end: endDate
            }
            const addObject = {
                invoiceId: getPaymentData?.metadata?.invoice_id,
                invoiceUrl: getPaymentData?.invoice_id,
                planPrice: params?.planPrice,
                vatCharges: params?.vatCharges,
                amountPaid: getPaymentData?.amount/100,
                discountedAmount: params?.discountedAmount,
                paymentMode: getPaymentData?.source?.type,
                paymentType: getPaymentData?.source?.company,
                currencyCode: getPaymentData?.currency,
                status: getPaymentData?.status,
                forUser: params?.forUser,
                period,
                subscriptionPlanId: params?.subscriptionPlanId,
                subscriptionStatus: getPaymentData?.status == 'paid' ? 'active': null,
                transactionType: 'subscription',
                discountCoupon: params?.discountCoupon,
                paymentGateway: 'moyasar',
                paymentId: getPaymentData?.id,
                ip: getPaymentData?.ip
            }
            const addData = new PurchaseHistory(addObject)
            await addData.save()
            let services = {}
            if (params?.services) {
                services = params?.services
            } else {
                for (const service of existingSubscription.services) {
                    services[service.name] = service.max_number
                }
            }
            
            if (getPaymentData?.status == 'paid') {
                const getDetails = await PortalUser.findOne({ _id: {$eq: params?.forUser} }).select('subscriptionDetails')
                let updateObject = {
                    isPlanActive: true,
                    subscriptionPlanId: params?.subscriptionPlanId,
                    moyasarToken: params?.token,
                    services,
                    period,
                    discountCoupon: params?.discountCoupon,
                    subscriptionDuration: params?.planDuration,
                    trialDays: params?.trialDays,
                }
                let updateOperations = {
                    $set: {
                        "subscriptionDetails.isPlanActive": updateObject.isPlanActive,
                        "subscriptionDetails.subscriptionPlanId": updateObject.subscriptionPlanId,
                        "subscriptionDetails.nextBillingPlanId": updateObject.subscriptionPlanId,
                        "subscriptionDetails.moyasarToken": updateObject.moyasarToken,
                        "subscriptionDetails.services": updateObject.services,
                        "subscriptionDetails.period": updateObject.period,
                        "subscriptionDetails.discountCoupon": updateObject.discountCoupon,
                        "subscriptionDetails.subscriptionDuration": updateObject.subscriptionDuration,
                        "subscriptionDetails.trialDays": updateObject.trialDays,
                        "subscriptionDetails.isPlanCancelled": false,
                        "subscriptionDetails.paymentRetried": 0,
                        "subscriptionDetails.paymentGateway": "moyasar"
                    }
                };
                
                // Conditional logic to reset or increment `discountUsedCount`
                if (params?.discountCoupon) {
                    if (getDetails?.discountCoupon && getDetails?.discountCoupon != params?.discountCoupon) {
                        updateOperations.$set["subscriptionDetails.discountUsedCount"] = 0; // Reset count to 0
                    } else {
                        updateOperations.$inc = { "subscriptionDetails.discountUsedCount": 1 }; // Increment count by 1
                    }
                }
                await PortalUser.findOneAndUpdate(
                    { _id: params?.forUser }, 
                    updateOperations
                ).exec();
            } else {
                await PortalUser.findOneAndUpdate(
                    { _id: params?.forUser }, 
                    {
                        $inc: {
                            "subscriptionDetails.paymentRetried": 1
                        }
                    }
                ).exec();
            }
            resolve(true)
       } catch (error) {
            reject(error)
       }
    })
}

const resetServiceData = (services) => {
    const resetServices = {};
    for (const service in services) {
        resetServices[service] = 0;
    }
    return resetServices;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const axiosWithRetry = async (url, options, retries = 3, delayMs = 1000) => {
    let attempt = 0;
    while (attempt < retries) {
        try {
            // Make the request
            const response = await axios(url, options);
            return response;
        } catch (error) {
            // Check if it's a 429 error (Rate Limit Exceeded)
            if (error.response && error.response.status === 429) {
                attempt++;
                const retryDelay = delayMs * Math.pow(2, attempt); // Exponential backoff
                console.log(`Retrying request. Attempt ${attempt}... Waiting ${retryDelay}ms`);
                await delay(retryDelay); // Wait before retrying
            } else {
                // For non-429 errors, throw immediately
                throw error;
            }
        }
    }
    throw new Error('Max retries reached. Request failed.');
};

const processSubscriptionPayment = async (user, headers) => {
    try {
        let subscriptionDetails = await httpService.getStaging(
            'superadmin/get-subscription-plan-details',
            { id: user?.subscriptionDetails?.nextBillingPlanId },
            headers,
            'superadminServiceUrl'
        );

        if (!subscriptionDetails.status) {
            console.error(`Failed to get subscription plan details for user ${user?._id}`);
            return;
        }

        const existingSubscription = subscriptionDetails.body;

        // Fetch VAT charges
        let getSettings = await httpService.getStaging(
            'superadmin/general-settings',
            { role: 'patient' },
            headers,
            'superadminServiceUrl'
        );

        let vatCharges = 0;
        if (getSettings.status) {
            const data = getSettings.body.find(val => val.settingName === 'VatCharges');
            vatCharges = parseInt(data?.settingValue) || 0;
        }

        const planDuration = existingSubscription?.plan_duration.find(val => val.duration === user?.subscriptionDetails?.subscriptionDuration);
        let vat = (vatCharges / 100) * parseFloat(planDuration?.price);
        let amount = parseFloat(planDuration?.price) + vat;
        let discountCoupon = '';
        let validateCoupon;

        if (user?.subscriptionDetails?.discountCoupon) {
            validateCoupon = await httpService.getStaging(
                'subscription/validate-discount-coupon',
                {
                    patientId: user?._id,
                    duration: user?.subscriptionDetails?.subscriptionDuration,
                    subscriptionPlanId: user?.subscriptionDetails?.nextBillingPlanId,
                    couponCode: user?.subscriptionDetails?.discountCoupon
                },
                headers,
                'superadminServiceUrl'
            );

            if (validateCoupon?.status) {
                discountCoupon = user?.subscriptionDetails?.discountCoupon;
                let vatCalculated = (vatCharges / 100) * parseFloat(validateCoupon.body.priceAfterDiscount.finalAmount);
                amount = parseFloat(validateCoupon.body.priceAfterDiscount.finalAmount) + vatCalculated;
            }
        }

        const metadata = {
            discountedAmount: discountCoupon ? validateCoupon.body.priceAfterDiscount.discount : 0,
            forUser: user?._id,
            subscriptionPlanId: user?.subscriptionDetails?.nextBillingPlanId,
            vatCharges,
            planPrice: discountCoupon ? validateCoupon.body.priceAfterDiscount.total : planDuration?.price,
            discountCoupon,
            invoice_id: generateInvoiceNumber()
        };

        const response = await axiosWithRetry(
            'https://api.moyasar.com/v1/payments',
            {
                method: 'POST',
                data: {
                    amount: amount * 100,
                    currency: 'SAR',
                    callback_url: "https://api.moyasar.com",
                    metadata,
                    source: {
                        type: 'token',
                        token: user?.subscriptionDetails?.moyasarToken,
                        manual: false
                    }
                },
                auth: { username: MOYASAR_SECRET_KEY, password: '' }
            }
        );

        if (response?.data) {
            const getPaymentData = await getPayment(response.data.id);
            const params = {
                discountedAmount: metadata.discountedAmount,
                subscriptionPlanId: metadata.subscriptionPlanId,
                forUser: metadata.forUser,
                vatCharges: vatCharges,
                planPrice: metadata.planPrice,
                planDuration: user?.subscriptionDetails?.subscriptionDuration,
                token: user?.subscriptionDetails?.moyasarToken,
                discountCoupon
            };

            await saveData(getPaymentData, existingSubscription, params);

            const getPatientName = await Profile_info.findOne({ for_portal_user: user?._id }).select('full_name');

            let requestBody = {
                userId: params?.forUser,
                userName: getPatientName?.full_name,
                role: 'patient',
                action: 'update',
                metadata,
                actionDescription: getPaymentData?.status === 'paid' ? `Subscription plan renewed successfully.` : `Failed to renew subscription plan.`
            };

            await httpService.postStaging("superadmin/add-logs", requestBody, {}, "superadminServiceUrl");
        }
    } catch (error) {
        console.error(`Error processing payment for user ${user?._id}:`, error);
    }
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
class PaymentController {
    async getPaymentHistory(req, res) {
        const headers = {
            Authorization: req.headers["authorization"],
        }
        try {
            const { limit, page, sort, date, for_user, status } = req.query;

             // Get all subscriptions plans
             const subscriptionPlanObject = {}
             const subscriptionPlanObjectArb = {}
             const subscriptionPlanObjectDescription = {}
             const getData = await httpService.getStaging('superadmin/all-subscription-plans',  { limit: 0, page: 1, plan_for: 'patient', is_deleted: "all", is_activated: "all" }, headers, 'superadminServiceUrl'); 
             if (getData?.status) {
                for (const plan of getData?.body?.allPlans ?? []) {
                    subscriptionPlanObject[plan?._id] = plan?.plan_name;
                    subscriptionPlanObjectArb[plan?._id] = plan?.plan_name_arabic;
                    subscriptionPlanObjectDescription[plan?._id] = plan?.description;
                }
            }

            let sortKey, sortValue;
            if (sort) {
                sortKey = sort.split(':')[0]
                sortValue = sort.split(':')[1]
            }
            let status_filter = {}
            if (status && status !== 'all') {
                status_filter = {
                    ['status']: status,
                }
            }
            let date_filter = {}
            if (date) {
                const newDate = new Date(date)
                const month = `0${newDate.getMonth() + 1}`
                const datee = `0${newDate.getDate()}`
                const mdate = `${newDate.getFullYear()}-${month.length > 2 ? month.slice(1) : month}-${datee.length > 2 ? datee.slice(1) : datee}`
                date_filter = {
                    ['createdAt']: {
                        "$gte": new Date(`${mdate}T00:00:00.000Z`),
                        "$lte": new Date(`${mdate}T23:59:59.000Z`)
                    },
                }
            }

            const pipeline = [
                {
                    $match: {
                        forUser: mongoose.Types.ObjectId(for_user),
                        $and: [
                            status_filter,
                            date_filter
                        ]
                    }
                },
            ]
            const paginatedStages = [];
            if (parseInt(limit) !== 0) {
                paginatedStages.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
                paginatedStages.push({ $limit: parseInt(limit) });
            }
            pipeline.push(
                {
                    $sort: {
                      [sortKey]: parseInt(sortValue)
                    }
                },
                {
                    $facet: {
                        totalCount: [
                          { $count: 'count' }
                        ],
                        paginatedResults: paginatedStages// If limit === 0, return all results without skip/limit
                      }
                }
            )
            let result = await PurchaseHistory.aggregate(pipeline)
            const paginatedResults = result[0].paginatedResults
            for (let index = 0; index < paginatedResults.length; index++) {
                const element = paginatedResults[index];
                paginatedResults[index].subscriptionPlanName = element?.subscriptionPlanId in subscriptionPlanObject ? subscriptionPlanObject[element?.subscriptionPlanId] : '-'
                paginatedResults[index].subscriptionPlanNameArabic = element?.subscriptionPlanId in subscriptionPlanObjectArb ? subscriptionPlanObjectArb[element?.subscriptionPlanId] : '-'
                paginatedResults[index].subscriptionPlanDescription = element?.subscriptionPlanId in subscriptionPlanObjectDescription ? subscriptionPlanObjectDescription[element?.subscriptionPlanId] : '-'

            }
            let totalCount = 0
            if (result[0].totalCount.length > 0) {
              totalCount = result[0].totalCount[0].count
            }
            return handleResponse(req, res, 200, {
                status: true,
                body: {
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: page,
                    totalRecords: totalCount,
                    result: result[0].paginatedResults
                },
                message: "Successfully fetched payment history",
                errorCode: null,
            });
        } catch (error) {
            console.error("An error occurred:", error);
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Failed to fetch payment history",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }
    async savePaymentHistory(req, res) {
        try {
            const { paymentId, discountedAmount, subscriptionPlanId, forUser, vatCharges, planPrice, planDuration, token }  = req.body
            const headers = {
                Authorization: req.headers["authorization"],
            };
            const getPaymentData = await getPayment(paymentId)
            const discountCoupon = getPaymentData?.metadata?.discountCoupon
            //Get subscription plan information
            let subscriptionDetails = await httpService.getStaging('superadmin/get-subscription-plan-details', { id: subscriptionPlanId }, headers, 'superadminServiceUrl');
            if (!subscriptionDetails.status) {
                return handleResponse(req, res, 500, {
                    status: false,
                    body: null,
                    message: subscriptionDetails.message,
                    errorCode: null,
                })
            }
            const existingSubscription = subscriptionDetails.body
            const params = {
                discountedAmount,
                subscriptionPlanId,
                forUser,
                vatCharges,
                planPrice,
                planDuration,
                token,
                discountCoupon,
                trialDays: existingSubscription?.trial_period
            }

            await saveData(getPaymentData, existingSubscription, params)
            const getPatientName = await Profile_info.findOne({for_portal_user: {$eq: params?.forUser}})
            . select('full_name')
            let requestBody =  { 
                userId: params?.forUser,
                userName: getPatientName?.full_name,
                role: 'patient',
                action: `create`,
                metadata: params
            }
            if (getPaymentData?.status == 'paid') {
                requestBody.actionDescription = `${getPatientName?.full_name} purchased new subscription plan.`
            } else {
                requestBody.actionDescription = `${getPatientName?.full_name} failed to purchased subscription plan.`
            }
            await httpService.postStaging(
                "superadmin/add-logs",
                requestBody,
                {},
                "superadminServiceUrl"
            );
            
            return handleResponse(req, res, 200, {
                status: true,
                message: "Data saved successfully",
                body: null,
                errorCode: null,
            });
        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Something went wrong!",
                errorCode: error.code,
            })
        }
    }

  /**Feb 12 -  Rate limit exceed issue handle*/
    async checkSubscriptionExpiry() {
        try {
            const getUsersSubscription = await PortalUser.find({
                lock_user: false,
                isDeleted: false,
                isActive: true,
                verified: true
            }).select('subscriptionDetails');
    
            // Generate a token for API authentication
            const token = generateToken({ role: 'superadmin' });
            const headers = {
                Authorization: `Bearer ${token}`,
            };
    
            for (const user of getUsersSubscription) {
                try {
                    if (user?.subscriptionDetails?.period?.start && user?.subscriptionDetails?.period?.end) {
                        const getCurrentTime = moment().utc().unix();
                        const getExpiredTime = moment(user?.subscriptionDetails?.period?.end).utc().unix();
    
                        if (getExpiredTime < getCurrentTime) {
                            let patientUpdateObject = {
                                ['subscriptionDetails.isPlanActive']: false,
                                ['subscriptionDetails.services']: resetServiceData(user?.subscriptionDetails?.services),
                                ['subscriptionDetails.addonServices']: resetServiceData(user?.subscriptionDetails?.addonServices),
                            };
    
                            let isRetried = false;
                            if (user?.subscriptionDetails?.paymentRetried === 3) {
                                isRetried = true;
                            }
    
                            await PortalUser.findOneAndUpdate(
                                { _id: user?._id },
                                { $set: patientUpdateObject }
                            );
    
                            await PurchaseHistory.findOneAndUpdate(
                                {
                                    forUser: user?._id,
                                    transactionType: 'subscription',
                                    subscriptionStatus: 'active'
                                },
                                { $set: { subscriptionStatus: 'expired' } }
                            );
                            // Create payment if conditions allow
                            if (!isRetried && user?.subscriptionDetails?.moyasarToken && !user?.subscriptionDetails?.isPlanCancelled) {
                                await processSubscriptionPayment(user, headers);
                            }
                        }
                    }
                } catch (userError) {
                    console.error(`Error processing user ${user?._id}:`, userError);
                }
            }
        } catch (error) {
            console.error("Error while checking subscription expiry:", error);
        }
    }
    
    async cancelSubscription(req, res) {
        try {
            const { id } = req.params

            await PortalUser.findOneAndUpdate(
                {_id: id},
                {
                    $set: {
                        'subscriptionDetails.isPlanCancelled': true
                    }
                }
            )
            await PurchaseHistory.findOneAndUpdate(
                {
                    forUser: id,
                    transactionType: 'subscription',
                    subscriptionStatus: 'active'
                },
                {
                    $set: {
                        subscriptionStatus: 'cancelled',
                    }
                }
            )
            const getPatientName = await Profile_info.findOne({for_portal_user: {$eq: id}}).select('full_name')
            let requestBody =  { 
                userId: id,
                userName: getPatientName?.full_name,
                role: 'patient',
                action: `delete`,
                actionDescription: `Subscription plan cancelled successfully.`
            }
            await httpService.postStaging(
                "superadmin/add-logs",
                requestBody,
                {},
                "superadminServiceUrl"
            );
            return handleResponse(req, res, 200, {
                status: true,
                message: "Subscription plan cancelled",
                body: null,
                errorCode: null,
            });
        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Something went wrong!",
                errorCode: error.code,
            })
        }
    }
    async upgradeSubscriptionPlan(req, res) {
        try {
            const headers = {
                Authorization: req.headers["authorization"],
            };
            const { paymentId, discountedAmount, subscriptionPlanId, forUser, vatCharges, planPrice, planDuration, token } = req.body
            const getSubscriptionData = await PortalUser.findOne({_id: {$eq: forUser}})
                                                    .select('subscriptionDetails')

            const getSubscription = getSubscriptionData?.subscriptionDetails
            const getPaymentData = await getPayment(paymentId)
            const discountCoupon = getPaymentData?.metadata?.discountCoupon
            //Get subscription plan information
            let subscriptionDetails = await httpService.getStaging('superadmin/get-subscription-plan-details', { id: subscriptionPlanId }, headers, 'superadminServiceUrl');
            if (!subscriptionDetails.status) {
                return handleResponse(req, res, 500, {
                    status: false,
                    body: null,
                    message: subscriptionDetails.message,
                    errorCode: null,
                })
            }
            const existingSubscription = subscriptionDetails.body
            let services = {
                consultation: getSubscription?.services?.consultation || 0,
                labtest: getSubscription?.services?.labtest || 0,
                radiologytest: getSubscription?.services?.radiologytest || 0,
            }
            for (const service of existingSubscription?.services) {
                services[service?.name] = parseInt(services[service?.name]) + parseInt(service?.max_number)
            }
          
            const params = {
                discountedAmount,
                subscriptionPlanId,
                forUser,
                vatCharges,
                planPrice,
                planDuration,
                token,
                discountCoupon,
                trialDays: existingSubscription?.trial_period,
                services
            }
            await PurchaseHistory.findOneAndUpdate(
                {
                    forUser,
                    transactionType: 'subscription',
                    subscriptionStatus: 'active'
                },
                {
                    $set: {
                        subscriptionStatus: 'upgraded',
                    }
                }
            )
            await saveData(getPaymentData, existingSubscription, params)
          
            const getPatientName = await Profile_info.findOne({for_portal_user: {$eq: forUser}}).select('full_name')
            let requestBody =  { 
                userId: forUser,
                userName: getPatientName?.full_name,
                role: 'patient',
                action: `update`,
                metadata: {
                    nextBillingPlanId: subscriptionPlanId
                }
            }
            if (getPaymentData?.status == 'paid') {
                requestBody.actionDescription = `Subscription plan upgraded successfully.`
            } else {
                requestBody.actionDescription = `Failed to upgrade subscription plan.`
            }
            await httpService.postStaging(
                "superadmin/add-logs",
                requestBody,
                {},
                "superadminServiceUrl"
            );
            return handleResponse(req, res, 200, {
                status: true,
                message: "Subscription plan upgraded successfully",
                body: null,
                errorCode: null,
            });
        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Something went wrong!",
                errorCode: error.code,
            })
        }
    }
    async maintainAddonHistory(req, res) {
        try {
            const { paymentId, forUser, addonPrice, serviceName, addonValue, addonIndividualPrice, vatCharges }  = req.body
            const getPaymentData = await getPayment(paymentId)
            //Get patient subscription
            const getSubscriptionData = await PortalUser.findOne({_id: {$eq: forUser}})
                                                    .select('subscriptionDetails')

            const getSubscription = getSubscriptionData?.subscriptionDetails;
            const addObject = {
                invoiceId: getPaymentData?.metadata?.invoice_id,
                invoiceUrl: getPaymentData?.invoice_id,
                amountPaid: addonPrice,
                paymentMode: getPaymentData?.source?.type,
                paymentType: getPaymentData?.source?.company,
                currencyCode: getPaymentData?.currency,
                status: getPaymentData?.status,
                forUser: forUser,
                period: getSubscription?.period,
                subscriptionPlanId: getSubscription?.subscriptionPlanId,
                transactionType: 'addon',
                addonCount: addonValue,
                addonIndividualPrice: addonIndividualPrice? addonIndividualPrice : null,
                vatCharges: vatCharges? vatCharges : null,
                paymentGateway: 'moyasar',
                ip: getPaymentData?.ip
            }
            const addData = new PurchaseHistory(addObject)
            await addData.save()
            //Save addon charges with services in portal data
            let addonServices = {
                consultation: getSubscription?.addonServices?.consultation || 0,
                labtest: getSubscription?.addonServices?.labtest || 0,
                radiologytest: getSubscription?.addonServices?.radiologytest || 0,
            }
            if (serviceName) {
                addonServices[serviceName] = parseInt(addonServices[serviceName]) + parseInt(addonValue)
            }
            let services = {
                consultation: getSubscription?.services?.consultation || 0,
                labtest: getSubscription?.services?.labtest || 0,
                radiologytest: getSubscription?.services?.radiologytest || 0,
            }
            if (serviceName) {
                services[serviceName] = parseInt(services[serviceName]) + parseInt(addonValue)
            }

            await PortalUser.findOneAndUpdate(
                { _id: forUser }, 
                {
                    $set: {
                        'subscriptionDetails.services': services,
                        'subscriptionDetails.addonServices': addonServices
                    }
                }
            ).exec();

            // Save addon charges logs
            const getPatientName = await Profile_info.findOne({for_portal_user: {$eq: forUser}})
            . select('full_name')
            let requestBody =  { 
                userId: forUser,
                userName: getPatientName?.full_name,
                role: 'patient',
                action: `create`,
            }
            if (getPaymentData?.status == 'paid') {
                requestBody.actionDescription = `${getPatientName?.full_name} purchased addon ${serviceName} service.`
            } else {
                requestBody.actionDescription = `${getPatientName?.full_name} failed to purchased addon ${serviceName} service.`
            }
            await httpService.postStaging(
                "superadmin/add-logs",
                requestBody,
                {},
                "superadminServiceUrl"
            );
            
            return handleResponse(req, res, 200, {
                status: true,
                message: "Data saved successfully",
                body: null,
                errorCode: null,
            });
        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Something went wrong!",
                errorCode: error.code,
            })
        }
    }

    async savePaymentHistryForLabRadioTests(req, res) {
        try {
            const { paymentId, forUser,totalAmountPaid, vatCharges, orderId, type ,discountCoupon, labRadioId, testInfo, discountedAmount, discountCouponId}  = req.body
            const getPaymentData = await getPayment(paymentId)
            const getSubscriptionData = await PortalUser.findOne({_id: {$eq: forUser}}).select('subscriptionDetails')

            const getSubscription = getSubscriptionData?.subscriptionDetails
            const addObject = {
                invoiceId: getPaymentData?.metadata?.invoice_id,
                invoiceUrl: getPaymentData?.invoice_id,
                amountPaid: totalAmountPaid,
                paymentMode: getPaymentData?.source?.type,
                paymentType: getPaymentData?.source?.company,
                currencyCode: getPaymentData?.currency,
                status: getPaymentData?.status,
                forUser: forUser,
                period: getSubscription?.period,
                subscriptionPlanId: getSubscription?.subscriptionPlanId,
                transactionType: 'labRadioTests',
                vatCharges: vatCharges? vatCharges : null,
                orderId: orderId? orderId: null,
                paymentGateway: 'moyasar',
                paymentFor: type? type: null,
                discountCoupon: discountCoupon? discountCoupon: null,
                discountCouponId:discountCouponId ? discountCouponId :null,
                ip: getPaymentData?.ip,
                labRadioId: labRadioId? labRadioId: null,
                testInfo: testInfo? testInfo: null,
                discountedAmount: discountedAmount? discountedAmount: 0,
                paymentId: paymentId? paymentId: null
            }
            const addData = new PurchaseHistory(addObject)
            await addData.save()
            
            return handleResponse(req, res, 200, {
                status: true,
                message: "Data saved successfully",
                body: null,
                errorCode: null,
            });
        } catch (error) {
            console.log(error, 'error');
            return handleResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Something went wrong!",
                errorCode: error.code,
            })
        }
    }

    async getAllPaymentHistory(req, res) {
        try {
            const { limit, page, status, patientId, searchText, fromDate, toDate } = req.query;
    
            // Build match conditions dynamically
            const matchStage = {};
            if (status && status !== 'all') matchStage.transactionType = status;
            if (mongoose.Types.ObjectId.isValid(patientId)) matchStage.forUser = new mongoose.Types.ObjectId(patientId);
            if (fromDate && toDate) matchStage.createdAt = { $gte: new Date(fromDate), $lte: new Date(toDate) };
            if (searchText)  matchStage["forUser.full_name"] = { $regex: new RegExp(escapeRegex(searchText), "i") };
    
            // Sorting logic
            let sort = req.query.sort;
            let sortingarray = {};
            
            if (sort && sort !== "undefined" && sort !== "") {
              const [key, order] = sort.split(":");
              let fieldToSort;
            
              switch (key) {
                case "patientName":
                  fieldToSort = "patientName";
                  break;
                case "paymentFor":
                  fieldToSort = "paymentFor";
                  break;
                case "patientMRN":
                  fieldToSort = "patientMRN";
                  break;
                case "transactionType":
                    fieldToSort = "transactionType";
                  break;
                case "amountPaid":
                  fieldToSort = "amountPaid"; // use numeric version
                  break;
                case "paymentMode":
                  fieldToSort = "paymentMode"; // use numeric version
                  break;
                default:
                  fieldToSort = "createdAt"; // fallback
              }
            
              sortingarray[fieldToSort] = Number(order); // 1 for asc, -1 for desc
            } else {
              sortingarray["createdAt"] = -1;
            }

    
            const pipeline = [
                { $match: matchStage },                 
                { 
                    $lookup: {
                        from: "portalusers",
                        localField: "forUser",
                        foreignField: "_id",
                        as: "forUser"
                    }
                },
                { $unwind: { path: "$forUser", preserveNullAndEmptyArrays: true } },
                { 
                    $lookup: {
                        from: "profileinfos",
                        localField: "forUser._id",
                        foreignField: "for_portal_user",
                        as: "profile"
                    }
                },
                { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
                { 
                    $project: { 
                        patientId: "$forUser._id",
                        patientName: "$forUser.full_name",
                        patientMRN: "$profile.mrn_number",
                        paymentFor:1,
                        transactionType: 1,
                        paymentMode: 1,
                        paymentType: 1,
                        amountPaid: 1,
                        status: 1,
                        createdAt: 1
                    }
                },
                { $sort: sortingarray },
                { 
                    $facet: {
                        metadata: [{ $count: "totalRecords" }],
                        data: [{ $skip: (page - 1) * limit }, { $limit: limit * 1}]
                    }
                }
            ];
    
            const result = await PurchaseHistory.aggregate(pipeline).allowDiskUse(true);
            const totalCount = result[0].metadata.length ? result[0].metadata[0].totalRecords : 0;
    
            return handleResponse(req, res, 200, {
                status: true,
                body: {
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: parseInt(page, 10),
                    totalRecords: totalCount,
                    result: result[0].data
                },
                message: "Successfully fetched payment history",
                errorCode: null
            });
    
        } catch (error) {
            console.error("Error fetching payment history:", error);
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Failed to fetch payment history list",
                errorCode: "INTERNAL_SERVER_ERROR"
            });
        }
    }
    

    async getPaymentDetailsById(req, res) {
        try {
            const { id } = req.query;               
    
            const findRecord = await PurchaseHistory.findById(id).lean();        
    
            if(findRecord){

                const patientData = await Profile_info.findOne({for_portal_user: findRecord.forUser})
                .select({ full_name_arabic: 1, mrn_number: 1,full_name: 1})                

                findRecord.patientData = patientData || null;
        
                return handleResponse(req, res, 200, {
                    status: true,
                    body: findRecord,
                    message: "Successfully fetched payment details",
                    errorCode: null
                });

            }else{

                return handleResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Payment details not found",
                    errorCode: "NOT_FOUND"
                });
            }
                
        } catch (error) {
            console.error("Error fetching payment details:", error);
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Failed to fetch payment details",
                errorCode: "INTERNAL_SERVER_ERROR"
            });
        }
    }

    async updatePurchaseHistory(req, res) {
        try {
            const { paymentId, refundedInfo } = req.body

            await PurchaseHistory.findOneAndUpdate(
                {
                    paymentId: paymentId,
                    status: 'paid'
                },
                {
                    $set: {
                        status: 'refunded',
                        refundedInfo: refundedInfo
                    }
                }
            )
          
            return handleResponse(req, res, 200, {
                status: true,
                message: "Payment refunded success",
                body: null,
                errorCode: null,
            });
        } catch (error) {
            console.log(error, "updatePurchaseHistory__error");
            return handleResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Something went wrong!",
                errorCode: error.code,
            })
        }
    }
    
}

module.exports = new PaymentController();