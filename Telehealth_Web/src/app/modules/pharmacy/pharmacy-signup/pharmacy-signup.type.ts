import { UserDetails } from "../pharmacy-login/pharmacy-login.type";

export interface ISignup {
  user_name: string;
  email: string;
  phone_number: string;
  pharmacy_name: string;
  password: string;
  confirm_password: string;
  accept_terms: boolean;
  country_code: string;
  first_name:string;
  middle_name: string;
  last_name: string;
}

export type IRegisterRequest = Omit<
  ISignup,
  "confirm_password" | "accept_terms"
>;

export interface IRegisterResponse {
  user_details: UserDetails;
}
