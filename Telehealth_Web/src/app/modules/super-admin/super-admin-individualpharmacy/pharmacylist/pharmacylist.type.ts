export interface IPharmacyListRequest {
  page: number;
  limit: number;
  name: string;
  status: IVerifyStatus;
  // start_date: string;
  // end_date: string;
  sort: any
}

export type IVerifyStatus = "APPROVED" | "PENDING" | "DECLINED";

export interface IPharmacyListResponse {
  data: IPharmacyDetails[];
  totalCount: number;
}

export interface IPharmacyDetails {
    association: {
      enabled: boolean;
      name: string[];
    };
    licence_details: {
      id_number: string;
      expiry_date: string;
    };
    _id: string;
    pharmacy_name: string;
    verify_status: IVerifyStatus;
    for_portal_user: {
      _id: string;
      email: string;
      user_name: string;
      phone_number: string;
      verified: boolean;
      lock_user: boolean;
      isActive: boolean;
      isDeleted: boolean;
      last_update: string;
      createdAt: string;
      updatedAt: string;
      __v: number;
    };
    address: string;
}

export interface IPharmacyData {
  pharmacy_name: string;
  //   ifu_number: number;
  licence_id: string;
  //   rccm_number: number;
  email: string;
  phone_number: string;
  address: string;
  lock_user: boolean;
  isActive: boolean;
  createdAt: Date;
  id: string;
  portal_user_id: string;
}

export interface IPharmacyApproveRequest {
    verify_status: IVerifyStatus, 
    id: string, 
    approved_or_rejected_by: string
}

export interface IPharmacyApproveResponse {
    "association": {
        "name": string[]
    },
    "_id": string,
    "pharmacy_name": string,
    "additional_phone_number": string[],
    "verify_status": IVerifyStatus,
    "approved_at"?: string,
    "approved_or_rejected_by": string,
    "for_portal_user": string,
    "createdAt": string,
    "updatedAt": string,
    "__v": 0
}

export interface IPharmacyLockRequest {
    id: string, 
    lock_user: boolean
}