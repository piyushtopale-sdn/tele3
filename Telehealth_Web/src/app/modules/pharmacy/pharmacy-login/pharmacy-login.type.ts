export interface ILoginRequest {
  email: string;
  password: string;
}

interface PortalUserData {
  country_code: string;
  _id: string;
  email: string;
  password: string;
  user_name: string;
  phone_number: string;
  verified: boolean;
  lock_user: boolean;
  role: string;
  last_update: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

interface Association {
  name: any[];
}

interface AdminData {
  _id: string;
  pharmacy_name: string;
  additional_phone_number: any[];
  association: Association;
  verify_status: string;
  approved_at?: any;
  approved_or_rejected_by?: any;
  for_portal_user: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface UserDetails {
  portalUserData: PortalUserData;
  adminData: AdminData;
}

export interface ILoginResponse {
  token: string;
  refreshToken: string;
  otp_verified: boolean;
  user_details: UserDetails;
}
