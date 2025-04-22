import LabTestConfiguration from "../models/lab_test_configuration.models";
import LabTest from "../models/lab_test.models";
import RadiologyTest from "../models/radiology_test";
import { sendResponse } from "../helpers/transmission";
import Http from "../helpers/httpservice";
import mongoose from "mongoose";
import { LabMainTestColumns, LabSubTestColumns } from "../config/constants";
import { processExcel } from "../middleware/utils";
const fs = require("fs");
const httpService = new Http();

const validateColumnWithExcel = (toValidate, excelColumn) => {
    const requestBodyCount = Object.keys(toValidate).length;
    const fileColumnCount = Object.keys(excelColumn).length;
    if (requestBodyCount !== fileColumnCount) {
      return false;
    }
   
    let index = 1;
    for (const iterator of Object.keys(excelColumn)) {
      if (iterator !== toValidate[`col${index}`]) {
        return false;
      }
      index++;
    }
    return true;
  };

export const getLabTestConfiguration = async (req, res) => {
    try {
        const { page, limit, searchText, sort, labRadiologyId } = req.query;

        // Convert query params to numbers
        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        // Center Filter
        let center_filter = {};
        if (labRadiologyId) {
            center_filter = { labId: mongoose.Types.ObjectId(labRadiologyId) };
        }

        // Search Filter
        let search_filter = [{}];
        if (searchText) {
            search_filter = [
                { testName: { $regex: searchText, $options: "i" } },
                { testConfiguration: { $regex: searchText, $options: "i" } },
                { "portalusers.centre_name": { $regex: searchText, $options: "i" } },  // Corrected field reference
            ];
        }

        // Match Query
        let match = {
            isDeleted: false,
            $or: search_filter,
            $and: [center_filter],
        };

        // Sorting Logic
        let fieldName = "createdAt";
        let sortOrder = -1;
        if (sort) {
            const [key, value] = sort.split(":");
            fieldName = key;
            sortOrder = value === "1" ? 1 : -1;
        }

        // Aggregation Pipeline
        const pipeline = [
            {
                $lookup: {
                    from: "portalusers",   // Actual collection name of PortalUser
                    localField: "labId",
                    foreignField: "_id",
                    as: "portalusers",
                },
            },
            {
                $unwind: {
                    path: "$portalusers",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    labName: "$portalusers.centre_name",
                },
            },
            {
                $match: match,
            },
            {
                $group: {
                    _id: "$_id",
                    labName: { $first: "$labName" },
                    testName: { $first: "$testName" },
                    testConfiguration: { $first: "$testConfiguration" },
                    referenceRange: { $first: "$referenceRange" },
                    alphaResult: { $first: "$alphaResult" },
                    createdAt: { $first: "$createdAt" },
                },
            },
            {
                $sort: {
                    [fieldName]: sortOrder,
                    _id: -1,
                },
            },
            {
                $facet: {
                  totalCount: [{ $count: "count" }],
                  paginatedResults: [
                    ...(limitNumber !== 0 ? [{ $skip: (pageNumber - 1) * limitNumber }] : []),
                    ...(limitNumber !== 0 ? [{ $limit: limitNumber }] : []),
                  ],
                },
              },
        ];

        // Execute the Aggregation Pipeline
        const result = await LabTestConfiguration.aggregate(pipeline);

        let totalCount = 0;
        if (result[0].totalCount.length > 0) {
            totalCount = result[0].totalCount[0].count;
        }

        // Response
        sendResponse(req, res, 200, {
            status: true,
            message: "Test configuration fetched successfully",
            body: {
                totalPages: limitNumber !== 0 ? Math.ceil(totalCount / limitNumber) : 1,
                currentPage: pageNumber,
                totalRecords: totalCount,
                result: result[0].paginatedResults,
            },
            errorCode: null,
        });
    } catch (error) {
        console.error("Error in getLabTestConfiguration", error);
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
};


export const getLabTestConfigurationById = async (req, res) => {
    try {
        const { id } = req.params

        if (id) {
            const getTest = await LabTestConfiguration.find({ _id: {$eq: id}, isDeleted: false })
            if (getTest.length == 0) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Test configuration not exists",
                    errorCode: null,
                  });
            }
        } 
       
        const result = await LabTestConfiguration.find({ _id: {$eq: id}, isDeleted: false })
                                                .populate({path: 'labId', select: 'centre_name'})


        sendResponse(req, res, 200, {
            status: true,
            message: "Test configuration fetched successfully",
            body: {
                result
            },
            errorCode: null,
        })
    } catch (error) {
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}
export const addLabTestConfiguration = async (req, res) => {
    try {
        const {labId, testName, testConfiguration, referenceRange, alphaResult, notes} = req.body
        const getTest = await LabTestConfiguration.find({labId, testName, testConfiguration})
        if (getTest.length > 0) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Test configuration already exists",
                errorCode: null,
              });
        }
        let addObject = {
            labId, 
            testName, 
            testConfiguration, 
            notes
        }
        if (referenceRange) {
            addObject.referenceRange = referenceRange
        }
        if (alphaResult) {
            addObject.alphaResult = alphaResult
        }
        const addTest = new LabTestConfiguration(addObject)
        await addTest.save()
        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Test configuration added successfully.",
            errorCode: null,
        });
    } catch (error) {
        console.log("Error while adding test configuration: " + error);
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Something went wrong",
            errorCode: "INTERNAL_SERVER_ERROR",
          });
    }
}
export const editLabTestConfiguration = async (req, res) => {
    try {
        const {id, labId, testName, testConfiguration, referenceRange, alphaResult, notes} = req.body
        if (id) {
            const getTest = await LabTestConfiguration.find({ _id: {$eq: id}, isDeleted: false })
            if (getTest.length == 0) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Test configuration not exists",
                    errorCode: null,
                  });
            }
        } else {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Please provide test configuration id",
                errorCode: null,
              });
        }
        const getTest = await LabTestConfiguration.find({labId, testName, testConfiguration, _id: {$ne: id}})
        if (getTest.length > 0) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Test configuration already exists",
                errorCode: null,
              });
        }
        let updateObject = {
            labId, 
            testName, 
            testConfiguration, 
            notes
        }
        if (referenceRange) {
            updateObject.referenceRange = referenceRange
        }
        if (alphaResult) {
            updateObject.alphaResult = alphaResult
        }
        await LabTestConfiguration.findOneAndUpdate(
            { _id: id },
            { $set: updateObject }
        )
        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Test configuration updated successfully.",
            errorCode: null,
        });
    } catch (error) {
        console.log("Error while updating test configuration: " + error);
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Something went wrong",
            errorCode: "INTERNAL_SERVER_ERROR",
          });
    }
}
export const deleteLabTestConfiguration = async (req, res) => {
    try {
        const { id } = req.params
        if (id) {
            const getTest = await LabTestConfiguration.find({ _id: {$eq: id}, isDeleted: false })
            if (getTest.length == 0) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Test configuration not exists",
                    errorCode: null,
                  });
            }
        } 
           
        await LabTestConfiguration.findOneAndUpdate(
            { _id: id },
            { 
                $set: {
                    isDeleted: true
                }
            }
        )
        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Test configuration deleted successfully.",
            errorCode: null,
        });
    } catch (error) {
        console.log("Error while deleting test configuration: " + error);
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Something went wrong",
            errorCode: "INTERNAL_SERVER_ERROR",
          });
    }
}


export const getLabTest = async (req, res) => {
    try {
        const { page, limit, searchText, sort, labRadiologyId, centreName } = req.query;

        // Ensure page and limit are numbers
        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        let matchConditions = {
            isDeleted: false
        };

        if (labRadiologyId) {
            matchConditions.labId = mongoose.Types.ObjectId(labRadiologyId);
        }

        let searchFilter = {};
        if (searchText) {
            searchFilter = {
                $or: [
                    { testName: { $regex: searchText, $options: "i" } },
                    { "portalusers.centre_name": { $regex: searchText, $options: "i" } }
                ]
            };
        }

        let centreFilter = {};
        if (centreName) {
            centreFilter["portalusers.centre_name"] = { $regex: centreName, $options: "i" };
        }

        let fieldName = "createdAt";
        let sortOrder = -1;
        if (sort) {
            const [key, value] = sort.split(":");
            fieldName = key;
            sortOrder = value === "1" ? 1 : -1;
        }

        const pipeline = [
            { $match: matchConditions },
            
            {
                $lookup: {
                    from: "portalusers",
                    localField: "labId",
                    foreignField: "_id",
                    as: "portalusers",
                },
            },
            {
                $unwind: {
                    path: "$portalusers",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    labName: "$portalusers.centre_name",
                },
            },
            ...(searchText || centreName ? [{
                $match: {
                    ...(searchText ? searchFilter : {}),
                    ...(centreName ? centreFilter : {})
                }
            }] : []),
            {
                $group: {
                    _id: "$_id",
                    labName: { $first: "$labName" },
                    labId: { $first: "$labId" },
                    testName: { $first: "$testName" },
                    testFees: { $first: "$testFees" },
                    couponCode: { $first: "$couponCode" },
                    loinc: { $first: "$loinc" },
                    tests: { $first: "$tests" },
                    createdAt: { $first: "$createdAt" },
                },
            },
            {
                $sort: {
                    [fieldName]: sortOrder,
                    _id: -1,
                }
            },
            {
                $facet: {
                    totalCount: [{ $count: "count" }],
                    paginatedResults: limitNumber !== 0
                        ? [
                            { $skip: (pageNumber - 1) * limitNumber },
                            { $limit: limitNumber },
                        ]
                        : [
                            {$match:{}}
                        ],
                },
            },
            // {
            //     $facet: {
            //         totalCount: [{ $count: "count" }],
            //         paginatedResults: limitNumber !== 0
            //             ? [
            //                 { $skip: (pageNumber - 1) * limitNumber },
            //                 { $limit: limitNumber },
            //             ]
            //             : [],
            //     },
            // },
        ];

        const result = await LabTest.aggregate(pipeline);
        let totalCount = 0;
        if (result[0].totalCount.length > 0) {
            totalCount = result[0].totalCount[0].count;
        }

        sendResponse(req, res, 200, {
            status: true,
            message: "Test fetched successfully",
            body: {
                totalPages: limitNumber !== 0 ? Math.ceil(totalCount / limitNumber) : 1,
                currentPage: pageNumber,
                totalRecords: totalCount,
                result: result[0].paginatedResults,
            },
            errorCode: null,
        });
    } catch (error) {
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
};

export const getLabTestExport = async (req, res) => {
    try {
        const { page, limit, searchText, sort, labRadiologyId, centreName } = req.query;

        const pageNumber = Number(page) 
        const limitNumber = Number(limit) 

        let matchConditions = {
            isDeleted: false
        };

        if (labRadiologyId) {
            matchConditions.labId = mongoose.Types.ObjectId(labRadiologyId);
        }

        let searchFilter = {};
        if (searchText) {
            searchFilter = {
                $or: [
                    { testName: { $regex: searchText, $options: "i" } },
                    { "portalusers.centre_name": { $regex: searchText, $options: "i" } }
                ]
            };
        }

        let centreFilter = {};
        if (centreName) {
            centreFilter["portalusers.centre_name"] = { $regex: centreName, $options: "i" };
        }

        let fieldName = "createdAt";
        let sortOrder = -1;
        if (sort) {
            const [key, value] = sort.split(":");
            fieldName = key;
            sortOrder = value === "1" ? 1 : -1;
        }

        const pipeline = [
            { $match: matchConditions },
            {
                $lookup: {
                    from: "portalusers",
                    localField: "labId",
                    foreignField: "_id",
                    as: "portalusers",
                },
            },
            {
                $unwind: {
                    path: "$portalusers",
                    preserveNullAndEmptyArrays: true,
                },
            },
            ...(searchText || centreName ? [{
                $match: {
                    ...(searchText ? searchFilter : {}),
                    ...(centreName ? centreFilter : {})
                }
            }] : []),
            {
                $sort: {
                    [fieldName]: sortOrder,
                    _id: -1,
                }
            },
            {
                $project: {
                    _id: 0,
                    "Profile Name": "$testName",
                    "Note": "$notes",
                    "Laboratory Center": { $ifNull: ["$portalusers.centre_name", "N/A"] },
                    "Fees(SAR)": "$testFees",
                    "Loinc Code": "$loinc.loincCode",
                    "Coupon Code": "$couponCode.couponCode"
                }
            }
        ];

        if (limitNumber > 0) {
            pipeline.push(
                { $skip: (pageNumber - 1) * limitNumber },
                { $limit: limitNumber }
            );
        }

        const result = await LabTest.aggregate(pipeline);
        const array = result.map(obj => [
            obj["Profile Name"] || "",
            obj["Note"] || "",
            obj["Laboratory Center"] || "",
            obj["Fees(SAR)"] || "",
            obj["Loinc Code"] || "",
            obj["Coupon Code"] || ""
        ]);

        sendResponse(req, res, 200, {
            status: true,
            data: {
                result,  
                array    
            },
            message: "Data exported successfully",
            errorCode: null,
        });

    } catch (error) {
        console.log("Error exporting data:", error.message);
        sendResponse(req, res, 500, {
            status: false,
            data: error,
            message: "Failed to export data",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
};
  
export const getLabTestById = async (req, res) => {
    try {
        const { id } = req.params

        if (id) {
            const getTest = await LabTest.find({ _id: {$eq: id}, isDeleted: false })
            if (getTest.length == 0) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Profile not exists",
                    errorCode: null,
                  });
            }
        } 
       
        const result = await LabTest.find({ _id: {$eq: id}, isDeleted: false })
                                                .populate({path: 'labId', select: 'centre_name'})


        sendResponse(req, res, 200, {
            status: true,
            message: "Profile fetched successfully",
            body: {
                result
            },
            errorCode: null,
        })
    } catch (error) {
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}
export const addLabTest = async (req, res) => {
    try {
        const {labId, testName, tests, notes, testFees,couponCode,loinc} = req.body
        const getTest = await LabTest.find({labId, testName})
        if (getTest.length > 0) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Profile already exists",
                errorCode: null,
              });
        }
        let addObject = {
            labId, 
            testName,
            loinc, 
            tests, 
            testFees,
            couponCode,
            notes,
        }
     
        const addTest = new LabTest(addObject)
        await addTest.save()
        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Profile added successfully.",
            errorCode: null,
        });
    } catch (error) {
        console.log("Error while adding test: " + error);
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Something went wrong",
            errorCode: "INTERNAL_SERVER_ERROR",
          });
    }
}
export const editLabTest = async (req, res) => {
    try {
        const {id, labId, testName, tests, notes, testFees, couponCode,loinc} = req.body
        if (id) {
            const getTest = await LabTest.find({ _id: {$eq: id}, isDeleted: false })
            if (getTest.length == 0) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Profile not exists",
                    errorCode: null,
                  });
            }
        } else {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Please provide test id",
                errorCode: null,
              });
        }
        const getTest = await LabTest.find({labId, testName, _id: {$ne: id}})
        if (getTest.length > 0) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Profile already exists",
                errorCode: null,
              });
        }
        let updateObject = {
            labId, 
            testName, 
            tests,
            loinc, 
            notes,
            testFees,
            couponCode
        }
        await LabTest.findOneAndUpdate(
            { _id: id },
            { $set: updateObject }
        )
        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Profile updated successfully.",
            errorCode: null,
        });
    } catch (error) {
        console.log("Error while updating test: " + error);
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Something went wrong",
            errorCode: "INTERNAL_SERVER_ERROR",
          });
    }
}
export const deleteLabTest = async (req, res) => {
    try {
        const { id } = req.params
        if (id) {
            const getTest = await LabTest.find({ _id: {$eq: id}, isDeleted: false })
            if (getTest.length == 0) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Profile not exists",
                    errorCode: null,
                  });
            }
        } 
           
        await LabTest.findOneAndUpdate(
            { _id: id },
            { 
                $set: {
                    isDeleted: true
                }
            }
        )
        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Profile deleted successfully.",
            errorCode: null,
        });
    } catch (error) {
        console.log("Error while deleting test: " + error);
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Something went wrong",
            errorCode: "INTERNAL_SERVER_ERROR",
          });
    }
}


export const allLabTestforexport = async (req, res) => {
    const { searchText, limit, page, labId } = req.query;

    let filter = { isDeleted: false }; // Default filter to only fetch non-deleted records

    // Apply searchText filter if provided
    if (searchText && searchText !== "") {
      filter = {
        isDeleted: false,
        $or: [
          { testName: { $regex: searchText, $options: "i" } },
        //   { notes: { $regex: searchText, $options: "i" } },
        //   { testConfiguration: { $regex: searchText, $options: "i" } },
        //   { team: { $regex: searchText, $options: "i" } },
        ]
      };
    }

    // Add labId to filter if provided
    if (labId) {
      filter.labId = mongoose.Types.ObjectId(labId);
    }

    try {
      let result;

      if (limit > 0) {
        // Paginated results with `find()` method
        result = await LabTest.find(filter)
          .sort([["createdAt", -1]]) // Sort by creation date in descending order
          .skip((page - 1) * limit) // Pagination logic
          .limit(Number(limit)) // Limit to the provided number of records
          .exec();
      } else {
        // Non-paginated results with aggregation pipeline
        result = await LabTest.aggregate([
          { $match: filter }, // Apply filters for searchText and labId
          { $sort: { "createdAt": -1 } }, // Sort by creation date in descending order
          {
            $lookup: {
              from: "portalusers", // Lookup in the PortalUser collection
              localField: "labId", // LabTest's labId field
              foreignField: "_id", // PortalUser's _id field
              as: "labDetails", // Alias for the lab details
            }
          },
          { $unwind: { path: "$labDetails", preserveNullAndEmptyArrays: true } }, // Prevent duplicate data if no labDetails match
          {
            $project: {
              _id: 0,
              testName: "$testName",
              notes: "$notes",
              labName: { $ifNull: ["$labDetails.centre_name", "N/A"] }, // If labName doesn't exist, show 'N/A'
              testConfiguration: "$testConfiguration",
              testFees: "$testFees", // Additional fields you want to export
              loincCode: "$loinc.loincCode", // Assuming loinc is an embedded document
              couponCode: "$couponCode.couponCode" // Assuming couponCode is an embedded document
            }
          }
        ]);
      }

      // Convert the result to an array for export (e.g., CSV or Excel)
      const array = result.map(obj => Object.values(obj));
      console.log("Array : ",array)
      // Send success response with result and array
      sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          array
        },
        message: `Data exported successfully`,
        errorCode: null,
      });

    } catch (err) {
      // Log the error and send a failure response
      console.error("Error exporting data:", err);
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `Failed to export data`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
};



  
export const allLabTestConfigforexport = async (req, res) => {
    const { searchText, limit, page, labId } = req.query;
  
    let filter = { isDeleted: false }; // Default filter to only fetch non-deleted records
  
    // Apply searchText filter if provided
    if (searchText && searchText !== "") {
      filter = {
        isDeleted: false,
        $or: [
          { testName: { $regex: searchText, $options: "i" } },
          { notes: { $regex: searchText, $options: "i" } },
          { testConfiguration: { $regex: searchText, $options: "i" } },
          { team: { $regex: searchText, $options: "i" } },
        ]
      };
    }
  
    // Add labId to filter if provided
    if (labId) {
      filter.labId = mongoose.Types.ObjectId(labId);
    }
  
    try {
      let result;
  
      if (limit > 0) {
        // Paginated results with `find()` method
        result = await LabTestConfiguration.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(Number(limit))
          .exec();
      } else {
        // Non-paginated results with aggregation pipeline
        result = await LabTestConfiguration.aggregate([
          { $match: filter }, // Match the filter for searchText and labId
          { $sort: { "createdAt": -1 } }, // Sort by creation date in descending order
          {
            $lookup: {
              from: "portalusers", // Name of the PortalUser collection
              localField: "labId", // Field in the LabTest document
              foreignField: "_id", // Field in the PortalUser document
              as: "labDetails", // Alias for the lab details
            }
          },
          { $unwind: "$labDetails" }, // Unwind to get the lab details as a single object
          {
            $project: {
              _id: 0,
              testName: "$testName",
              notes: "$notes",
              labName: "$labDetails.centre_name", // Assuming 'centre_name' is the field in the labDetails
              testConfiguration: "$testConfiguration"
            }
          }
        ]);
      }
  
      // Convert the result to an array for export (e.g., CSV or Excel)
      const array = result.map(obj => Object.values(obj));
  
      sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          array
        },
        message: `Data exported successfully`,
        errorCode: null,
      });
  
    } catch (err) {
      console.error("Error exporting data:", err); // Log the error
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `Failed to export data`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  };
  

  export const getRadioTest = async (req, res) => {
    try {
        const { page, limit, searchText, sort, labRadiologyId, centreName } = req.query;

        const pageNumber = Number(page)
        const limitNumber = Number(limit)

        let matchConditions = {
            isDeleted: false
        };

        if (labRadiologyId) {
            matchConditions.radiologyId = mongoose.Types.ObjectId(labRadiologyId);
        }

        let searchFilter = {};
        if (searchText) {
            searchFilter = {
                $or: [
                    { testName: { $regex: searchText, $options: "i" } },
                    { radiologyName: { $regex: searchText, $options: "i" } },
                    { "portalusers.centre_name": { $regex: searchText, $options: "i" } }
                ]
            };
        }

        let centreFilter = {};
        if (centreName) {
            centreFilter["portalusers.centre_name"] = { $regex: centreName, $options: "i" };
        }

        let fieldName = "createdAt";
        let sortOrder = -1;
        if (sort) {
            const [key, value] = sort.split(":");
            fieldName = key;
            sortOrder = value === "1" ? 1 : -1;
        }

        const pipeline = [
            { $match: matchConditions },
            
            {
                $lookup: {
                    from: "portalusers",
                    localField: "radiologyId",
                    foreignField: "_id",
                    as: "portalusers",
                },
            },
            {
                $unwind: {
                    path: "$portalusers",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    radiologyName: "$portalusers.centre_name",
                },
            },
            ...(searchText || centreName ? [{
                $match: {
                    ...(searchText ? searchFilter : {}),
                    ...(centreName ? centreFilter : {})
                }
            }] : []),
            {
                $group: {
                    _id: "$_id",
                    radiologyName: { $first: "$radiologyName"},
                    radiologyId: { $first: "$radiologyId"},
                    testName: { $first: "$testName"},
                    testFees: { $first: "$testFees"},
                    notes: { $first: "$notes" },
                    couponCode:{ $first: "$couponCode"},
                    loinc:{ $first: "$loinc"},
                    studyTypeId: { $first: "$studyTypeId"},
                    createdAt: { $first: "$createdAt"}
                }
            },
            {
                $sort: {
                    [fieldName]: sortOrder,
                    _id: -1 // Ensures consistent order
                }
            },
            // {
            //     $facet: {
            //         totalCount: [{ $count: "count" }],
            //         paginatedResults: limitNumber !== 0
            //             ? [
            //                 { $skip: (pageNumber - 1) * limitNumber },
            //                 { $limit: limitNumber },
            //             ]
            //             : [],
            //     },
            // },
        {
  $facet: {
    totalCount: [{ $count: "count" }],
    paginatedResults: limitNumber !== 0
      ? [
          { $skip: (pageNumber - 1) * limitNumber },
          { $limit: limitNumber },
        ]
      : [
          { $match: {} } // Dummy stage to avoid empty pipeline
        ],
  },
}

        ];

        const result = await RadiologyTest.aggregate(pipeline);
        let totalCount = 0;
        if (result[0].totalCount.length > 0) {
            totalCount = result[0].totalCount[0].count;
        }

        sendResponse(req, res, 200, {
            status: true,
            message: "Test fetched successfully",
            body: {
                totalPages: limitNumber !== 0 ? Math.ceil(totalCount / limitNumber) : 1,
                currentPage: pageNumber,
                totalRecords: totalCount,
                result: result[0].paginatedResults,
            },
            errorCode: null,
        });
    } catch (error) {
        console.log("Errorrrr>>>",error.message)
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
};








export const getRadioTestexp = async (req, res) => {
    try {
        const { page, limit, searchText, sort, labRadiologyId, centreName } = req.query;

        const pageNumber = Number(page)
        const limitNumber = Number(limit)

        let matchConditions = {
            isDeleted: false
        };

        if (labRadiologyId) {
            matchConditions.radiologyId = mongoose.Types.ObjectId(labRadiologyId);
        }

        let searchFilter = {};
        if (searchText) {
            searchFilter = {
                $or: [
                    { testName: { $regex: searchText, $options: "i" } },
                    { radiologyName: { $regex: searchText, $options: "i" } },
                    { "portalusers.centre_name": { $regex: searchText, $options: "i" } }
                ]
            };
        }

        let centreFilter = {};
        if (centreName) {
            centreFilter["portalusers.centre_name"] = { $regex: centreName, $options: "i" };
        }

        let fieldName = "createdAt";
        let sortOrder = -1;
        if (sort) {
            const [key, value] = sort.split(":");
            fieldName = key;
            sortOrder = value === "1" ? 1 : -1;
        }

        const pipeline = [
            { $match: matchConditions },
            
            {
                $lookup: {
                    from: "portalusers",
                    localField: "radiologyId",
                    foreignField: "_id",
                    as: "portalusers",
                },
            },
            {
                $unwind: {
                    path: "$portalusers",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    radiologyName: "$portalusers.centre_name",
                },
            },
            ...(searchText || centreName ? [{
                $match: {
                    ...(searchText ? searchFilter : {}),
                    ...(centreName ? centreFilter : {})
                }
            }] : []),
            {
                $group: {
                    _id: "$_id",
                    radiologyName: { $first: "$radiologyName"},
                    radiologyId: { $first: "$radiologyId"},
                    testName: { $first: "$testName"},
                    testFees: { $first: "$testFees"},
                    notes: { $first: "$notes" },
                    couponCode:{ $first: "$couponCode"},
                    loinc:{ $first: "$loinc"},
                    studyTypeId: { $first: "$studyTypeId"},
                    createdAt: { $first: "$createdAt"}
                }
            },
            {
                $sort: {
                    [fieldName]: sortOrder,
                    _id: -1 // Ensures consistent order
                }
            },
            // {
            //     $facet: {
            //         totalCount: [{ $count: "count" }],
            //         paginatedResults: limitNumber !== 0
            //             ? [
            //                 { $skip: (pageNumber - 1) * limitNumber },
            //                 { $limit: limitNumber },
            //             ]
            //             : [],
            //     },
            // },
        {
  $facet: {
    totalCount: [{ $count: "count" }],
    paginatedResults: limitNumber !== 0
      ? [
          { $skip: (pageNumber - 1) * limitNumber },
          { $limit: limitNumber },
        ]
      : [
          { $match: {} } // Dummy stage to avoid empty pipeline
        ],
  },
}

        ];

        const result = await RadiologyTest.aggregate(pipeline);
        let totalCount = 0;
        if (result[0].totalCount.length > 0) {
            totalCount = result[0].totalCount[0].count;
        }

        sendResponse(req, res, 200, {
            status: true,
            message: "Test fetched successfully",
            body: {
                totalPages: limitNumber !== 0 ? Math.ceil(totalCount / limitNumber) : 1,
                currentPage: pageNumber,
                totalRecords: totalCount,
                result: result[0].paginatedResults,
            },
            errorCode: null,
        });
    } catch (error) {
        console.log("Errorrrr>>>",error.message)
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
};


export const getRadioTestById = async (req, res) => {
    try {
        const { id } = req.params

        if (id) {
            const getTest = await RadiologyTest.find({ _id: {$eq: id}, isDeleted: false })
            if (getTest.length == 0) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Test not exists",
                    errorCode: null,
                  });
            }
        } 

        const result = await RadiologyTest.find({ _id: {$eq: id}, isDeleted: false })
                                                .populate({path: 'radiologyId', select: 'centre_name'})


        return sendResponse(req, res, 200, {
            status: true,
            message: "Test fetched successfully",
            body: {
                result
            },
            errorCode: null,
        })
    } catch (error) {
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}
export const addRadioTest = async (req, res) => {
    try {
        const {radiologyId, studyTypeId, testName, notes, testFees,loinc, couponCode} = req.body
        const getTest = await RadiologyTest.find({radiologyId, testName})
        if (getTest.length > 0) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Test already exists",
                errorCode: null,
              });
        }
        let addObject = {
            radiologyId, 
            studyTypeId,
            testName,
            loinc, 
            couponCode,
            notes,
            testFees
        }
     
        const addTest = new RadiologyTest(addObject)
        await addTest.save()
        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Test added successfully.",
            errorCode: null,
        });
    } catch (error) {
        console.log("Error while adding test: " + error);
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Something went wrong",
            errorCode: "INTERNAL_SERVER_ERROR",
          });
    }
}
export const editRadioTest = async (req, res) => {
    try {
        const {id, radiologyId, studyTypeId, testName, notes, testFees,loinc,couponCode} = req.body
        if (id) {
            const getTest = await RadiologyTest.find({ _id: {$eq: id}, isDeleted: false })
            if (getTest.length == 0) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Test not exists",
                    errorCode: null,
                  });
            }
        } else {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Please provide test id",
                errorCode: null,
              });
        }
        const getTest = await RadiologyTest.find({radiologyId, testName, _id: {$ne: id}})
        if (getTest.length > 0) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Test already exists",
                errorCode: null,
              });
        }
        let updateObject = {
            radiologyId, 
            studyTypeId,
            testName,
            loinc, 
            couponCode,
            notes,
            testFees
        }
        await RadiologyTest.findOneAndUpdate(
            { _id: id },
            { $set: updateObject }
        )
        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Test updated successfully.",
            errorCode: null,
        });
    } catch (error) {
        console.log("Error while updating test: " + error);
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Something went wrong",
            errorCode: "INTERNAL_SERVER_ERROR",
          });
    }
}
export const deleteRadioTest = async (req, res) => {
    try {
        const { id } = req.params
        if (id) {
            const getTest = await RadiologyTest.find({ _id: {$eq: id}, isDeleted: false })
            if (getTest.length == 0) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Test not exists",
                    errorCode: null,
                  });
            }
        } 
           
        await RadiologyTest.findOneAndUpdate(
            { _id: id },
            { 
                $set: {
                    isDeleted: true
                }
            }
        )
        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Test deleted successfully.",
            errorCode: null,
        });
    } catch (error) {
        console.log("Error while deleting test: " + error);
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Something went wrong",
            errorCode: "INTERNAL_SERVER_ERROR",
          });
    }
}
export const allRadioTestforexport = async (req, res) => {
    const { searchText, limit, page, radioId } = req.query
    let filter = { isDeleted: false }; // Default filter to fetch non-deleted records

    // Apply searchText filter if provided
    if (searchText && searchText.trim() !== "") {
        filter.$or = [
            { testName: { $regex: searchText, $options: "i" } },
            { notes: { $regex: searchText, $options: "i" } },
            { team: { $regex: searchText, $options: "i" } },
            { radiologyName: { $regex: searchText, $options: "i" } }
        ];
    }
    //

    // Add radiologyId filter if provided 
    if (radioId) {
        filter.radiologyId = new mongoose.Types.ObjectId(radioId);
    }
    try {
      let result = '';
      if (limit > 0) {
        result = await RadiologyTest.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      }
      else {
        result = await RadiologyTest.aggregate([{
          $match: filter
        },
        { $sort: { "createdAt": -1 } },
        {
            $lookup: {
              from: "portalusers", // Name of the PortalUser collection (lowercase)
              localField: "radiologyId", // Field in the LabTest document
              foreignField: "_id", // Field in the PortalUser document
              as: "radioDetails" // Alias to store the matching lab details
            }
          },
          {
            $unwind: "$radioDetails" // Unwind to get the lab details as a single object
          },
        {
          $project: {
            _id: 0,
            testName: "$testName",
            notes: "$notes",
            radiologyName: "$radioDetails.centre_name",
            testFees: "$testFees",
            loincCode: "$loinc.loincCode",
            couponCode: "$couponCode.couponCode"
          }
        }
        ])
      }
             // If searchText is applied but no matches found, return an empty response
             if (searchText && searchText.trim() !== "" && result.length === 0) {
                return sendResponse(req, res, 200, {
                    status: true,
                    data: {
                        result: [],
                        array: []
                    },
                    message: `No matching data found`,
                    errorCode: null,
                });
            }
      let array = result.map(obj => Object.values(obj));
      sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          array
        },
        message: `Data exported successfully`,
        errorCode: null,
      });
    } catch (err) {
      
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to export data`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
}


export const uploadLabSubTest = async (req, res) => {
    try {
      const filePath = "./uploads/" + req.filename;
      const data = await processExcel(filePath);
      const isValidFile = validateColumnWithExcel(LabSubTestColumns, data[0]);
      fs.unlinkSync(filePath);
  
      if (!isValidFile) {
        sendResponse(req, res, 500, {
          status: false,
          body: isValidFile,
          message: "Invalid excel sheet! column not matched.",
          errorCode: null,
        });
        return;
      }
  
      // Get existing `labId` and `testName` pairs
      const existingTests = await LabTestConfiguration.find({ isDeleted: false }).select("labId testName").lean();
      const existingTestSet = new Set(existingTests.map(item => `${item.labId}-${item.testName}`));
  
      const inputArray = [];
      const duplicateTestNames = [];
  
      for (const singleData of data) {
        const testKey = `${req.body.labId}-${singleData.testName}`;
  
        if (existingTestSet.has(testKey)) {
          duplicateTestNames.push(testKey); // Only store testName for duplicates
        } else {
            if(singleData.testConfiguration === 'NUMERIC_RESULT'){
 
                inputArray.push({
                  labId: req.body.labId,
                  testName: singleData.testName,
                  serviceCode: singleData.serviceCode,
                  referenceRange: [{
                    gender: 'all',
                    age: 'all',
                    high: 120,
                    low: 80,
                    criticalHigh: 200,
                    criticalLow: 50,
                    unit: singleData.unit,
                  }],
                  testConfiguration: singleData.testConfiguration,
                  isDeleted: false,
                });
                existingTestSet.add(testKey);
            }else{
                inputArray.push({
                    labId: req.body.labId,
                    testName: singleData.testName,
                    serviceCode: singleData.serviceCode,
                    alphaResult: [],
                    testConfiguration: singleData.testConfiguration,
                    isDeleted: false,
                  });
                existingTestSet.add(testKey);
            }
        }
      } 
  
  
      // Insert only the unique tests
      if (inputArray.length > 0) {
        const result = await LabTestConfiguration.insertMany(inputArray);
        return sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: "Tests added successfully",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: "No new test added",
          errorCode: null,
        });
      }
    } catch (error) {
      console.log("error___", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error",
        errorCode: null,
      });
    }
};

export const bulkImportLabMainTest = async (req, res) => {
    const headers = {
        Authorization: req.headers["authorization"],
    };

    try {
        const filePath = "./uploads/" + req.filename;
        const data = await processExcel(filePath);
        fs.unlinkSync(filePath);

        const isValidFile = validateColumnWithExcel(LabMainTestColumns, data[0]);
        if (!isValidFile) {
            return sendResponse(req, res, 500, {
                status: false,
                message: "Invalid excel sheet! Column not matched.",
                errorCode: null,
            });
        }

        // Fetch existing lab tests
        const existingTests = await LabTest.find({ isDeleted: false }).select("labId testName").lean();
        const existingTestSet = new Set(existingTests.map(item => `${item.labId}-${item.testName}`));

        // Loinc Code Cache
        const loincCache = new Map();

        // **Process Data in Parallel**
        const testPromises = data.map(async (singleData) => {
            const testKey = `${req.body.labId}-${singleData.testName}`;
            if (existingTestSet.has(testKey)) return null; // Skip duplicates

            // Fetch SubTests
            const findSubTests = await LabTestConfiguration.find({
                labId: mongoose.Types.ObjectId(req.body.labId),
                isDeleted: false,
                serviceCode: singleData?.lonicCode
            });

            let loincObject = null;
            if (singleData?.lonicCode) {
                if (!loincCache.has(singleData.lonicCode)) {
                    const findLonicCodeDetails = await httpService.postStaging(
                        `superadmin/get-lonic-code-by-code`,
                        { code: singleData.lonicCode, description: singleData.testName }, // Ensure description is sent
                        headers,
                        'superadminServiceUrl'
                    );

                    if (findLonicCodeDetails?.status && findLonicCodeDetails?.body?.length > 0) {
                        const loincData = findLonicCodeDetails.body[0];
                        loincObject = {
                            loincId: mongoose.Types.ObjectId(loincData._id),
                            loincCode: loincData.loincCode
                        };
                        loincCache.set(singleData.lonicCode, loincObject);
                    }
                } else {
                    loincObject = loincCache.get(singleData.lonicCode);
                }
            }

            return {
                labId: req.body.labId,
                testName: singleData.testName,
                tests: findSubTests.map(subTest => ({
                    testId: subTest._id,
                    testName: subTest.testName
                })),  
                loinc: loincObject,
                testFees: singleData.fees || "0",
                notes: singleData.notes || "",
                isDeleted: false
            };
        });

        const inputArray = (await Promise.all(testPromises)).filter(test => test !== null);

        if (inputArray.length > 0) {
            await LabTest.insertMany(inputArray);
            return sendResponse(req, res, 200, {
                status: true,
                message: "Unique tests added successfully",
                errorCode: null,
            });
        } else {
            return sendResponse(req, res, 200, {
                status: true,
                message: "No new tests added",
                errorCode: null,
            });
        }

    } catch (error) {
        console.log("Error:", error);
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
};