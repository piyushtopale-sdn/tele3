import { sendResponse } from "../../helpers/transmission";
import NewVitalthreshold from "../../models/vitalsthreshold/newVitalthreshold";

export const addNewvitalsThreshold = async (req, res) => {

    const { vitalsType, rangeData } = req.body
    const existVital = await NewVitalthreshold.findOne({ vitalsType: vitalsType, isDeleted: false });

    if (existVital) {
        return sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: "Vitals already exist for the specified type",
            errorCode: null,
        })
    }
    if (vitalsType === "BLOOD_PRESSURE") {
        // Ensure referenceRange collects all valid BPSystolic and BPDiastolic data
        const referenceRange = rangeData.flatMap(item => {
            const systolic = item?.BPSystolic ? { ...item.BPSystolic } : null;
            const diastolic = item?.BPDiastolic ? { ...item.BPDiastolic } : null;

            return [systolic, diastolic].filter(entry => entry !== null); // Remove null entries
        });

        const addObject = {
            vitalsType: vitalsType,
            referenceRange: referenceRange,
        };

        try {
            const addData = new NewVitalthreshold(addObject);
            await addData.save();

            return sendResponse(req, res, 200, {
                status: true,
                body: null,
                message: "Vitals threshold added successfully",
                errorCode: null,
            });
        } catch (error) {
            return sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Internal server error",
                errorCode: null,
            });
        }
    }
    else {
        const addObject = {
            vitalsType: vitalsType,
            referenceRange: rangeData
        }
        try {
            const addData = new NewVitalthreshold(addObject)
            await addData.save()

            return sendResponse(req, res, 200, {
                status: true,
                body: null,
                message: "Vitals threshold added successfully",
                errorCode: null,
            })
        } catch (error) {
            return sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Internal server error",
                errorCode: null,
            });
        }
    }

}

export const getNewvitalsThreshold = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1; // Current page number
        const limit = parseInt(req.query.limit, 10) || 10; // Number of records per page
        const { searchText, status, fromDate, toDate } = req.query;

        // Search filter for vitalsType
        let search_filter = [];
        if (searchText) {
            search_filter.push({ vitalsType: { $regex: searchText, $options: "i" } });
        }

        // Date range filter for createdAt
        let date_filter = {};
        if (fromDate && toDate) {
            date_filter = {
                "createdAt": {
                    $gte: new Date(`${fromDate} 00:00:00`),
                    $lte: new Date(`${toDate} 23:59:59`),
                },
            };
        }

        // Combine filters into a match object
        let match = {
            "referenceRange.isDeleted": false,
            "isDeleted": false,
        };

        if (search_filter.length > 0) match.$or = search_filter; // Add search filter
        if (Object.keys(date_filter).length > 0) match.$and = [date_filter]; // Add date filter
        if (status && status !== 'all') match.status = status; // Add status filter

        // MongoDB Aggregation Pipeline
        const pipeline = [
            { $match: match }, // Match filters
            { $sort: { "createdAt": -1 } }, // Sort by `createdAt` in `referenceRange`
            {
                $facet: {
                    totalCount: [{ $count: 'count' }], // Count total records
                    paginatedResults: limit !== 0 ? [
                        { $skip: (page - 1) * limit }, // Skip records for pagination
                        { $limit: limit }, // Limit the number of records
                    ] : [],
                },
            },
        ];

        // Execute aggregation query
        const result = await NewVitalthreshold.aggregate(pipeline);
        const totalCount = result[0]?.totalCount?.[0]?.count || 0;

        // Send response
        return sendResponse(req, res, 200, {
            status: true,
            message: "Vitals threshold fetched successfully",
            body: {
                totalPages: limit !== 0 ? Math.ceil(totalCount / limit) : 1, // Total pages
                currentPage: page, // Current page
                totalRecords: totalCount, // Total records
                result: result[0]?.paginatedResults || [], // Paginated results
            },
        });
    } catch (error) {
        console.error(error); // Log error
        return sendResponse(req, res, 500, {
            status: false,
            message: "Internal server error",
            body: error,
        });
    }
};

export const getReferenceRangeById = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1; // Current page number
        const limit = parseInt(req.query.limit, 10) || 10; // Number of records per page
        const { searchText, status, fromDate, toDate, gender } = req.query;

        // let ageFilter = req.query.ageFilter.trim() || "all"
        let ageFilter = 'all';
        if (req?.query?.ageFilter) {
            ageFilter = req.query?.ageFilter.trim() || "all"
        }

        // Build search filters
        let search_filter = [];
        if (searchText) {
            search_filter.push({ vitalsType: { $regex: searchText, $options: "i" } });
        }

        let date_filter = {};
        if (fromDate && toDate) {
            date_filter = {
                "createdAt": {
                    $gte: new Date(`${fromDate} 00:00:00`),
                    $lte: new Date(`${toDate} 23:59:59`),
                },
            };
        }

        let match = {
            "referenceRange.isDeleted": false,
            "isDeleted": false,
            "referenceRange.gender": gender, // Filter by patient's gender
        };

        // Add age range filter based on `ageFilter`
        if (ageFilter === "60+" || ageFilter === "60") {
            match["referenceRange.age"] = '60 +';

        } else if (ageFilter === "0-59") {
            match["referenceRange.age"] = '0-59';

        } else if (ageFilter !== "all") {

            return sendResponse(req, res, 400, {
                status: false,
                message: "Invalid age filter",
                body: {},
            });
        }

        if (search_filter.length > 0) match.$or = search_filter;
        if (Object.keys(date_filter).length > 0) match.$and = [date_filter];
        if (status && status !== 'all') match.status = status;

        // Aggregation Pipeline
        const pipeline = [
            { $match: match }, // Match filters
            {
                $addFields: {
                    filteredReferenceRange: {
                        $filter: {
                            input: "$referenceRange",
                            as: "range",
                            cond: {
                                $and: [
                                    { $eq: ["$$range.gender", gender] },
                                    { $lte: ["$$range.age", ageFilter] },
                                    { $eq: ["$$range.isDeleted", false] },
                                ],
                            },
                        },
                    },
                },
            },
            { $sort: { "createdAt": -1 } }, // Sort by createdAt
            {
                $facet: {
                    totalCount: [{ $count: "count" }], // Count total records
                    paginatedResults: limit !== 0 ? [
                        { $skip: (page - 1) * limit }, // Skip records for pagination
                        { $limit: limit }, // Limit the number of records
                    ] : [],
                },
            },
        ];

        // Execute aggregation query
        const result = await NewVitalthreshold.aggregate(pipeline);
        const totalCount = result[0]?.totalCount?.[0]?.count || 0;

        // Send response
        return sendResponse(req, res, 200, {
            status: true,
            message: "Vitals threshold fetched successfully",
            data: {
                totalPages: limit !== 0 ? Math.ceil(totalCount / limit) : 1, // Total pages
                currentPage: page, // Current page
                totalRecords: totalCount, // Total records
                result: result[0]?.paginatedResults || [], // Paginated results
            },
        });
    } catch (error) {
        console.error(error); // Log error
        return sendResponse(req, res, 500, {
            status: false,
            message: "Internal server error",
            body: error,
        });
    }
};

export const getNewvitalsThresholdById = async (req, res) => {
    try {
        const { vitalsType } = req.params;  // Extract both 'id' and 'vitalsType' from request params

        // Aggregation pipeline
        const pipeline = [
            {
                $match: { vitalsType: vitalsType } // Match documents where 'vitalsType' matches the 'vitalsType' from the request
            },
            {
                $group: {
                    _id: "$vitalsType",  // Group by 'vitalsType' to gather similar documents together
                    data: { $push: "$$ROOT" } // Collect all matched documents in an array
                }
            }
        ];

        const result = await NewVitalthreshold.aggregate(pipeline)

        return sendResponse(req, res, 200, {
            status: true,
            message: "Vitals threshold fetched successfully",
            body: result,
            errorCode: null,
        })
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const updateNewvitalsThreshold = async (req, res) => {
    try {
        const { id, vitalsType, rangeData } = req.body;

        if (!id) {
            return sendResponse(req, res, 400, {
                status: false,
                body: null,
                message: "ID is required",
                errorCode: "ID_NOT_FOUND",
            });
        }

        if (!vitalsType || !rangeData) {
            return sendResponse(req, res, 400, {
                status: false,
                body: null,
                message: "Vitals type and range data are required",
                errorCode: "INVALID_INPUT",
            });
        }


        const existingThreshold = await NewVitalthreshold.findById(id);
        if (!existingThreshold) {
            return sendResponse(req, res, 404, {
                status: false,
                body: null,
                message: "Vitals threshold not found",
                errorCode: "NOT_FOUND",
            });
        }

        existingThreshold.vitalsType = vitalsType;
        existingThreshold.referenceRange = rangeData;

        const updateResult = await existingThreshold.save();

        return sendResponse(req, res, 200, {
            status: true,
            body: updateResult,
            message: "Vitals threshold updated successfully",
            errorCode: null,
        });
    } catch (error) {
        console.error("Error in updateNewvitalsThreshold:", error);
        return sendResponse(req, res, 500, {
            status: false,
            body: error.message || error,
            message: "Internal server error",
            errorCode: "SERVER_ERROR",
        });
    }
};

export const updateNewvitalsThresholdByAction = async (req, res) => {
    try {
        const { id, actionName, actionValue } = req.body;

        if (!Array.isArray(id) || id.length === 0) {
            return sendResponse(req, res, 400, {
                status: false,
                body: null,
                message: "Invalid or missing IDs",
                errorCode: "INVALID_INPUT",
            });
        }

        await NewVitalthreshold.updateMany(
            {
                _id: { $in: id },
            },
            {
                $set: {
                    [actionName]: actionValue,
                },
            }
        );

        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: `Vitals threshold ${actionName === 'isDeleted' ? 'deleted' : 'updated'
                } successfully`,
            errorCode: null,
        });
    } catch (error) {
        console.error("Error in updateNewVitalthresholdByAction:", error);
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
};
