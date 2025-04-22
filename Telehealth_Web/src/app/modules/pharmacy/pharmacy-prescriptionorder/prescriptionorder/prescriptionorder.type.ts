export interface IOrderListRequest extends IOrderCountRequest {
  page: number;
  limit: number;
  name: string;
  status: IOrderStatus;
  start_date: string;
  end_date: string;
  sort:any;
}

export interface IOrderCountRequest {
  for_portal_user: string;
  portal: "patient" | "pharmacy";
  patient_id: string;
  request_type: IRequestType;
}

export type IOrderStatus =
  | "new"
  | "accepted"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rejected";

export type IRequestType =
  | "order_request"
  | "medicine_price_request"
  | "medicine_availability_request";

export interface IOrderListResponse {
  order_list: IOrderList[];
  total_count: number;
}

export interface IOrderCountResponse {
  _id: string;
  count: number;
}

export interface IOrderList {
  _id: string;
  from_user: {
    user_id: string;
    user_name: string;
  };
  patient_details: {
    user_id: string;
    user_name: string;
    order_confirmation: boolean;
  };
  status: string;
  order_id: string;
  payment_type: string;
  cancelled_by: string;
  request_type: IRequestType;
  insurance_verified: false;
  for_portal_user: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  medicine_bill: {
    _id: string;
    total_medicine_cost: string;
    co_pay: string;
    insurance_paid: string;
    mode: string;
  };
}

export interface IPatientDetailsRequest {
  patient_id: string
}