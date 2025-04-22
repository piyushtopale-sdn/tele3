import mongoose from "mongoose";
import { sendResponse } from "../helpers/transmission";
import RadiologyTest from "../models/radiology_test";

export const addRadioTest = async (req, res) => {
    try {
        const { radiologyId, testName, notes } = req.body

        const getTest = await RadiologyTest.find({ radiologyId: { $eq: radiologyId }, testName, isDeleted: false })

        if (getTest.length > 0) {
            return sendResponse(req, res, 400, {
                status: false,
                body: null,
                message: `Test with ${testName} name is already exist`,
                errorCode: null,
            })
        }

        const addObject = {
            radiologyId,
            testName,
            notes
        }

        const addTest = new RadiologyTest(addObject)
        await addTest.save()

        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Radiology test added successfully",
            errorCode: null,
        })
    } catch (error) {
        console.log(error, 'error');
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const editRadioTest = async (req, res) => {
    try {
        const { id, radiologyId, testName, notes } = req.body

        const getTest = await RadiologyTest.find({ radiologyId: { $eq: radiologyId }, testName, isDeleted: false, _id: { $ne: id } })

        if (getTest.length > 0) {
            return sendResponse(req, res, 400, {
                status: false,
                message: `Test with ${testName} name is already exist`,
                body: null,
                errorCode: null,
            })
        }

        await RadiologyTest.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    radiologyId,
                    testName,
                    notes
                }
            }
        )

        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Radiology test updated successfully",
            errorCode: null,
        })
    } catch (error) {
        console.log(error, 'error');
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const listRadioTest = async (req, res) => {
    try {
        const { page, limit, searchText, radiologyCenter } = req.query

        let search_filter = [{}]

        if (searchText) {
            search_filter = [
                { testName: { $regex: searchText || '', $options: 'i' } }
            ]
        }

        let radiologyCenter_filter = {}
        if (radiologyCenter) {
            radiologyCenter_filter = { radiologyId: mongoose.Types.ObjectId(radiologyCenter) }
        }

        const pipeline = [
            {
                $lookup: {
                    from: 'portalusers',
                    localField: 'radiologyId',
                    foreignField: '_id',
                    as: 'radiologyDetails'
                }
            },
            {
                $unwind: {
                  path: "$radiologyDetails",
                  preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    radiologyName: '$radiologyDetails.centre_name',
                    radiologyId: '$radiologyDetails._id'
                }
            },
            {
                $match: {
                    isDeleted: false,
                    $or: search_filter,
                    $and: [
                        radiologyCenter_filter 
                    ]
                }
            },
            {
                $group: {
                    _id: "$_id",
                    radiologyName: { $first: "$radiologyName" },
                    radiologyId: { $first: "$radiologyId" },
                    testName: { $first: "$testName" },
                    notes: { $first: "$notes" },
                    createdAt: { $first: "$createdAt" }
                }
            },
            {
                $sort: { createdAt: -1}
            },
            {
                $facet: {
                    totalCount: [
                        {
                            $count: 'count'
                        }
                    ],
                    paginatedResults: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit * 1 },
                    ]
                }
            }
        ]

        const result = await RadiologyTest.aggregate(pipeline)

        let totalCount = 0
        if (result[0].totalCount.length > 0) {
            totalCount = result[0].totalCount[0].count
        }

        sendResponse(req, res, 200, {
            status: true,
            message: "Radiology fetched successfully",
            body: {
                totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
                currentPage: page,
                totalRecords: totalCount,
                result: result[0].paginatedResults
            },
            errorCode: null,
        })
    } catch (error) {
        console.log(error, 'error');
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const deleteRadioTest = async (req, res) => {
    try {
        const { id } = req.body

        await RadiologyTest.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    isDeleted: true,
                }
            }
        )

        sendResponse(req, res, 200, {
            status: true,
            message: "Radiology test deleted successfully",
            body: null,
            errorCode: null,
        })
    } catch (error) {
        console.log(error, 'error');
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const getRadioTestByCenter = async (req, res) => {
    try {
        const { radiologyCenter } = req.query

        const result = await RadiologyTest.find({ radiologyId: {$eq: radiologyCenter} })
                            .populate({
                                path: 'radiologyId', select: 'centre_name'
                            })

        sendResponse(req, res, 200, {
            status: true,
            message: "Radiology test fetched successfully",
            body: result,
            errorCode: null,
        })
    } catch (error) {
        console.log(error, 'error');
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}