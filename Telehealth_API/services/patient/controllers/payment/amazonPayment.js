"use strict";

import { handleResponse1 } from "../../helpers/transmission";
import PurchaseHistory from "../../models/subscription/purchasehistory";
import { config } from "../../config/constants";
import Http from "../../helpers/httpservice"
import moment from "moment";
import axios from "axios";
import PortalUser from "../../models/portal_user";
import Profile_info from "../../models/profile_info";
import { generateToken } from "../../middleware/utils";
import https from 'https';
import fs from 'fs';
import path from 'path';

const crypto = require('crypto');

const { AMAZONPAY } = config
const httpService = new Http();

const generateInvoiceNumber = () => {
    const prefix = "INV";
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random
    return `${prefix}-${datePart}-${randomPart}`;
};

const savePaymentData = (getPaymentData, requestData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { subscriptionPlanId, forUser, planPrice, discountedAmount, vatCharges, discountCoupon, paymentType, isUpgrade } = requestData;

            const token = generateToken({ role: 'superadmin' });
            const headers = {
                Authorization: `Bearer ${token}`,
            };

            let subscriptionDetails = await httpService.getStaging('superadmin/get-subscription-plan-details', { id: subscriptionPlanId }, headers, 'superadminServiceUrl');

            if (subscriptionDetails) {
                const existingSubscription = subscriptionDetails.body;

                const params = {
                    discountedAmount,
                    subscriptionPlanId,
                    forUser,
                    vatCharges,
                    planPrice,
                    planDuration: existingSubscription?.plan_duration[0]?.duration,
                    discountCoupon,
                    trialDays: existingSubscription?.trial_period,
                    merchantReference: getPaymentData.merchant_reference,
                    paymentType
                };
                if (isUpgrade && isUpgrade !== "recurring") {
                    const getSubscriptionData = await PortalUser.findOne({ _id: { $eq: forUser } })
                        .select('subscriptionDetails')
                    const getSubscription = getSubscriptionData?.subscriptionDetails
                    let services = {
                        consultation: getSubscription?.services?.consultation || 0
                    }
                    for (const service of existingSubscription?.services) {
                        services[service?.name] = parseInt(services[service?.name]) + parseInt(service?.max_number)
                    }
                    params["services"] = services;
                }

                const currentDate = moment(new Date()).utc(); // Current date
                let endDate
                if (params?.trialDays) {
                    endDate = currentDate.clone().add(params?.trialDays, 'days').toISOString();
                } else {
                    const duration = params?.planDuration == "monthly" ? 30 : 365
                    endDate = currentDate.clone().add(duration, 'days').toISOString();
                }
                const period = {
                    start: currentDate.toISOString(),
                    end: endDate
                }

                if (isUpgrade && isUpgrade !== "recurring") {
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
                }

                const addObject = {
                    invoiceId: generateInvoiceNumber(),
                    invoiceUrl: null,
                    planPrice: params?.planPrice,
                    vatCharges: params?.vatCharges,
                    amountPaid: getPaymentData?.amount / 100,
                    discountedAmount: params?.discountedAmount,
                    paymentMode: "amazonpay",
                    paymentType: getPaymentData?.payment_option,
                    currencyCode: getPaymentData?.currency,
                    status: getPaymentData?.status == '14' ? "paid" : "failed",
                    forUser: params?.forUser,
                    period,
                    subscriptionPlanId: params?.subscriptionPlanId,
                    subscriptionStatus: getPaymentData?.status == '14' ? 'active' : null,
                    transactionType: 'subscription',
                    paymentGateway: 'amazon',
                    discountCoupon: params?.discountCoupon,
                    ip: getPaymentData?.customer_ip,
                    amazonResponse: getPaymentData
                }
                console.log(addObject, "saveData amazon pay");


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

                if (getPaymentData?.status == '14') {
                    const getDetails = await PortalUser.findOne({ _id: { $eq: params?.forUser } }).select('subscriptionDetails')
                    let updateObject = {
                        isPlanActive: true,
                        subscriptionPlanId: params?.subscriptionPlanId,
                        moyasarToken: null,
                        token_name: getPaymentData?.token_name,
                        agreement_id: getPaymentData?.agreement_id,
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
                            "subscriptionDetails.moyasarToken": null,
                            "subscriptionDetails.services": updateObject.services,
                            "subscriptionDetails.period": updateObject.period,
                            "subscriptionDetails.discountCoupon": updateObject.discountCoupon,
                            "subscriptionDetails.subscriptionDuration": updateObject.subscriptionDuration,
                            "subscriptionDetails.trialDays": updateObject.trialDays,
                            "subscriptionDetails.isPlanCancelled": false,
                            "subscriptionDetails.paymentRetried": 0,
                            "subscriptionDetails.token_name": updateObject.token_name,
                            "subscriptionDetails.agreement_id": updateObject.agreement_id,
                            "subscriptionDetails.paymentGateway": "amazon"
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

                    const getPatientName = await Profile_info.findOne({ for_portal_user: { $eq: params?.forUser } })
                        .select('full_name');

                    let requestBody = {
                        userId: params?.forUser,
                        userName: getPatientName?.full_name,
                        role: 'patient',
                        action: isUpgrade ? 'update' : 'create',
                        actionDescription: isUpgrade ? 'Subscription plan upgraded successfully' : `${getPatientName?.full_name} purchased new subscription plan.`,
                        metadata: params
                    };

                    await httpService.postStaging(
                        "superadmin/add-logs",
                        requestBody,
                        {},
                        "superadminServiceUrl"
                    );

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

            }
            resolve(true)
        } catch (error) {
            console.log(error, "Amazon pay save data error ")
            reject(error)
        }
    })
}

function randomReference(prefix) {
    return prefix + Math.floor(100000 + Math.random() * 900000);
}

// Helper to calculate signature
function calculateSignature(data, passphrase) {
    let shaString = '';
    const sortedKeys = Object.keys(data).sort();
    for (const key of sortedKeys) {
        const value = data[key];
        if (typeof value !== 'object') {
            shaString += `${key}=${value}`;
        } else {
            shaString += `${key}={`;
            const subKeys = Object.keys(value);
            subKeys.forEach((subKey, index) => {
                shaString += `${subKey}=${value[subKey]}`;
                if (subKey !== 'apple_type' && subKey !== 'apple_publicKeyHash' && index !== subKeys.length - 1) {
                    shaString += ', ';
                }
            });
            shaString += '}';
        }
    }
    shaString = `${passphrase}${shaString}${passphrase}`;

    return crypto.createHash('sha256').update(shaString).digest('hex');
}

const resetServiceData = (services) => {
    const resetServices = {};
    for (const service in services) {
        resetServices[service] = 0;
    }
    return resetServices;
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
        };

        const getDetails = await PortalUser.findOne({ _id: { $eq: user?._id } }).select('email')

        const baseUrl = AMAZONPAY.live_payment_process_api;
        const merchant_reference = randomReference('RX');

        const requestData = {
            command: 'PURCHASE',
            digital_wallet: 'APPLE_PAY',
            access_code: AMAZONPAY.access_code,
            merchant_identifier: AMAZONPAY.merchant_identifier,
            merchant_reference,
            language: 'en',
            amount: amount * 100,
            currency: 'SAR',
            customer_email: getDetails?.email,
            eci: 'RECURRING',
            recurring_mode: 'UNSCHEDULED',
            token_name: user?.subscriptionDetails?.token_name,
            agreement_id: user?.subscriptionDetails?.agreement_id
        };
        const signature = calculateSignature(requestData, AMAZONPAY.sha_request_phrase);
        requestData.signature = signature;

        const response = await axios.post(baseUrl, requestData);
        if (response?.data) {
            const params = {
                discountedAmount: metadata.discountedAmount,
                subscriptionPlanId: metadata.subscriptionPlanId,
                forUser: metadata.forUser,
                vatCharges: vatCharges,
                planPrice: metadata.planPrice,
                planDuration: user?.subscriptionDetails?.subscriptionDuration,
                isUpgrade: "recurring",
                discountCoupon,
                paymentType: response?.data?.payment_option
            };

            savePaymentData(response.data, params);
        }

    } catch (error) {
        console.error(`Error processing payment for user ${user?._id}:`, error);
    }
};

class AmazonPaymentController {
    /** April - 28 - Apple Pay Start*/
    async validateMerchant(req, res) {
        const { validationURL } = req.body;
        try {
            const requestData = {
                merchantIdentifier: 'merchant.com.test_papp',
                displayName: 'test_p',
                initiative: 'web',
                initiativeContext: AMAZONPAY.domain
            };

            const keyPath = path.join(__dirname, 'ssl_keys', '../../../helpers/newfile.key.pem');
            const certPath = path.join(__dirname, 'ssl_keys', '../../../helpers/certificate.pem');

            // Create HTTPS Agent
            const agent = new https.Agent({
                cert: fs.readFileSync(certPath),
                key: fs.readFileSync(keyPath),
            });
            // POST Request
            const response = await axios.post(validationURL, requestData, {
                httpsAgent: agent,
            });

            console.log(response?.data, "validateMerchant");
            return handleResponse1(req, res, 200, {
                status: true,
                body: response.data,
                message: "Merchant validation success",
                errorCode: null,
            });
        } catch (error) {
            console.error('Error validating merchant:', error);
            return handleResponse1(req, res, 500, {
                status: false,
                body: null,
                message: error.message,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async processPayment(req, res) {
        try {
            const { token, email, amount } = req.body;
            const baseUrl = AMAZONPAY.live_payment_process_api;
            const appleData = token?.paymentData.data;
            const appleHeader = token?.paymentData.header;
            const appleSignature = token?.paymentData.signature;
            const applePaymentMethod = token?.paymentMethod;

            const merchantReference = randomReference('SX');
            const agreementId = randomReference('SU');

            const requestData = {
                command: 'PURCHASE',
                digital_wallet: 'APPLE_PAY',
                access_code: AMAZONPAY.access_code,
                merchant_identifier: AMAZONPAY.merchant_identifier,
                language: 'en',
                customer_email: email,
                amount: Math.round(parseFloat(amount) * 100),
                currency: 'SAR',
                merchant_reference: merchantReference,
                agreement_id: agreementId,
                recurring_mode: 'UNSCHEDULED',
                customer_ip: req.ip,
                apple_data: appleData,
                apple_signature: appleSignature,
                apple_header: {
                    apple_transactionId: appleHeader?.transactionId,
                    apple_ephemeralPublicKey: appleHeader?.ephemeralPublicKey,
                    apple_publicKeyHash: appleHeader?.publicKeyHash
                },
                apple_paymentMethod: {
                    apple_displayName: applePaymentMethod?.displayName,
                    apple_network: applePaymentMethod?.network,
                    apple_type: applePaymentMethod?.type
                }
            };

            const signature = calculateSignature(requestData, AMAZONPAY.sha_request_phrase);
            requestData.signature = signature;
            console.log(requestData, "requestData");
            const response = await axios.post(baseUrl, requestData);
            console.log(response.data, "responseData>>>");

            savePaymentData(response.data, req.body);

            return handleResponse1(req, res, 200, {
                status: true,
                body: response.data,
                message: response.data.response_message,
                errorCode: null,
            });
        } catch (error) {
            console.error('Error processing Apple Pay:', error);
            return handleResponse1(req, res, 500, {
                status: false,
                body: null,
                message: error.message,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async recurringCheck() {
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
                            if (!isRetried && user?.subscriptionDetails?.paymentGateway === "amazon" && !user?.subscriptionDetails?.isPlanCancelled) {
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

}

module.exports = new AmazonPaymentController();