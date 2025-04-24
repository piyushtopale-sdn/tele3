import { sendResponse } from "../../helpers/transmission";
import Medicine from '../../models/medicine'

export const addMedicine = async (req, res) => {
    try {
        const {
            registerNumber,
            registerYear,
            productType,
            drugType,
            subType,
            scientificName,
            scientificNameArabic,
            tradeName,
            tradeNameArabic,
            strength,
            strengthUnit,
            pharmaceuticalForm,
            administrationRoute,
            ATCCode1,
            ATCCode2,
            size,
            sizeUnit,
            packageType,
            packageSize,
            legalStatus,
            productControlDistributeArea,
            publicPrice,
            pricingDate,
            shelfLife,
            storageConditions,
            marketingCompany,
            marketingCountry,
            manufactureName,
            manufactureCountry,
            manufactureName2,
            manufactureCountry2,
            secondaryPackageManufacture,
            mainAgent,
            secondAgent,
            thirdAgent,
            marketingStatus,
            authorizationStatus,
        } = req.body

        const getMedicine = await Medicine.find({ scientificName, isDeleted: false })

        if (getMedicine.length > 0) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Medicine already exist",
                errorCode: null,
            });
        }

        const addObject = {
            registerNumber,
            registerYear,
            productType,
            drugType,
            subType,
            scientificName,
            scientificNameArabic,
            tradeName,
            tradeNameArabic,
            strength,
            strengthUnit,
            pharmaceuticalForm,
            administrationRoute,
            ATCCode1,
            ATCCode2,
            size,
            sizeUnit,
            packageType,
            packageSize,
            legalStatus,
            productControlDistributeArea,
            publicPrice,
            pricingDate,
            shelfLife,
            storageConditions,
            marketingCompany,
            marketingCountry,
            manufactureName,
            manufactureCountry,
            manufactureName2,
            manufactureCountry2,
            secondaryPackageManufacture,
            mainAgent,
            secondAgent,
            thirdAgent,
            marketingStatus,
            authorizationStatus,
            addedBy: req.user._id
        }

        const addMedicineData = new Medicine(addObject)
        await addMedicineData.save()

        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "New medicine added successfully",
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

export const editMedicine = async (req, res) => {
    try {
        const {
            medicineId,
            registerNumber,
            registerYear,
            productType,
            drugType,
            subType,
            scientificName,
            scientificNameArabic,
            tradeName,
            tradeNameArabic,
            strength,
            strengthUnit,
            pharmaceuticalForm,
            administrationRoute,
            ATCCode1,
            ATCCode2,
            size,
            sizeUnit,
            packageType,
            packageSize,
            legalStatus,
            productControlDistributeArea,
            publicPrice,
            pricingDate,
            shelfLife,
            storageConditions,
            marketingCompany,
            marketingCountry,
            manufactureName,
            manufactureCountry,
            manufactureName2,
            manufactureCountry2,
            secondaryPackageManufacture,
            mainAgent,
            secondAgent,
            thirdAgent,
            marketingStatus,
            authorizationStatus,
        } = req.body

        let checkMedicineExists = await Medicine.find({ scientificName, _id: { $ne: medicineId }, isDeleted: false })
        if (checkMedicineExists.length > 0) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Medicine already exist",
                errorCode: null,
            });
        }

        await Medicine.findOneAndUpdate(
            { _id: { $eq: medicineId } },
            {
                $set: { 
                    registerNumber,
                    registerYear,
                    productType,
                    drugType,
                    subType,
                    scientificName,
                    scientificNameArabic,
                    tradeName,
                    tradeNameArabic,
                    strength,
                    strengthUnit,
                    pharmaceuticalForm,
                    administrationRoute,
                    ATCCode1,
                    ATCCode2,
                    size,
                    sizeUnit,
                    packageType,
                    packageSize,
                    legalStatus,
                    productControlDistributeArea,
                    publicPrice,
                    pricingDate,
                    shelfLife,
                    storageConditions,
                    marketingCompany,
                    marketingCountry,
                    manufactureName,
                    manufactureCountry,
                    manufactureName2,
                    manufactureCountry2,
                    secondaryPackageManufacture,
                    mainAgent,
                    secondAgent,
                    thirdAgent,
                    marketingStatus,
                    authorizationStatus,
                }
            },
        )

        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "medicine updated successfully",
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

export const updateMedicineByAction = async (req, res) => {
    try {
        const {
            medicineId,
            actionName,
            actionValue,
            medicineIds
        } = req.body

        if (actionName == 'isDeleted' && medicineIds.length > 0) {
            await Medicine.updateMany(
                {
                    _id: { $in: medicineIds },
                },
                {
                    $set: {
                        [actionName]: actionValue
                    }
                }
            )
        } else {
            await Medicine.findOneAndUpdate(
                {
                    _id: medicineId,
                },
                {
                    $set: {
                        [actionName]: actionValue
                    }
                }
            )  
        }

        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: `medicine ${actionName == 'isDeleted' ? 'deleted' : 'updated'} successfully`,
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

export const listMedicine = async (req, res) => {
    try {
        const { page, limit, searchText, fromDate, toDate } = req.query

        let search_filter = [{}]
        if (searchText) {
            search_filter = [
                { scientificName: {$regex: searchText || '', $options: "i"} },
                { tradeName: {$regex: searchText || '', $options: "i"} }
            ]
        }
        let date_filter = {}
        if(fromDate && toDate) {
            const fromDateObj = new Date(`${fromDate} 00:00:00`);
            const toDateObj = new Date(`${toDate} 23:59:59`);
            date_filter = {
              createdAt: { $gte: fromDateObj, $lte: toDateObj }
            }
        }

        let match = {
            isDeleted: false,
            $or: search_filter,
            $and: [
                date_filter
            ]
        }

        const pipeline = [
            {
                $match: match
            },
            {
                $group: {
                    _id: "$_id",
                    scientificName: { $first: "$scientificName"},
                    tradeName: { $first: "$tradeName"},
                    status: { $first: "$status"},
                    authorizationStatus: { $first: "$authorizationStatus"},
                    registerNumber: { $first: "$registerNumber"},
                    createdAt: { $first: "$createdAt"}
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
        ]
        if (limit != 0) {
            pipeline.push(  {
                $facet: {
                    totalCount: [
                        {
                            $count: 'count'
                        }
                    ],
                    paginatedResults: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit * 1}
                    ]
                }
            })
        }

        const result = await Medicine.aggregate(pipeline)
        let totalCount = limit == 0 ? result.length : 0
        if (limit != 0 && result[0].totalCount.length > 0) {
            totalCount = result[0].totalCount[0].count
        }


        return sendResponse(req, res, 200, {
            status: true,
            message: "Medicine fetched successfully",
            body: {
                totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
                currentPage: page,
                totalRecords: totalCount,
                result: limit == 0 ? result : result[0].paginatedResults
            },
            errorCode: null,
        })
    } catch (error) {
        console.error("An error occurred:", error);
        return sendResponse(req, res, 500, {
          status: false,
          body: null,
          message: "failed to get list",
          errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}
export const getMedicineById = async (req, res) => {
    try {
        const { id } = req.params

        const result = await Medicine.findById(id)

        return sendResponse(req, res, 200, {
            status: true,
            message: "Medicine fetched successfully",
            body: result,
            errorCode: null,
        })
    } catch (error) {
        console.error("An error occurred:", error);
        return sendResponse(req, res, 500, {
          status: false,
          body: null,
          message: "failed to get list",
          errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const allMedicineListforexport = async (req, res) => {
    const { searchText, limit, page } = req.query
    let filter
    if (searchText == "") {
      filter = {
        isDeleted: false
      }
    } else {
      filter = {
        isDeleted: false,
        team: { $regex: searchText || '', $options: "i" },
      }
    }
    try {
      let result = '';
      if (limit > 0) {
        result = await Medicine.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      }
      else {
        result = await Medicine.aggregate([{
          $match: filter
        },
        { $sort: { "createdAt": -1 } },
        {
          $project: {
            _id: 0,
            status: 0,
            isDeleted: 0,
            addedBy: 0,
            createdAt: 0,
            updatedAt: 0,
            __v: 0
          }
        }
        ])
      }
      let array = result.map(obj => Object.values(obj));
      return sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          array
        },
        message: `Data exported successfully`,
        errorCode: null,
      });
    } catch (err) {
      
        return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to export data`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
}