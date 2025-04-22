export interface ILocationData {
  email: string;
  userId: string;
  mode: "email" | "mobile";
  phoneNumber: string;
  countryCode: string;
}

export interface ISendOtpRequest {
  // mobile: string;
  // country_code: string;
  email:string;
}

export interface ISendEmailRequest {
  email: string;
}

export interface IVerifyOtpRequest {
  otp: string;
  for_portal_user: string;
}

export interface ISendOtpResponse {
  id: string;
}
