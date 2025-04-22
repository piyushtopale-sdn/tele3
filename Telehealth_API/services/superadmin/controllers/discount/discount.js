import { handleResponse } from "../../helpers/transmission";
import DiscountCoupon from "../../models/superadmin/discount.model";
import { config, messages } from "../../config/constants";
import { generateRandomString } from "../../middleware/utils";
import mongoose from "mongoose";
import SubscriptionPlan from "../../models/subscription/subscriptionplans";
import Http from "../../helpers/httpservice"
const httpService = new Http();

class DiscountManagement {
    async createDiscountCoupon(req, res) {
        try {
            const {
                couponCode,
                description,
                type,
                percentOff,
                amountOff,
                duration,
                numberOfMonths,
                redemptionLimit,
                redeemBefore,
                lab,
                isLabCoupon
            } = req.body

            const getExistingCoupon = await DiscountCoupon.find({ couponCode, isDeleted: false, status: 'active' })
            if (getExistingCoupon.length > 0) {
                return handleResponse(req, res, 500, {
                    status: false,
                    body: null,
                    message: `${couponCode} this coupon is already available`,
                    errorCode: "INTERNAL_SERVER_ERROR",
                })
            }

            if (type == "PERCENTAGE" && !(percentOff > 0 && percentOff <= 100)) {
                return handleResponse(req, res, 500, {
                    status: false,
                    body: null,
                    message: "Percentage should not be more than 100% and less than 0%",
                    errorCode: "INTERNAL_SERVER_ERROR",
                })
            }
            if (duration == "MULTIPLE_MONTH" && numberOfMonths <= 0) {
                return handleResponse(req, res, 500, {
                    status: false,
                    body: null,
                    message: "Duration month should be less than 0",
                    errorCode: "INTERNAL_SERVER_ERROR",
                })
            }

            const dataObject = {
                couponCode,
                description,
                type,
                duration,
                percentOff,
                amountOff,
                numberOfMonths,
                redemptionLimit,
                redeemBefore,
                isLabCoupon,
            }

            if (type == 'PERCENTAGE') {
                dataObject['percent_off'] = percentOff
            }
            if (type == 'FIXED_COST') {
                dataObject['amount_off'] = amountOff
            }
            // Include lab field if provided
            if (lab && Array.isArray(lab) && lab.length > 0) {
                dataObject.lab = lab;
            }

            const saveData = new DiscountCoupon(dataObject)
            await saveData.save()
            return handleResponse(req, res, 200, {
                status: true,
                body: null,
                message: "Discount created successfully",
                errorCode: null,
            });
        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Something went wrong",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        }
    }
    async deleteDiscountCoupon(req, res) {
        try {
            const discountId = req.params.id
            let getCoupon = await DiscountCoupon.findOne(
                {
                    _id: discountId,
                    isDeleted: false
                }
            );
            if (!getCoupon) {
                return handleResponse(req, res, 200, {
                    status: false,
                    message: "Discount coupon not exist",
                    body: null,
                    errorCode: null,
                });
            }
            await DiscountCoupon.findOneAndUpdate(
                {
                    _id: discountId
                },
                { isDeleted: true },
            );

            return handleResponse(req, res, 200, {
                status: true,
                body: null,
                message: "Discount coupon deleted successfully",
                errorCode: null,
            });
        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Something went wrong",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        }
    }
    async generateCoupon(req, res) {
        try {
            let newCoupon = generateRandomString(11)
            let isCouponExist = false
            do {
                const getExistingCoupon = await DiscountCoupon.find({ couponCode: newCoupon, isDeleted: false, status: 'active' })
                if (getExistingCoupon.length > 0) {
                    newCoupon = generateRandomString(11)
                    isCouponExist = true
                } else {
                    isCouponExist = false
                }
            } while (isCouponExist);
            return handleResponse(req, res, 200, {
                status: true,
                message: "Coupon code generated successfully",
                body: {
                    coupon: newCoupon
                },
                errorCode: null,
            })
        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Something went wrong",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        }
    }
    async getCouponBySubscription(req, res) {
        try {
            const id = req.params.id
            const getActiveSubscriptionPlan = await SubscriptionPlan.find({ _id: { $eq: id }, is_deleted: false, is_activated: true })
            if (getActiveSubscriptionPlan.length == 0) {
                return handleResponse(req, res, 500, {
                    status: false,
                    body: null,
                    message: "Subscription plan not found",
                    errorCode: "INTERNAL_SERVER_ERROR",
                })
            }
            const getDiscountCoupon = await DiscountCoupon.find({ subscriptionPlanId: { $eq: id }, isDeleted: false, status: 'active' })
            return handleResponse(req, res, 200, {
                status: true,
                message: "Data fetched successfully",
                body: getDiscountCoupon,
                errorCode: null,
            })
        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Something went wrong",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        }
    }
    async getAllCoupons(req, res) {
        try {
            const {
                searchText,
                status,
                sortByCreated,
                page,
                limit,
            } = req.query
            let searchText_filter = [{}]

            if (searchText != "") {
                searchText_filter = [
                    { couponCode: { $regex: searchText || '', $options: "i" } },
                    { plan_name: { $regex: searchText || '', $options: "i" } },
                ]
            }
            let status_filter = {}
            if (status && status !== 'all') {
                status_filter = {
                    ['status']: status,
                }
            }

            const pipeline = [
                {
                    $match: {
                        isDeleted: false,
                        $or: searchText_filter,
                        $and: [
                            status_filter,
                            {
                                $or: [
                                    { isLabCoupon: false },
                                    { isLabCoupon: { $exists: false } }
                                ]
                            }
                        ]
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        couponCode: { $first: "$couponCode" },
                        description: { $first: "$description" },
                        type: { $first: "$type" },
                        duration: { $first: "$duration" },
                        amountOff: { $first: "$amountOff" },
                        percentOff: { $first: "$percentOff" },
                        numberOfMonths: { $first: "$numberOfMonths" },
                        redeemBefore: { $first: "$redeemBefore" },
                        isLabCoupon: { $first: "$isLabCoupon" },
                        status: { $first: "$status" },
                        isDeleted: { $first: "$isDeleted" },
                        createdAt: { $first: "$createdAt" },
                    }
                },
            ]

            pipeline.push(
                {
                    $sort: {
                        createdAt: sortByCreated == "OLDER" ? 1 : -1
                    }
                },
                {
                    $facet: {
                        totalCount: [
                            {
                                $count: 'count'
                            }
                        ],
                        paginatedResults: limit != 0 ? [
                            { $skip: searchText ? 0 : (page - 1) * limit },
                            { $limit: limit * 1 }
                        ] : [{ $skip: 0 }]

                    }
                }
            )

            const result = await DiscountCoupon.aggregate(pipeline);
            let totalCount = 0
            if (result[0].totalCount.length > 0) {
                totalCount = result[0].totalCount[0].count
            }
            return handleResponse(req, res, 200, {
                status: true,
                message: "data fetched successfully",
                body: {
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: page,
                    totalRecords: totalCount,
                    result: result[0].paginatedResults
                },
                errorCode: null,
            })
        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Something went wrong",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        }
    }

    async getAllCouponsLab(req, res) {
        try {
            const { searchText, status, sortByCreated, page, limit, selectedLabId } = req.query;

            const searchText_filter = searchText
                ? [
                    { couponCode: { $regex: searchText, $options: "i" } },
                    { plan_name: { $regex: searchText, $options: "i" } },
                ]
                : [];

            const status_filter = status && status !== 'all' ? { status } : {};

            const lab_filter = selectedLabId && selectedLabId !== "null"
                ? { lab: { $in: [mongoose.Types.ObjectId(selectedLabId)] } }
                : {};

            const pipeline = [
                {
                    $match: {
                        isDeleted: false,
                        isLabCoupon: true,
                        ...(searchText_filter.length > 0 ? { $or: searchText_filter } : {}),
                        ...status_filter,
                        ...lab_filter,
                    },
                },
                {
                    $group: {
                        _id: "$_id",
                        couponCode: { $first: "$couponCode" },
                        description: { $first: "$description" },
                        type: { $first: "$type" },
                        duration: { $first: "$duration" },
                        amountOff: { $first: "$amountOff" },
                        percentOff: { $first: "$percentOff" },
                        numberOfMonths: { $first: "$numberOfMonths" },
                        redeemBefore: { $first: "$redeemBefore" },
                        lab: { $first: "$lab" },
                        isLabCoupon: { $first: "$isLabCoupon" },
                        status: { $first: "$status" },
                        createdAt: { $first: "$createdAt" },
                    },
                },
                {
                    $sort: {
                        createdAt: sortByCreated === "OLDER" ? 1 : -1,
                    },
                },
                {
                    $facet: {
                        totalCount: [{ $count: 'count' }],
                        paginatedResults: limit > 0
                            ? [{ $skip: (parseInt(page) - 1) * parseInt(limit) }, { $limit: parseInt(limit) }]
                            : [{ $skip: 0 }],
                    },
                },
            ];

            const result = await DiscountCoupon.aggregate(pipeline);
            const totalCount = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;

            return handleResponse(req, res, 200, {
                status: true,
                message: "Data fetched successfully",
                body: {
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: parseInt(page),
                    totalRecords: totalCount,
                    result: result[0].paginatedResults,
                },
                errorCode: null,
            });
        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Something went wrong",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async validateDiscountCoupon(req, res) {
        try {
            let { couponCode, subscriptionPlanId, duration, patientId } = req.query
            const headers = {
                Authorization: req.headers["authorization"],
            };
            couponCode = couponCode ? couponCode.toUpperCase() : couponCode;
            const getExistingCoupon = await DiscountCoupon.find({ couponCode, isDeleted: false, status: 'active' })
            if (getExistingCoupon.length === 0) {
                return handleResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: messages.discountCodeUnavailable.en,
                    messageArabic: messages.discountCodeUnavailable.ar,
                    errorCode: null,
                })
            }
            const redemptionDate = new Date(getExistingCoupon[0]?.redeemBefore)
            const currentDate = new Date()
            if (redemptionDate.getTime() < currentDate.getTime()) {
                return handleResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: messages.discountExpired.en,
                    messageArabic: messages.discountExpired.ar,
                    errorCode: null,
                })
            }
            const getCouponDuration = getExistingCoupon[0]?.duration
            const multipleMonth = getExistingCoupon[0]?.numberOfMonths
            if (getCouponDuration == 'ONCE' || getCouponDuration == 'MULTIPLE_MONTH') {
                //Check how many times customer can use coupon code
                const getData = await httpService.getStaging(`patient/get-patient-subscription-details/${patientId}`, {}, headers, 'patientServiceUrl');
                if (!getData.status) {
                    return handleResponse(req, res, 500, {
                        status: false,
                        body: null,
                        message: messages.discountCodeUnavailable.en,
                        messageArabic: messages.discountCodeUnavailable.ar,
                        errorCode: null,
                    })
                }
                const subscriptionDetails = getData?.data?.subscriptionDetails?.subscriptionDetails
                if (subscriptionDetails?.discountCoupon && subscriptionDetails?.discountCoupon == couponCode && getCouponDuration == 'ONCE' && subscriptionDetails?.discountUsedCount == 1) {
                    return handleResponse(req, res, 200, {
                        status: false,
                        body: null,
                        message: messages.discountCodeUnavailable.en,
                        messageArabic: messages.discountCodeUnavailable.ar,
                        errorCode: "INTERNAL_SERVER_ERROR",
                    })
                }
                if (subscriptionDetails?.discountCoupon && subscriptionDetails?.discountCoupon == couponCode && getCouponDuration == 'MULTIPLE_MONTH' && subscriptionDetails?.discountUsedCount >= multipleMonth) {
                    return handleResponse(req, res, 200, {
                        status: false,
                        body: null,
                        message: messages.discountCodeUnavailable.en,
                        messageArabic: messages.discountCodeUnavailable.ar,
                        errorCode: "INTERNAL_SERVER_ERROR",
                    })
                }
            }

            const getSubscription = await SubscriptionPlan.findById(subscriptionPlanId)
            const getPlanDuration = getSubscription?.plan_duration.filter(val => val.duration == duration)
            if (!getSubscription && getPlanDuration.length == 0) {
                return handleResponse(req, res, 500, {
                    status: false,
                    body: null,
                    message: `Invalid subscription plan`,
                    errorCode: "INTERNAL_SERVER_ERROR",
                })
            }
            const subscriptionPrice = getPlanDuration[0]?.price
            let discountAmount = 0
            let finalAmount = subscriptionPrice
            if (getExistingCoupon[0]?.type == "PERCENTAGE") {
                const percentage = getExistingCoupon[0]?.percentOff
                discountAmount = subscriptionPrice * (percentage / 100)
                finalAmount = subscriptionPrice - discountAmount
            }
            if (getExistingCoupon[0]?.type == "FIXED_COST") {
                const ammount = getExistingCoupon[0]?.amountOff
                discountAmount = ammount
                const amount = subscriptionPrice - ammount
                finalAmount = amount <= 0 ? 0 : amount
            }

            return handleResponse(req, res, 200, {
                status: true,
                message: messages.appliedCoupon.en,
                messageArabic: messages.appliedCoupon.ar,
                body: {
                    coupon: getExistingCoupon[0]?.couponCode,
                    priceAfterDiscount: {
                        discount: discountAmount.toFixed(2),
                        total: parseFloat(subscriptionPrice).toFixed(2),
                        finalAmount: finalAmount.toFixed(2),
                    }
                },
                errorCode: null,
            })
        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Something went wrong",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        }
    }

    async validateDiscountCouponLabRadio(req, res) {
        try {
            let { couponCode, amount, labradioId } = req.query;
            //** couponCode - Applied Coupon Code, amount - lab test amount*/
            couponCode = couponCode ? couponCode.toUpperCase() : couponCode;
            const getExistingCoupon = await DiscountCoupon.find({ couponCode, isDeleted: false, status: 'active', isLabCoupon: true, lab: { $elemMatch: { $eq: labradioId } } }) 
            if (getExistingCoupon.length === 0) {
                return handleResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: messages.discountCodeUnavailable.en,
                    messageArabic: messages.discountCodeUnavailable.ar,
                    errorCode: null,
                })
            }
            const redemptionDate = new Date(getExistingCoupon[0]?.redeemBefore);
            const currentDate = new Date();
            if (redemptionDate.getTime() < currentDate.getTime()) {
                return handleResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: messages.discountExpired.en,
                    messageArabic: messages.discountExpired.ar,
                    errorCode: null,
                })
            }
           
            let discountAmount = 0;
            let finalAmount = amount;
            let percentage;
            if (getExistingCoupon[0]?.type == "PERCENTAGE") {
                percentage = getExistingCoupon[0]?.percentOff;
                discountAmount = amount * (percentage / 100)
                finalAmount = amount - discountAmount;
            }

            return handleResponse(req, res, 200, {
                status: true,
                message: messages.appliedCoupon.en,
                messageArabic: messages.appliedCoupon.ar,
                body: {
                    coupon: getExistingCoupon[0]?.couponCode,
                    couponId: getExistingCoupon[0]?._id,
                    priceAfterDiscount: {
                        actualAmount: amount,
                        discountPercentage: percentage,
                        discount: discountAmount.toFixed(2),
                        finalAmount: finalAmount.toFixed(2),
                    }
                },
                errorCode: null,
            })
        } catch (error) {
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Something went wrong",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        }
    }


    async getCouponDetailsByIds(req, res) {        
        try {
            const { couponIds } = req.query;
    
            if (!couponIds || !Array.isArray(couponIds)) {
                return handleResponse(req, res, 400, {
                    status: false,
                    body: null,
                    message: "Invalid couponIds provided",
                    errorCode: "INVALID_INPUT",
                });
            }
    
            // Convert string IDs to ObjectId
            const objectIds = couponIds.map(id => mongoose.Types.ObjectId(id));
    
            const result = await DiscountCoupon.find({
                _id: { $in: objectIds },
            });
    
            return handleResponse(req, res, 200, {
                status: true,
                message: "Data fetched successfully",
                body: result,
                errorCode: null,
            });
        } catch (error) {
            console.error("Error fetching coupons:", error);
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Something went wrong",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }
}

module.exports = new DiscountManagement()