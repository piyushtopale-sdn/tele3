export interface INewOrderRequest {
  from_user: IUserData;
  patient_details: IOrderConfirm;
  request_type: RequestOrderType;
  for_portal_user: Array<string>;
  prescription_url: Array<string>;
  subscriber_id: String;
  medicine_list: IMedicineData[];
  eprescription_number: any;
  action: string;
  orderBy:IUserData
  // orderFor:string;
}

export interface INewOrderResponse {
  orderData: IUniqueId;
  medicineDetails: IUniqueId;
  medicineBill: IUniqueId;
}

export interface IUniqueId {
  id: string;
}

export type RequestOrderType =
  | "order_request"
  | "medicine_price_request"
  | "medicine_availability_request"
  | "NA";

interface IUserData {
  user_id: string;
  user_name: string;
}

interface IOrderConfirm extends IUserData {
  order_confirmation: boolean;
}

export interface IMedicineData {
  name: string;
  medicine_id: string;
  quantity_data: {
    prescribed: string;
  };
  frequency: string;
  duration: string;
}

export interface IDocMetaDataRequest {
  name: string;
  code: string;
  e_tag: string;
  issued_date: string;
  expiry_date: any;
  url: string;
  is_deleted: boolean;
  uploaded_by: string;
  for_portal_user: string;
}

export interface IDocMetaDataResponse {
  _id: string;
  __v: number;
  createdAt: string;
  updatedAt: string;
}
export interface ISubscriberData extends IDocMetaDataResponse {
  subscriber_type: string;
  subscription_for: string;
  health_plan_for: string;
  subscriber_full_name: string;
  subscriber_first_name: string;
  subscriber_middle_name: string;
  subscriber_last_name: string;
  date_of_birth: string;
  age: number;
  gender: string;
  insurance_id: string;
  policy_id: string;
  card_id: string;
  employee_id: string;
  insurance_holder_name: string;
  insurance_validity_from: string;
  insurance_validity_to: string;
  insurance_card_id_proof: string;
  is_deleted: boolean;
  for_user: string;
  secondary_subscriber: string;
}
