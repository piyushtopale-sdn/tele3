"use strict";

import { handleResponse } from "../../helpers/transmission";
import PurchaseHistory from "../../models/subscription/purchasehistory";
import { config } from "../../config/constants";
import Http from "../../helpers/httpservice"
import moment from "moment";
import axios from "axios";
import PortalUser from "../../models/portal_user";
import Profile_info from "../../models/profile_info";
import { generateToken } from "../../middleware/utils";
const crypto = require('crypto');

const { AMAZONPAY } = config
const httpService = new Http();

// Generate SHA-256 Signature
const generateSignature = (data, phrase) => {
    const stringToHash = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('');
    console.log(`${phrase}${stringToHash}${phrase}`);
    return crypto.createHash('sha256').update(`${phrase}${stringToHash}${phrase}`).digest('hex');
};

// Verify SHA-256 Signature
const verifySignature = (responseData, responsePhrase) => {
    const sortedKeys = Object.keys(responseData).sort();
    let signatureString = responsePhrase;
    sortedKeys.forEach(key => {
        if (key !== 'signature') { // Exclude the signature itself
            signatureString += `${key}=${responseData[key]}`;
        }
    });
    signatureString += responsePhrase;

    const expectedSignature = crypto.createHash('sha256').update(signatureString).digest('hex');
    return expectedSignature === responseData.signature;
};

// Verify SHA-256 Signature
const fetchPaymentDetails = (merchantReference) => {
    const payload = {
        merchant_identifier: AMAZONPAY.merchant_identifier,
        access_code: AMAZONPAY.access_code,
        command: 'INQUIRY',
        merchant_reference: merchantReference,
        language: 'en'
    };
    return new Promise(async (resolve, reject) => {
        try {
            // Calculate the signature
            const signatureString = `SHA-256:${payload.merchant_identifier}:${AMAZONPAY.sha_request_phrase}:${payload.access_code}:${payload.command}:${payload.merchant_reference}:en`;
            const signature = crypto.createHash('sha256').update(signatureString).digest('hex');
            payload.signature = signature;

            const response = await axios.post(AMAZONPAY.test_payment_process_api, payload, {
                headers: { 'Content-Type': 'application/json' }
            });
            resolve(response.data)
        } catch (error) {
            console.log(error, "fetchPaymentDetails>>>>>>>>>")
            reject(error);
        }
    })
}

// Save payment data
const saveData = (getPaymentData, existingSubscription, params) => {
    return new Promise(async (resolve, reject) => {
        try {
            const currentDate = moment(new Date()).utc(); // Current date
            let endDate
            if (params?.trialDays) {
                endDate = currentDate.add(params?.trialDays, 'days').toISOString();
            } else {
                const duration = params?.planDuration == "monthly" ? 30 : 365
                endDate = currentDate.add(duration, 'days').toISOString();
            }
            const period = {
                start: currentDate,
                end: endDate
            }
            const addObject = {
                invoiceId: null,
                invoiceUrl: null,
                planPrice: params?.planPrice,
                vatCharges: params?.vatCharges,
                amountPaid: getPaymentData?.amount,
                discountedAmount: params?.discountedAmount,
                paymentMode: "amazonpay",
                paymentType: params?.paymentType,
                currencyCode: params?.currencyCode,
                status: "paid",
                forUser: params?.forUser,
                period,
                subscriptionPlanId: params?.subscriptionPlanId,
                subscriptionStatus: params?.status == 'paid' ? 'active' : null,
                transactionType: 'subscription',
                paymentGateway: 'amazon',
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
                        "subscriptionDetails.paymentRetried": 0
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
            console.log(error, "saveData amazon pay ")
            reject(error)
        }
    })
}

// const payment = () => {
// fetch('https://sbcheckout.payfort.com/FortAPI/paymentPage', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/x-www-form-urlencoded'
//   },
//   body: `merchant_identifier=OguwiAEM&
//          access_code=mLIoC7o8DticuCwZD8AG&
//          merchant_reference=SUBSCRIPTION_1740568817420&
//          amount=1000&
//          currency=SAR&
//          language=en&
//          command=AUTHORIZATION&
//          customer_email=test@yopmail.com&
//          return_url=https://dev.terstapp.com&
//          signature=c790c3ed329e75a7f7ef3f28ad14fa846ab3b2a425caa6ab10c932cbdc838944`
// }).then(response => response.text())
//   .then(html => {
//     console.log(html, "I am here>>>>>>>>>>>>");
//   }).catch(error => console.error('Error:', error));
// }

class AmazonPaymentController {
    async initiatePayment(req, res) {

        try {
            const { amount, customerEmail } = req.body;

            const requestData = {
                merchant_identifier: AMAZONPAY.merchant_identifier,
                access_code: AMAZONPAY.access_code,
                merchant_reference: `SUBSCRIPTION_${Date.now()}`,
                amount: amount,
                currency: "SAR",
                language: 'en',
                command: 'AUTHORIZATION',
                customer_email: customerEmail,
                return_url: 'dev.terstapp.com',
                tokenization: 'Y',       // Request Tokenization
                remember_me: 'Y'        // Ask customer to save payment method
            };

            requestData.signature = generateSignature(requestData, AMAZONPAY.sha_request_phrase);

            // Build payment URL
            const paymentPageUrl = `${AMAZONPAY.test_payment_page_url}?${Object.keys(requestData)
                .map(key => `${key}=${encodeURIComponent(requestData[key])}`)
                .join('&')}`;

            return handleResponse(req, res, 200, {
                status: true,
                body: { paymentPageUrl },
                message: "Successfully generated payment url",
                errorCode: null,
            });
        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Failed to initiate payment",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async verifyPayment(req, res) {

        try {
            const { paymentResponse, paymentId, discountedAmount, subscriptionPlanId, forUser, vatCharges, planPrice, planDuration, token, discountCoupon } = req.body
            console.log(req.body, "verifyPayment");
            // Verify the response signature
            // const isValid = verifySignature(paymentResponse, AMAZONPAY.sha_response_phrase);
            // if (!isValid) {
            //     return handleResponse(req, res, 200, {
            //         status: false,
            //         body: null,
            //         message: "Invalid Signature",
            //         errorCode: null,
            //     });
            // }

            // Check payment status
            switch (paymentResponse.status) {
                case '14':
                    console.log('Payment Successful:', paymentResponse);

                    const headers = {
                        Authorization: req.headers["authorization"],
                    };

                    // const getPaymentDataByReference = await fetchPaymentDetails(paymentResponse.merchant_reference);
                    // console.log("getPaymentDataByReference>>>>>>>>>>>>>>", getPaymentDataByReference);
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
                    const existingSubscription = subscriptionDetails.body;
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
                        merchantReference: paymentResponse.merchant_reference
                    }

                    await saveData(paymentResponse, existingSubscription, params);

                    const getPatientName = await Profile_info.findOne({ for_portal_user: { $eq: params?.forUser } })
                        .select('full_name')

                    let requestBody = {
                        userId: params?.forUser,
                        userName: getPatientName?.full_name,
                        role: 'patient',
                        action: `create`,
                        actionDescription: `${getPatientName?.full_name} purchased new subscription plan.`,
                        metadata: params
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

                // Store transaction details in DB
                case '02':
                    console.log('Payment Authorization Failed:', paymentResponse);
                    return handleResponse(req, res, 200, {
                        status: false,
                        body: null,
                        message: "Payment Authorization Failed",
                        errorCode: "INTERNAL_SERVER_ERROR",
                    });
                case '04':
                    console.log('Payment Cancelled:', paymentResponse);
                    return handleResponse(req, res, 200, {
                        status: false,
                        body: null,
                        message: "Payment Cancelled",
                        errorCode: "INTERNAL_SERVER_ERROR",
                    });
                case '07':
                    console.log('Payment Pending', paymentResponse);
                    return handleResponse(req, res, 200, {
                        status: false,
                        body: null,
                        message: "Payment Pending:",
                        errorCode: "INTERNAL_SERVER_ERROR",
                    });
                default:
                    console.log('Unknown Status:', paymentResponse);
                    return handleResponse(req, res, 200, {
                        status: false,
                        body: null,
                        message: "Failed to process payment",
                        errorCode: "INTERNAL_SERVER_ERROR",
                    });
            }

        } catch (error) {
            console.log('Failed to process payment Catch:', error);
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Failed to process payment",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async chargeRecurringPayment() {
        const token = generateToken({ role: 'superadmin' });
        const headers = {
            Authorization: `Bearer ${token}`,
        };
        try {
            const requestData = {
                merchant_identifier: AMAZONPAY.merchant_identifier,
                access_code: AMAZONPAY.access_code,
                merchant_reference: `SUBSCRIPTION_${Date.now()}`,
                amount: "1000",
                currency: "SAR",
                language: 'en',
                command: 'PURCHASE',
                token_name: 'YOUR_SAVED_TOKEN_NAME',
                customer_email: "test@yopmail.com",
                // return_url: 'dev.terstapp.com',
                // token_name: token_payment,
                // tokenization: 'Y',         // Request Tokenization
                // remember_me: 'Y'           // Ask customer to save payment method
            };

            requestData.signature = generateSignature(requestData, AMAZONPAY.sha_request_phrase);

            // Make the recurring payment request
            const response = await axios.post(AMAZONPAY.test_payment_process_api, requestData);

            // Handle response
            if (response.data.response_code === '14000') {
                console.log('Recurring Payment Successful:', response.data);
                return handleResponse(req, res, 200, {
                    status: true,
                    body: response.data,
                    message: "Recurring Payment Successful",
                    errorCode: null,
                });
            } else {
                console.log('Recurring Payment Failed:', response.data);
                return handleResponse(req, res, 200, {
                    status: false,
                    body: response.data,
                    message: "Recurring Payment Failed",
                    errorCode: null,
                });
            }


        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Failed to process payment",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    // Get SDK Token Endpoint
    async getSDKToken(req, res) {
        try {
            const { device_id } = req.body;
            const requestData = {
                service_command: "SDK_TOKEN",
                merchant_identifier: AMAZONPAY.merchant_identifier,
                access_code: AMAZONPAY.access_code,
                language: "en",
                device_id: device_id,
            };

            // Generate Signature
            requestData.signature = generateSignature(requestData, AMAZONPAY.sha_request_phrase);
            // Send POST request to get SDK Token
            const response = await axios.post(AMAZONPAY.test_payment_process_api, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            /** 00: Operation in progress
                02: Order stored
                04: Authorization failed
                06: Capture failed
                08: Refund failed
                10: Authorization voided
                12: Incomplete
                14: Transaction expired
                16: 3-D Secure check failed
                18: Tokenization failed
                20: Purchase failed
                22: Success */

            if (response?.data?.status === '22') {
                // return res.status(200).json({ sdk_token: response.data.sdk_token });
                return handleResponse(req, res, 200, {
                    status: true,
                    body: response?.data,
                    message: "Successfully get generated token",
                    errorCode: null,
                });
            } else {
                // console.error("Failed to get SDK token:", response.data);
                return handleResponse(req, res, 200, {
                    status: false,
                    body: response?.data,
                    message: "Failed to get SDK token",
                    errorCode: null,
                });
            }
        } catch (error) {
            console.error("Error in SDK Token Request:", error);
            // return res.status(500).json({ error: "Internal Server Error" });
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Error in SDK Token Request",
                errorCode: null,
            });
        }
    }

    // Subscription expiry cron - INPROGRESS
    async checkSubscriptionExpiryAmazon() {
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
                                // ['subscriptionDetails.services']: resetServiceData(user?.subscriptionDetails?.services),
                                // ['subscriptionDetails.addonServices']: resetServiceData(user?.subscriptionDetails?.addonServices),
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
                                // await processSubscriptionPayment(user, headers);
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

    /** Mar 10 Start */
    async initiateApplePay(req, res) {
        try {
            const { amount, customerEmail, apple_data, apple_header, apple_paymentMethod, apple_signature } = req.body;
            //Send request to apple pay
            //Below details we will get

            const requestData = {
                "apple_data": apple_data,
                "apple_header": {
                    "apple_ephemeralPublicKey": apple_header.apple_ephemeralPublicKey,
                    "apple_publicKeyHash": apple_header.apple_publicKeyHash,
                    "apple_transactionId": apple_header.apple_transactionId
                },
                "apple_paymentMethod": {
                    "apple_displayName": apple_paymentMethod.apple_displayName,
                    "apple_network": apple_paymentMethod.apple_network,
                    "apple_type": apple_paymentMethod.apple_type
                },
                "apple_signature": apple_signature,
                "digital_wallet": "APPLE_PAY",
                "command": "PURCHASE",
                "amount": amount,
                "currency": "SAR",
                "customer_email": customerEmail,
                "access_code": AMAZONPAY.access_code,
                "merchant_identifier": AMAZONPAY.merchant_identifier,
                "merchant_reference": `SUB_${Date.now()}`,
                "language": "en",
                "recurring_mode": "UNSCHEDULED"
            };

            // const signatureGenerate = {
            //     "command": "AUTHORIZATION",
            //     "amount": "1000",
            //     "currency": "SAR",
            //     "customer_email": "test123@yopmail.com",
            //     "access_code": AMAZONPAY.access_code,
            //     "merchant_identifier": AMAZONPAY.merchant_identifier,
            //     "merchant_reference": `SUB_${Date.now()}`,
            //     "language": "en",
            //     "order_description": "lab order"
            //  };

            requestData.signature = generateSignature(requestData, AMAZONPAY.sha_request_phrase);
            // requestData.signature1 = generateSignature(requestData, AMAZONPAY.sha_request_phrase);
          
            const response = await axios.post(AMAZONPAY.test_payment_process_api, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return handleResponse(req, res, 200, {
                status: true,
                body: response?.data,
                message: "Payment Initiated Successfully",
                errorCode: null,
            });
        } catch (error) {
            console.log(error, "Payment Initiated Failed");
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Failed to initiate payment",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async recurringApplePay(req, res) {
        try {
            const { amount, customerEmail } = req.body;

            const requestData = {
                "command": "PURCHASE",
                "access_code": AMAZONPAY.access_code,
                "merchant_identifier": AMAZONPAY.merchant_identifier,
                "merchant_reference": `SUB_${Date.now()}`,
                "amount": "1000",
                "currency": "SAR",
                "language": "en",
                "customer_email": "XX",
                "eci": "RECURRING",
                "token_name": "XX",
                "signature": "XX",
                "digital_wallet": "APPLE_PAY",
                "recurring_mode": "UNSCHEDULED",
                "agreement_id": "MCC6615670323",
            };

            // const signatureGenerate = {
            //     "command": "AUTHORIZATION",
            //     "amount": "1000",
            //     "currency": "SAR",
            //     "customer_email": "test123@yopmail.com",
            //     "access_code": AMAZONPAY.access_code,
            //     "merchant_identifier": AMAZONPAY.merchant_identifier,
            //     "merchant_reference": `SUB_${Date.now()}`,
            //     "language": "en",
            //     "order_description": "lab order"
            //  };

            requestData.signature = generateSignature(requestData, AMAZONPAY.sha_request_phrase);
            // requestData.signature1 = generateSignature(requestData, AMAZONPAY.sha_request_phrase);
         
            const response = await axios.post(AMAZONPAY.test_payment_process_api, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return handleResponse(req, res, 200, {
                status: true,
                body: response?.data,
                message: "Payment Initiated Successfully",
                errorCode: null,
            });
        } catch (error) {
            console.log(error, "Payment Initiated Failed");
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Failed to initiate payment",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async fetchSignatureDetails(req, res) {
        try {
            const { amount, currency, language, customerEmail  } = req.body;
            let merchantRef = `SUB_${Date.now()}`;
            let data = {
                "access_code": AMAZONPAY.access_code,
                "merchant_identifier": AMAZONPAY.merchant_identifier,
                "merchant_reference": merchantRef,
                "amount": amount,
                "currency": currency,
                "language": language,
                "customer_email": customerEmail
            };
            const signatureeithApplePay = {
                "command": "PURCHASE",
                "access_code": AMAZONPAY.access_code,
                "merchant_identifier": AMAZONPAY.merchant_identifier,
                "merchant_reference": merchantRef,
                "amount": amount,
                "currency": currency,
                "language": language,
                "customer_email": customerEmail,
                "payment_option": "APPLEPAY"
             };
             const signatureGenerate = {
                "command": "PURCHASE",
                "access_code": AMAZONPAY.access_code,
                "merchant_identifier": AMAZONPAY.merchant_identifier,
                "merchant_reference": merchantRef,
                "amount": amount,
                "currency": currency,
                "language": language,
                "customer_email": customerEmail
             };

             data.signature1 = generateSignature(signatureeithApplePay, AMAZONPAY.sha_request_phrase);
             data.signature = generateSignature(signatureGenerate, AMAZONPAY.sha_request_phrase);

            return handleResponse(req, res, 200, {
                status: true,
                body: data,
                message: "Details are fetch successfully",
                errorCode: null,
            });
        } catch (error) {
            console.log(error, "Failed to fetch details");
            return handleResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Failed to fetch details",
                errorCode: null,
            });
        }
    }
    /** Mar 10 End */

}

module.exports = new AmazonPaymentController();