export interface FromUser {
    user_id: string;
    user_name: string;
}

export interface PatientDetails {
    user_id: string;
    user_name: string;
    order_confirmation: boolean;
}

export interface OrderData {
    _id: string;
    from_user: FromUser;
    patient_details: PatientDetails;
    status: string;
    order_id: string;
    payment_type: string;
    cancelled_by: string;
    request_type: string;
    subscriber_id: string;
    insurance_no: string;
    insurance_verified: boolean;
    for_portal_user: string;
    createdAt: Date;
    updatedAt: Date;
    __v: number;
}

export interface QuantityData {
    delivered: any;
    prescribed: string;
}

export interface MedicineDetail {
    price_per_unit: any;
    total_cost: any;
    available: any;
    _id: string;
    name: string;
    medicine_id?: any;
    quantity_data: QuantityData;
    frequency: string;
    duration: string;
    in_medicine_bill: string;
    for_order_id: string;
    for_portal_user: string;
    __v: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface MedicineBill {
    insurance_paid: any;
    co_pay: any;
    total_medicine_cost: any;
    _id: string;
    prescription_url?: any;
    for_order_id: string;
    for_portal_user: string;
    createdAt: Date;
    updatedAt: Date;
    __v: number;
}

export interface IOrderDetailsResponse {
    orderData: OrderData;
    medicineDetails: MedicineDetail[];
    medicineBill: MedicineBill;
    medicineNameObject: any;
}

export interface IOrderDetailsRequest {
    for_portal_user: string;
    for_order_id: string;
}

export interface IOrderUpdateRequest extends IOrderDetailsRequest {
    medicine_bill: {
        total_medicine_cost: string; 
        co_pay: string;
        insurance_paid: string;
    },
    in_medicine_bill: string;
    medicine_details: Partial<MedicineDetail>[];
    request_type: string;
    status: string;
}

export type IOrderConfimRequest = Partial<OrderData>;

export type IMedicineConfirmResponse = Pick<IMedicineUpdateResponse, "medicineBillResult">;

export type IOrderCancelResponse = Pick<IMedicineUpdateResponse, "orderDataResult">;

export interface ISignedUrlRequest {
    url: string;
}

export interface IMedicineBillUpdateResult {
    acknowledged: boolean;
    matchedCount: number;
    modifiedCount: number;
    upsertedCount: number;
    upsertedId: any;
}

export interface IMedicineUpdateResponse {
    medicineBillResult: IMedicineBillUpdateResult;
    orderDataResult: IMedicineBillUpdateResult;
    medicineDetailResult: MedicineDetail[];
}

export interface IDocumentMetaDataResponse {
    _id: string;
    name: string;
    code: string;
    e_tag: string;
    issued_date: Date;
    expiry_date?: any;
    url: string;
    is_deleted: boolean;
    uploaded_by: string;
    for_portal_user: string;
    __v: number;
    createdAt: Date;
    updatedAt: Date;
}