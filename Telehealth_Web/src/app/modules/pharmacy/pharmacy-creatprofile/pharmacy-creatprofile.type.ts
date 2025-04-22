export interface IProfileRequest {
  for_portal_user: string;
  email:string;
  loc: Object;
  pharmacy_name: string;  
  pharmacy_name_arabic: string;  
  slogan: string;
  main_phone_number: string;
  additional_phone_number: string[];
  about_pharmacy: string;
  profile_picture: string;
  licence_details: {
    id_number: string;
    expiry_date: string;
    licence_picture: string;
  };
  address: string;
  location_info: {
    nationality: string;
    neighborhood: string;
    region: string;
    province: string;
    department: string;
    city: string;
    village: string;
    pincode: string;
  };
  pharmacy_picture
}

export interface IProfileResponse {
  adminData: string;
}

export interface IFileUploadResult {
  ETag: string;
  ServerSideEncryption: string;
  VersionId: string;
  Location: string;
  Key: string;
  Bucket: string;
}
