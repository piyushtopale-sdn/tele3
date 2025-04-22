import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { identity, Observable, throwError, of, BehaviorSubject } from "rxjs";
import { AuthService } from "src/app/shared/auth.service";
import { environment } from "src/environments/environment";
import {
  ISendEmailRequest,
  ISendOtpResponse,
} from "./super-admin-entercode/super-admin-entercode.type";
import { IResponse } from "src/app/shared/classes/api-response";
import { ApiEndpointsService } from "src/app/core/services/api-endpoints.service";
import { ApiHttpService } from "../../core/services/api-http.service";
import { catchError, map } from "rxjs/operators";
import { CoreService } from "src/app/shared/core.service";

@Injectable()
export class SuperAdminService {
  param: any;
  private superAdminURL = "";
  private shareprofiledata = new BehaviorSubject<string>('');

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private apiHttpService: ApiHttpService,
    private coreService: CoreService,
    private apiEndpointsService: ApiEndpointsService
  ) {
    this.param = {
      module_name: this.auth.getRole(),
    };
  }

  getHeader(token: any, deviceId: any = "") {

    const httpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      role: "superadmin",
      Authorization: `Bearer ${token}`,
      uuid: localStorage.getItem("deviceId"),
    });
    return httpHeaders;
  }

  getHeaderLogOut(token: any) {
    const httpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      role: "superadmin",
      Authorization: `Bearer ${token}`,
      uuid: localStorage.getItem("deviceId"),
    });
    return httpHeaders;
  }

  getHeaderFormdata(token: any) {
    const httpHeaders = new HttpHeaders({
      // "Accept": "application/json",
      // "Content-Type": "multipart/form-data",
      role: "superadmin",
      // Authorization: `Bearer ${token}`,
      "uuid": localStorage.getItem('deviceId')
    });
    return httpHeaders;
  }

  getBasePath() {
    return environment.apiUrl;
  }

  private handleError(err: HttpErrorResponse) {
    let errorMessage = "";
    if (err.error instanceof ErrorEvent) {
      errorMessage = err.error.message;
    } else {
      errorMessage = err.error.errorCode;
    }
    return throwError(() => new Error(errorMessage));
  }

  private handleResponse<T>(response: T) {
    if (environment.production) {
      return this.coreService.decryptContext(response as unknown as string);
    }
    return response;
  }

  addInsSuperAdmin(data: any) {
    return this.http.post(
      this.getBasePath() + `/insurance/insurance-admin-signup`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  getVerificationCodeMobile(data: any) {
    return this.http.post(
      this.getBasePath() + `/superadmin/send-sms-otp-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  getVerificationCodeEmail(data: any) {
    return this.http.post(
      this.getBasePath() + `/superadmin/send-email-otp-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  verifyMobileOtp(data: any): Observable<any> {
    return this.http.post(
      this.getBasePath() + `/superadmin/match-sms-otp-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  verifyEmailOtp(data: any): Observable<any> {
    return this.http.post(
      this.getBasePath() + `/superadmin-service/superadmin/match-email-otp-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  login(data: any) {
    return this.http.post(this.getBasePath() + `/superadmin/login`, data, {
      headers: this.getHeader(""),
    });
  }

  logoutApi() {
    let token = this.auth.getToken();
    return this.http.post( this.getBasePath() +`/superadmin-service/superadmin/logout`,
      {}, { headers: this.getHeaderLogOut(token) });
  }

  getPendingData(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin/get-insurance-admin-not-approved-list`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getApprovedData(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin/get-insurance-admin-approved-list`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }



  getRejectData(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin/get-insurance-admin-rejected-list`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getAllHospitalList(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/get-hospital-list`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getInsuranceAdminDetails(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin/get-insurance-details`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getTemplate() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin/get-insurance-template-list`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateInsAdminStatus(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin/approve-or-reject-insurance-admin`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateInsAdminStatusWithTemp(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin/set-insurance-template`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getPlan(
    page: any,
    limit: any,
    plan_name: any,
    plan_for: any,
    is_activated: any,
    sort: any
  ) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/superadmin/all-subscription-plans?limit=${limit}&page=${page}&is_deleted=false&is_activated=${is_activated}&plan_name=${plan_name}&plan_for=${plan_for}&sort=${sort}`,
      { headers: this.getHeader(token) }
    );
  }

  addPlan(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/superadmin/create-subscription-plan`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updatePlan(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/superadmin-service/superadmin/update-subscription-plan`,
      data,
      { headers: this.getHeader(token) }
    );
  }

  // deletePlan(_id: any) {
  //   let token = this.auth.getToken();
  //   return this.http.post(
  //     this.getBasePath() +
  //     `/superadmin-service/superadmin/delete-subscription-plan`,
  //     { _id },
  //     { headers: this.getHeader(token) }
  //   );
  // }

  deletePlan(_id: any) {
    let token = this.auth.getToken();
    return this.http.delete(
      this.getBasePath() +
      `/superadmin-service/superadmin/delete-subscription-plan/${_id}`,
      { 
        params : {
          id :_id,
          action_name:"delete", 
          action_value:"true"
        },
        headers: this.getHeader(token) }
    );
  }

  getPlanFor(plan_for: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/superadmin/get-service-field?plan_for=${plan_for}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getCoupon() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/subscription/generate-coupon`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getDiscount(
    page: any,
    limit: any,
    searchText: any,
    status: any,
  ) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/subscription/list-coupon?limit=${limit}&page=${page}&searchText=${searchText}&status=${status}`,
      { headers: this.getHeader(token) }
    );
  }

  getDiscountLab(param:any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/subscription/list-coupon-lab`,
      {
        params:param,
        headers: this.getHeader(token) 
      }
    );
  }


  getAllSubscriptionPan() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/list-subscription-plans`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addDiscountPlan(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/subscription/create-discount`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteDiscountPlan(_id: any) {
    let token = this.auth.getToken();
    return this.http.delete(
      this.getBasePath() +
      `/superadmin-service/subscription/delete-discount/${_id}`,
      { headers: this.getHeader(token) }
    );
  }

  getPeriodicList() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/get-periodic-list`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getPlanDetails(data) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/superadmin/get-subscription-plan-details?id=${data.id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  //...........forgotPassword.............
  forgotPassword(body: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin/forgot-password`,
      body,
      {
        headers: this.getHeader(token),
      }
    );
  }

  //...........resetPassword...........
  setNewPassword(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin/reset-forgot-password`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  //......AddMEDICINE.......
  addMedicine(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/medicine/add-medicine`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  //..........MedicineList......
  getmedicineList(page: any, limit: any, searchText: string, sort = '', fromDate: string, toDate: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/medicine/get-medicine?limit=${limit}&page=${page}&searchText=${searchText}&sort=${sort}&fromDate=${fromDate}&toDate=${toDate}`,
      { headers: this.getHeader(token) }
    );
  }

  listMedicineforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/medicine/exportsheetlist-medicine?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  //... upload excel medicine
  public uploadExcelMedicine(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/superadmin/upload-csv-for-medicine`,
      formData,
      { headers: this.getHeaderFormdata(token) }
    );
  }

  //...update medicine

  public updateMedicine(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/medicine/update-medicine`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  //--------Delete Medicine---------
  public deleteMedicine(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/medicine/delete-active-inactive-medicine`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  //----Association Group API's--------------

  listPharmacy(searchKey: any = "") {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/pharmacy/get-all-pharmacy?searchKey=${searchKey}`,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }


  getPharamacyAcceptedListPatient(insuranceId: any = "") {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/pharmacy-service/claim/getPharamacyAcceptedListPatient?insuranceId=${insuranceId}`,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }

  listHospital(searchKey: any = "") {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/get-all-hospital?searchKey=${searchKey}`,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }

  addAssociationGroup(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin/create-association-group`,
      formData,
      { headers: this.getHeaderFormdata(token) }
    );
  }
  addmanualMedicinClaim(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/superadmin/addmanualMedicinClaim`,
      formData,
      { headers: this.getHeaderFormdata(token) }
    );
  }
  getviewofmanualmedicinClaim(id: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/superadmin/getviewofmanualmedicinClaim?id=${id}`,
      { headers: this.getHeader(token) }
    );
  }

  listAssociationGroup(page: any, limit: any, searchKey: any = "", sort: any = '') {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin/list-association-group?page=${page}&limit=${limit}&searchKey=${searchKey}&sort=${sort}`,
      { headers: this.getHeader(token) }
    );
  }

  viewAssociationGroup(groupID: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin/view-association-group?groupID=${groupID}`,
      { headers: this.getHeader(token) }
    );
  }

  updateAsscociationGroup(formData) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin/edit-association-group`,
      formData,
      { headers: this.getHeaderFormdata(token) }
    );
  }

  editPharmacyForAssociationGroup(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/superadmin/edit-pharmacy-association-group`,
      data,
      { headers: this.getHeader(token) }
    );
  }

  deleteAssociationGeroup(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin/delete-active-lock-association-group`,
      data,
      { headers: this.getHeader(token) }
    );
  }
  deletemanualmedicinClaim(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/superadmin/deletemanualmedicinClaim`,
      data,
      { headers: this.getHeader(token) }
    );
  }

  pharmacyList(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/pharmacy/list-pharmacy-admin-user`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  addMaximumReq(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin/set-maximum-request`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  public getPharmacyDetails(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/pharmacy-service/pharmacy/pharmacy-admin-details`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  public approveRejectPharmacy(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/pharmacy-service/pharmacy/approve-or-reject-pharmacy`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  public getcountrylist() {
    let token = this.auth.getToken();

    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/country-list`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  public getRegionListByCountryId(countryId: any) {
    let token = this.auth.getToken();

    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/region-list?country_id=${countryId}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  public getProvinceListByRegionId(regionId: any) {
    let token = this.auth.getToken();

    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/province-list?region_id=${regionId}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  public getDepartmentListByProvinceId(provinceId: any) {
    let token = this.auth.getToken();

    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/department-list?province_id=${provinceId}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  public getCityListByDepartmentId(departmentId: any) {
    let token = this.auth.getToken();

    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/city-list?department_id=${departmentId}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  public getVillageListByDepartmentId(departmentId: any) {
    let token = this.auth.getToken();

    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/village-list?department_id=${departmentId}`,
      {
        headers: this.getHeader(token),
      }
    );
  }



  spokenLanguage() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/common-api`,
      { headers: this.getHeader(token) }
    );
  }

  //...............allRole..................
  allRole(userId: string) {
    let token = this.auth.getToken();
    let roleInfo;
    if (this.auth.getRole() == "super-admin") {
      roleInfo = "superadmin";
    } else {
      roleInfo = this.auth.getRole();
    }

    return this.http.get(this.getBasePath() + `/role/all-role`, {
      params: {
        userId,
        module_name: roleInfo,
      },
      headers: this.getHeader(token),
    });
  }

  //.............AddStaff............
  addStaff(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin/add-staff`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }

  getAllStaff(paramsData: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/superadmin/list-staff`, {
      params: paramsData,
      headers: this.getHeaderFormdata(token),
      // headers: this.getHeader(token),
    });
  }

  getAllStaffforChat(paramsData: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/superadmin/list-staff-forchat`, {
      params: paramsData,
      headers: this.getHeaderFormdata(token),
      // headers: this.getHeader(token),
    });
  }

  getStaffDetails(staffID: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin/view-staff-details?userId=${staffID}`,
      { headers: this.getHeader(token) }
    );
  }

  //...................editStaff.................

  editStaff(formData) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin/edit-staff`,
      formData,
      { headers: this.getHeaderFormdata(token) }
    );
  }

  deleteActiveAndLockStaff(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin/delete-active-lock-staff`,
      data,
      { headers: this.getHeader(token) }
    );
  }

  getTotalClaims(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/pharmacy-service/claim/medicine-claim-list-for-association-group`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  gettAllStaffListing(paramsData: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/superadmin/get-all-staff`, {
      params: paramsData,
      headers: this.getHeader(token),
      // headers: this.getHeader(token),
    });
  }

  asignMenuSubmit(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/menu/add-user-menu`, data, {
      params: {
        module_name: "superadmin",
      },
      headers: this.getHeader(token),
    });
  }

  addSubmenusInfo(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/menu/add-submenu-permission`,
      data,
      { params: { module_name: "superadmin" }, headers: this.getHeader(token) }
    );
  }
  getUserMenus(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/menu/all-user-menu`, {
      params,
      headers: this.getHeader(token),
    });
  }

  getMenus(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/menu/all-menus`, {
      params,
      headers: this.getHeader(token),
    });
  }
  submenudatabyuser(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/menu/get-submenu-by-user`, {
      params,
      headers: this.getHeader(token),
    });
  }
  getSubMenus(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/menu/all-submenus`, {
      params,
      headers: this.getHeader(token),
    });
  }

  //super-admin-speciality

  addSpeciality(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/speciality/add`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  listSpeciality(reqData: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/speciality/speciality-list?limit=${reqData.limit}&page=${reqData.page}&searchText=${reqData.searchText}&sort=${reqData.sort}&fromDate=${reqData.fromDate}&toDate=${reqData.toDate}`,

      {
        headers: this.getHeader(token),
      }
    );
  }

  listSpecialitypatient(reqData: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/speciality/speciality-list?limit=${reqData.limit}&page=${reqData.page}&searchText=${reqData.searchText}`,

      {
        headers: this.getHeader(token),
      }
    );
  }

  allSpecialtyListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor2/export-speciality?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateSpeciality(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/speciality/update`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteSpeciality(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/speciality/action`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  uploadSpecialityApi(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/upload-csv-for-specialty`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }
  // master-eyeglassess
  addEyeglassessApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/add-eyeglass-master`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  listEyeglassessApi(reqData: any): Observable<any> {
    let token = this.auth.getToken();
    // let token = this.auth.getToken());

    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/list-eyeglass-master?page=${reqData.page}&limit=${reqData.limit}&searchText=${reqData.searchText}&sort=${reqData.sort}`,

      {
        headers: this.getHeader(token),
      }
    );
  }

  listEyeglassMasterforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/eyeglasses-list-export?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateEyeglassessApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/update-eyeglass-master`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteEyeglassessApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/active-delete-eyeglass-master`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  uploadExcelEyeGlasses(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/upload-csv-for-eyeglass-master`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }

  // master-Others
  addOthersApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/add-others-test-master`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  listOthersApi(reqData: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/others-test-master-list?searchText=${reqData.searchText}&limit=${reqData.limit}&page=${reqData.page}&sort=${reqData.sort}`,

      {
        headers: this.getHeader(token),
      }
    );
  }

  othersTestTestMasterListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/otherstest-list-export?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateOthersApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/others-test-master-edit`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteOthersApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/others-test-master-action`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadExcelOthers(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/upload-csv-for-others-test`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }
  otherInfoDetailsApi(otherID: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/others-test-master-details?otherTestId=${otherID}`,
      { headers: this.getHeader(token) }
    );
  }

  // master-Vaccination
  addVaccinationApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/add-vaccination-master`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  listVaccinationApi(reqData: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/vaccination-master-list?searchText=${reqData.searchText}&limit=${reqData.limit}&page=${reqData.page}&sort=${reqData.sort}`,

      {
        headers: this.getHeader(token),
      }
    );
  }

  vaccinationTestMasterListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/vaccination-master-list-export?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateVaccinationApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/vaccination-master-edit`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteVaccinationApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/vaccination-master-action`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadExcelVaccination(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/upload-csv-for-vaccination-test`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }


  // master-Imaging
  addImagingApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/add-imaging-test-master`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  listImagingApi(reqData: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/imaging-test-master-list?searchText=${reqData.searchText}&limit=${reqData.limit}&page=${reqData.page}&sort=${reqData.sort}`,

      {
        headers: this.getHeader(token),
      }
    );
  }

  imagingTestMasterListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/imaging-test-master-list-export?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }


  updateImagingApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/imaging-test-master-edit`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteImagingApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/imaging-test-master-action`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadExcelImaging(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/upload-csv-for-imaging-test`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }
  otherImagingDetailsApi(imagingID: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/imaging-test-master-details?imagingTestId=${imagingID}`,
      { headers: this.getHeader(token) }
    );
  }

  // labtest
  labAddTest(data: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/add-lab-test-master`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  getLabListData(page: any, limit: any, searchText: string, sort: string = '') {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/lab-test-master-list?searchText=${searchText}&limit=${limit}&page=${page}&sort=${sort}`,
      {
        headers: this.getHeader(token),
      }
    );
  }


  getLabListDataexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/lab-test-master-list-export?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }


  updateLabAddTest(data: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/lab-test-master-edit`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  deleteLabs(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/lab-test-master-action`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  getLabDataId(labTestId: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/lab-test-master-details?labTestId=${labTestId}`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  //... upload excel lab
  public uploadExcelLab(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/upload-csv-for-lab-test`,
      formData,
      { headers: this.getHeaderFormdata(token) }
    );
  }

  public getAddMaximumReq(userId: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/superadmin/get-maximum-request?userId=${userId}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  // content-mangement
  addfaqApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/content-management/add-faq`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addContactusApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/content-management/edit-contact-us-en`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addContactusApiFr(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/content-management/edit-contact-us-fr`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getallFaq(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/content-management/all-faq`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }


  getAboutUsfr() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/content-management/get-about-us-fr`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  getAboutUsen() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/content-management/get-about-us-en`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  editAboutusEn(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/content-management/edit-about-us-en`,
      formData,
      {
        headers: this.getHeader(token),
      }
    );
  }
  editAboutusFr(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/content-management/edit-about-us-fr`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getAboutUs(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/content-management/get-about-us`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }
  // contactus
  getContactus(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/content-management/get-contact-us`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }
  // privacyAndcondition
  getlistpNcEn() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/content-management/get-privacy-condition-en`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  getlistpNcFr() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/content-management/get-privacy-condition-fr`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getlistpNc(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/content-management/get-privacy-condition`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  editpNcEn(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/content-management/edit-privacy-condition-en`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  editpNcFr(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/content-management/edit-privacy-condition-fr`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  // termsAndConditiom
  getlistTNCEn() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/content-management/get-terms-condition-en`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  getlistTNCFr() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/content-management/get-terms-condition-fr`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getlistTNC(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/content-management/get-terms-condition`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }
  editTNCEn(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/content-management/edit-terms-condition-en`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  editTNCFr(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/content-management/edit-terms-condition-fr`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  // videoEditor
  listVideo(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/content-management/get-video`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }
  addVideoApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/content-management/add-video`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  editVideoApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/content-management/edit-video`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  deleteVideoApi(videoId: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/content-management/delete-video`,
      videoId,
      {
        headers: this.getHeader(token),
      }
    );
  }

  // blog
  blogListApi(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/content-management/get-blog`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }
  addBlogApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/content-management/add-blog`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  editBlogApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/content-management/edit-blog`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  deleteBlogApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/content-management/delete-blog`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }



  // article
  articleListApi(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/content-management/get-article`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }
  addArticleApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/content-management/add-article`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  editArticleApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/content-management/edit-article`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  deleteArticleApi(articleId: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/content-management/delete-article`,
      articleId,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addOndutyGroupPhar(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/pharmacy-service/pharmacy/add-on-duty-group`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadBulkCsvDutyGroup(formdata: FormData) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/pharmacy-service/pharmacy/upload-on-duty-group-csv`,
      formdata,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }

  listDutyGroup(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/pharmacy-service/pharmacy/list-on-duty-group`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getOnDutyGroupDetails(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/pharmacy-service/pharmacy/get-on-duty-group`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  deleteGroup(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/pharmacy-service/pharmacy/delete-on-duty-group`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteOnDutyGroupMasterAction(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/pharmacy-service/pharmacy/deleteOnDutyGroupMasterAction`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addPharmacyInOnDuty(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/pharmacy-service/pharmacy/add-pharmacy-on-duty-group`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadBulkCsvPharmacyDutyGroup(formdata: FormData) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/pharmacy-service/pharmacy/upload-on-duty-pharmcy-group-csv`,
      formdata,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }

  listHospitalBySuperadmin(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/list-hospital-added-by-superadmin`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  listOnDutyPharmacy(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/pharmacy-service/pharmacy/list-pharmacy-on-duty-group`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getOnDutyPhmarmacyDetails(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/pharmacy-service/pharmacy/details-pharmacy-on-duty-group`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  editPharmacyInOnDuty(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/pharmacy-service/pharmacy/edit-pharmacy-on-duty-group`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getMedicinesById(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/superadmin/get-all-medicine-byits-id`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  //hospital
  getHealthCenterTypes() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/hospital/get-health-center-types`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  addHospitalBySuperadmin(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/add-hospital`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadBulkCsvHospital(formdata: FormData) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/add-hospital-bulk-csv`,
      formdata,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }

  getHospitalDetails(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/get-hospital-details-by-superadmin`,

      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  editHospitalBySuperadmin(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/edit-hospital-by-superadmin`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteHospitalBySuperadmin(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/delete-hospital-by-superadmin`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  deleteHospitalMasterAction(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/deleteHospitalMasterAction`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  //Appointment Commision Management

  getAppointmentCommissions(params) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/get-appointment-commission`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  saveCommission(data) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/superadmin/add-or-update-appointment-commission`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }



  getLocationInfoWithNames(data: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/superadmin/get-locations-name`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  // complaint
  addComplaint(data) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/complaint-management/add-complaint-management`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }



  getComplaintList(params) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/complaint-management/all-complaint-management`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getUserComplaint(params) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/complaint-management/allDetails-complaint-management`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }
  updateComplaintResponse(data) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/complaint-management/add-response`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  getallplanPriceforSuperAdmin(params) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/getallplanPriceforSuperAdmin`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }
  gettotalMonthWiseforSuperAdmingraph(params) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/gettotalMonthWiseforSuperAdmingraph`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  addRole(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/superadmin-service/role/add-role`, data, {
      params: this.param,
      headers: this.getHeader(token),
    });
  }


  deleteRole(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/superadmin-service/role/delete-role`, data, {
      params: {
        module_name: this.auth.getRole(),
      },
      headers: this.getHeader(token),
    });
  }

  updateRole(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/superadmin-service/role/update-role`, data, {
      params: {
        module_name: this.auth.getRole(),
      },
      headers: this.getHeader(token),
    });
  }

  allRoleSuperAdmin(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/superadmin-service/role/all-role`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getAllMessagesService(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/superadmin-service/superadmin/all-message`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getRoomlistService(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/superadmin-service/superadmin/get-create-chat`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }



  getAllNotificationService(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/superadmin-service/superadmin/get-all-notification`,

      {
        params,
        headers: this.getHeader(token),
      }
    );
  }
  getlistofmanualmedicinClaim(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/getlistofmanualmedicinClaim`,


      {
        params,
        headers: this.getHeader(token),
      }
    );
  }


  updateNotificationStatus(data: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/superadmin/update-notification`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  markAllReadNotification(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/superadmin-service/superadmin/mark-all-read-notification`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  markReadNotificationById(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/superadmin-service/superadmin/mark-read-notification-id`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  clearAllMessages(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/superadmin-service/superadmin/clear-all-messages`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  clearSingleMessages(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/superadmin-service/superadmin/clear-single-message`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadFile(formData: any) {
    return this.http.post(
      this.getBasePath() + `/superadmin/upload-document`,
      formData
    );
  }
  // }

  // addMemberToExistingGroup(data:any){
  //     let token = this.auth.getToken();
  //     return this.http.put(this.getBasePath() + `/superadmin-service/superadmin/addMembers-to-GroupChat`,data,
  //       {  
  //         headers: this.getHeader(token),
  //       }
  //     );
  // }

  //--------User Invitation--------------
  invitationList(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/get-email-invitation-list`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  invitationListById(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/get-email-invitation-id`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  inviteUser(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/superadmin-service/superadmin/send-email-invitation`, data, {
      headers: this.getHeader(token),
    });
    // return of({
    //   response: { status: true, message: "Invitation Sent", ...data },
    // });
  }

  deleteInvitation(data: any) {
    // return of({ status: true, message: "Succesfully delete invitation" });
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/superadmin-service/superadmin/delete-email-invitation`, data,
      {
        headers: this.getHeader(token)
      }
    );
  }

  getallPaymentHistory(params) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/payment/get-all-payment-history`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }


  addCountry(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/superadmin-service/common-api/add-country`, data, {
      params: this.param,
      headers: this.getHeader(token),
    });
  }

  CoutryLists(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/list-country`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  updateCountryApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/common-api/edit-country`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  deleteCountryApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/delete-country`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  countryexcelListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/exportsheetlist-country?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }


  uploadExcelCountryList(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/upload-csv-for-country-list`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }
  Country_dropdownLists() {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/list-dropdowncountries`,
      {

        headers: this.getHeader(token),
      }
    );
  }
  addRegion(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/superadmin-service/common-api/add-region`, data, {
      params: this.param,
      headers: this.getHeader(token),
    });
  }


  RegionLists(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/list-region`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }


  deleteRegionApi(data: any) {

    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/delete-region`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  regionexcelListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/exportsheetlist-region?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }


  uploadExcelRegionList(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/upload-csv-for-region-list`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }

  updateRegionApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/common-api/edit-region`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }



  addProvince(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/superadmin-service/common-api/add-province`, data, {
      params: this.param,
      headers: this.getHeader(token),
    });
  }


  ProvinceLists(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/list-province`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }



  deleteProvinceApi(data: any) {

    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/delete-province`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  updateProvinceApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/common-api/edit-province`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  provinceexcelListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/exportsheetlist-province?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  uploadExcelProvinceList(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/upload-csv-for-province-list`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }
  addDepartment(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/superadmin-service/common-api/add-department`, data, {
      params: this.param,
      headers: this.getHeader(token),
    });
  }


  DepartmentLists(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/list-department`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }


  deleteDepartmentApi(data: any) {

    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/delete-department`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  updateDepartmentApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/common-api/edit-department`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  departmentexcelListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/exportsheetlist-department?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  uploadExcelDepartmentList(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/upload-csv-for-department-list`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }
  addCity(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/superadmin-service/common-api/add-city`, data, {
      params: this.param,
      headers: this.getHeader(token),
    });
  }


  CityMasterLists(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/list-city`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  CityMasteresLists(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/list-city`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }
  deleteCityApi(data: any) {

    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/delete-city`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  cityexcelListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/exportsheetlist-city?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  uploadExcelCityList(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/upload-csv-for-city-list`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }
  updateCityApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/common-api/edit-city`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  addVillage(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/superadmin-service/common-api/add-village`, data, {
      params: this.param,
      headers: this.getHeader(token),
    });
  }
  VillageMasterLists(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/list-village`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }
  deleteVillageApi(data: any) {

    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/delete-village`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  updateVillageApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/common-api/edit-village`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  villageexcelListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/exportsheetlist-village?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  uploadExcelVillageList(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/upload-csv-for-village-list`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }


  // addTeam(data: any) {
  //   let token = this.auth.getToken();
  //   return this.http.post(
  //     this.getBasePath() + `/superadmin-service/common-api/add-team`,
  //     data,
  //     {
  //       headers: this.getHeader(token),
  //     }
  //   );
  // }
  // TeamLists(paramData: any) {
  //   // return of({ status: true });
  //   let token = this.auth.getToken();
  //   return this.http.get(
  //     this.getBasePath() + `/superadmin-service/common-api/list-team`,
  //     {
  //       params: paramData,
  //       headers: this.getHeader(token),
  //     }
  //   );
  // }
  // updateTeamApi(data: any) {
  //   let token = this.auth.getToken();
  //   return this.http.put(
  //     this.getBasePath() + `/superadmin-service/common-api/update-team`,
  //     data,
  //     {
  //       headers: this.getHeader(token),
  //     }
  //   );
  // }
  // deleteTeam(data: any) {
  //   let token = this.auth.getToken();
  //   return this.http.post(
  //     this.getBasePath() + `/superadmin-service/common-api/delete-team`,
  //     data,
  //     {
  //       headers: this.getHeader(token),
  //     }
  //   );
  // }

  // allTeamListforexport(page: any, limit: any, searchText: string) {
  //   let token = this.auth.getToken();
  //   return this.http.get(
  //     this.getBasePath() +
  //     `/superadmin-service/common-api/exportsheetlist-team?searchText=${searchText}&limit=${limit}&page=${page}`,
  //     {
  //       headers: this.getHeader(token),
  //     }
  //   );
  // }

  // uploadExcelTeamList(formData: any) {
  //   let token = this.auth.getToken();
  //   return this.http.post(
  //     this.getBasePath() +
  //     `/superadmin-service/common-api/upload-csv-for-team-list`,
  //     formData,
  //     {
  //       headers: this.getHeaderFormdata(token),
  //     }
  //   );
  // }
  addDesignation(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/common-api/add-designation`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  DesignationLists(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/list-designation`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }
  updateDesignatonApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/common-api/update-designation`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteDesignation(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/common-api/delete-designation`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  allDesignationListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/exportsheetlist-designation?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadExcelDesignationList(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/upload-csv-for-designation-list`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }

  addTitle(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/common-api/add-title`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addCategory(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/category/add-category`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  TitleLists(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/list-title`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  CategoryLists(reqData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/category/get-category`,
      {
        params: reqData,
        headers: this.getHeader(token),
      }
    );
  }

  allCategoryListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/category/exportsheetlist-category?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateTitleApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/common-api/update-title`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateCategoryApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/category/update-category`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteTitle(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/common-api/delete-title`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  stausHandleCategory(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/category/delete-active-inactive-category`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }



  deleteCategories(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/category/delete-active-inactive-category`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  deleteCategory(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/category/delete-active-inactive-category`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  allTitleListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/exportsheetlist-title?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  uploadExcelTitleList(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/upload-csv-for-title-list`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }
  add_leaveType_api(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/superadmin/add-leave_types`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  leave_type_list_api(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/list-leave_types`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }
  update_leave_type_api(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/superadmin/update-leave_types`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  delete_leave_type_api(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/superadmin/delete-leave_types`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  allLeaveTypeListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/superadmin/exportsheetlist-leaveType?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }


  allHealthCentreListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital-doctor/exportsheetlist-healthcentre?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  uploadExcelHealthCentreList(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital-doctor/upload-csv-for-healthcentre-list`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }

  addLanguage(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/common-api/add-language`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  LanguageLists(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/list-language`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  updateLanguageApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/common-api/update-language`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteLanguage(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/common-api/delete-language`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  allLanguageListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/exportsheetlist-language?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadExcelLanguageList(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/common-api/upload-csv-for-language-list`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }



  addImmunization(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/add-immunization`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  ImmunizationLists(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/list-immunizationlist`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }


  updateImmunizationApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/patient-service/patient/update-immunization`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  deleteImmunization(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/delete-immunizationstatus`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  allImmunizationListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/exportsheetlist-immunization?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }


  uploadExcelImmunizationList(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/patient-service/patient/upload-csv-for-immunization-list`,
      formData,
      {
        headers: this.getHeaderFormdata(token),
      }
    );
  }



  getByIdDesignation(_id: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/getById-designation?_id=${_id}`,

      {
        headers: this.getHeader(token),
      }
    );
  }


  getByIdTitle(_id: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/common-api/getById-title?_id=${_id}`,

      {
        headers: this.getHeader(token),
      }
    );
  }

  // getByIdTeam(_id: any) {
  //   let token = this.auth.getToken();
  //   return this.http.get(
  //     this.getBasePath() + `/superadmin-service/common-api/getById-team?_id=${_id}`,

  //     {
  //       headers: this.getHeader(token),
  //     }
  //   );
  // }


  changePassword(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/superadmin/change-password`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addNotification(data: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/superadmin/add-notification`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getNotificationlist(params: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/get-all-notification-list`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  notificationListById(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/get-notification-by-id`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  deleteNotification(data: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/superadmin/delete-notification`,
      data,
      {
        headers: this.getHeader(token)
      }
    );
  }

  updateLogs(data: any) {
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/superadmin/update-logs`,
      data,

    );
  }

  getUserLogs(params: any) {
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/get-all-logs-by-userId`,
      {
        params,

      }
    );
  }
  addICDCodes(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/superadmin/add-icd-code`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  getAllCodes(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/list-icd-code`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }
  updateICDCodeApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/superadmin/update-icd-code`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  deleteICD(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/superadmin/delete-icd-code`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  allICDListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/superadmin/exportsheetlist-icd-code?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  uploadExcelICDCodeList(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/superadmin/upload-file-for-icd-code-list`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  getAllLoincCodes(paramData: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/list-loinc-code`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  addLoincCodes(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/superadmin/add-loinc-code`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateLoincCodeApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/superadmin/update-loinc-code`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteLoincCode(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/superadmin/delete-loinc-code`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  allLoincCodeListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/superadmin/exportsheetlist-loinc-code?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadExcelLoincCodeList(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/superadmin/upload-file-for-loinc-code-list`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  viewProfileById(userId: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/pharmacy-service/pharmacy/view-pharmacy-admin-details?id=${userId}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadFileForPortal(formData: FormData) {
    const token = this.auth.getToken();
    return this.http.post(
        `${this.getBasePath()}/labradio-service/lab-radio/upload-documents`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
    );
  }
  
  createPharmacyProfile(userData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/pharmacy-service/pharmacy/pharmacy-profile`,
      userData,
      {
        headers: this.getHeader(token),
      }
    );
  }


  createLAB_RADIOProfile(userData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/centre-create-profile`,
      userData,
      {
        headers: this.getHeader(token),
      }
    );
  }


  addQuestionnair(userData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/superadmin-service/superadmin/add-assessment`,
      userData,
      {
        headers: this.getHeader(token),
      }
    );
  }

  list_Questionnaire(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/superadmin-service/superadmin/list-assessment-for-superadmin`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  delete_activeQuestionnaire(userData: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/superadmin-service/superadmin/delete-activate-deactivate-assessment`,
      userData,
      {
        headers: this.getHeader(token),
      }
    );
  }

  orderNoUpdate_questionnaire(userData: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/superadmin-service/superadmin/set-assessment-order`,
      userData,
      {
        headers: this.getHeader(token),
      }
    );
  }

  update_questionnaire(userData: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/superadmin-service/superadmin/update-assessment`,
      userData,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getIdBy_Questionnaire(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/superadmin-service/superadmin/get-assessment-by-id/${params.id}`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  /* Master > Alpha Results */
  AlphaResultsLists(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/alpharesult/get-alpha-result`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }
  addAlphaResults(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/superadmin-service/alpharesult/add-alpha-result`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteAlphaResults(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/alpharesult/delete-active-inactive-alpha-result`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateAlphaResultsApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/superadmin-service/alpharesult/update-alpha-result`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  allAlphaResultListforexport(page: any, limit: any, searchText: string) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/alpharesult/exportsheetlist-alphaResult?searchText=${searchText}&limit=${limit}&page=${page}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateNotification(data: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/superadmin-service/superadmin/update-notification`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  /* Lab-Managemenbt Add Test Configuration */
  addConfiguration(userData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/add-lab-test-configuration`,
      userData,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getIdByMedicine_api(id: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/medicine/get-medicine-by-id/${id.id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

/* type of study master */
studyLists(paramData: any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/superadmin-service/common-api/get-study-type`,
    {
      params: paramData,
      headers: this.getHeader(token),
    }
  );
}

addStudyType(data: any) {
  let token = this.auth.getToken();
  return this.http.post(
    this.getBasePath() + `/superadmin-service/common-api/add-study-type`,
    data,
    {
      headers: this.getHeader(token),
    }
  );
}

updateStudyTypeApi(data: any) {
  let token = this.auth.getToken();
  return this.http.put(
    this.getBasePath() + `/superadmin-service/common-api/update-study-type`,
    data,
    {
      headers: this.getHeader(token),
    }
  );
}

deleteStudyType(data: any) {
  let token = this.auth.getToken();
  return this.http.put(
    this.getBasePath() + `/superadmin-service/common-api/delete-active-inactive-study-type`,
    data,
    {
      headers: this.getHeader(token),
    }
  );
}

allStudyListforexport(page: any, limit: any, searchText: string) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() +
    `/superadmin-service/common-api/exportsheetlist-studyType?searchText=${searchText}&limit=${limit}&page=${page}`,
    {
      headers: this.getHeader(token),
    }
  );
}

dashboard_labRadioCount(param: any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/labradio-service/lab-radio/dashboard-labradio-report`,
    {
      params: param,
      headers: this.getHeader(token),
    }
  );
}

dashboard_labRadioList(param: any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/labradio-service/lab-radio/dashboard-labradio-list`,
    {
      params: param,
      headers: this.getHeader(token),
    }
  );
}

mainDashboardCount(param: any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/superadmin-service/superadmin/dashboard`,
    {
      params: param,
      headers: this.getHeader(token),
    }
  );
}
getVitalThreshold(paramData: any) {
  let token = this.auth.getToken();
  return this.http.get(
    // this.getBasePath() + `/superadmin-service/vitalsthreshold/get-vitals-threshold`,
    this.getBasePath() + `/superadmin-service/newvitalsthreshold/get-vitals-threshold`,
    {
      params: paramData,
      headers: this.getHeader(token),
    }
  );
}

addVitalsThreshold(data: any) {
  
  let token = this.auth.getToken();
  return this.http.post(
    // this.getBasePath() + `/superadmin-service/vitalsthreshold/add-vitals-threshold`,
    this.getBasePath() + `/superadmin-service/newvitalsthreshold/add-vitals-threshold`,
    data,
    {
      headers: this.getHeader(token),
    }
  );
}

getThresholdByID(data: any) {
  let token = this.auth.getToken();
  return this.http.get(
    // this.getBasePath() + `/superadmin-service/vitalsthreshold/get-vitals-threshold/${data.id}/${data.vitalsType}`,
    this.getBasePath() + `/superadmin-service/newvitalsthreshold/get-vitals-threshold/${data.id}/${data.vitalsType}`,
    {
      headers: this.getHeader(token),
    }
  );
}

updateVitalThresholdApi(data: any) {
  let token = this.auth.getToken();
  return this.http.put(
    // this.getBasePath() + `/superadmin-service/vitalsthreshold/update-vitals-threshold`,
    this.getBasePath() + `/superadmin-service/newvitalsthreshold/update-vitals-threshold`,
    data,
    {
      headers: this.getHeader(token),
    }
  );
}

deleteVitalThreshold(data: any) {
  
  const token = this.auth.getToken();
  return this.http.delete(
    // `${this.getBasePath()}/superadmin-service/vitalsthreshold/delete-vitals-threshold`,
    `${this.getBasePath()}/superadmin-service/newvitalsthreshold/delete-vitals-threshold`,
    {
      headers: this.getHeader(token),
      body: data,
    }
  );
}

mainDashboardgrapgh(param: any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/superadmin-service/superadmin/dashboard-graph`,
    {
      params: param,
      headers: this.getHeader(token),
    }
  );
}

reportdashboardgrapgh(param: any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/patient-service/patient/subscriber-report-for-dashboard`,
    {
      params: param,
      headers: this.getHeader(token),
    }
  );
}

export_labbRadioList(param: any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/labradio-service/lab-radio/export-dashboard-labradio-list`,
    {
      params: param,
      headers: this.getHeader(token),
    }
  );
}


revenueCount() {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/patient-service/patient/get-all-revenue`,
    {
     
      headers: this.getHeader(token),
    }
  );
}

totalRevenue() {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/patient-service/patient/get-total-revenues`,
    {
     
      headers: this.getHeader(token),
    }
  );
}

createPatient_profileApi(data: any) {
  let token = this.auth.getToken();
  return this.http.post(
    this.getBasePath() + `/patient-service/patient/signup`,
    data,
    {
      headers: this.getHeader(token),
    }
  );

}

getPatientDetailsById(param:any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/patient-service/patient/patient-details`,
    {
      params: param,
      headers: this.getHeader(token),
    }
  );
}

updatePatient_profileApi(data: any) {
  let token = this.auth.getToken();
  return this.http.post(
    this.getBasePath() + `/patient-service/patient/create-profile/personal-details`,
    data,
    {
      headers: this.getHeader(token),
    }
  );

}

getPatientNationality() {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/superadmin-service/common-api/nationality-list`,
    {
      headers: this.getHeader(token),
    }
  );
}

addConsultationCount(data:any) {
  let token = this.auth.getToken();
  return this.http.put(
    this.getBasePath() + `/patient-service/patient/update-consultation-count`,
    data,
    {
      headers: this.getHeader(token),
    }
  );
}
getGeneralSetting(data:any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/superadmin-service/superadmin/general-settings`,
    {
      params: data,
      headers: this.getHeader(token),
    }
  );
}

updateGeneralSetting(data:any) {
  let token = this.auth.getToken();
  return this.http.put(
    this.getBasePath() + `/superadmin-service/superadmin/update-general-settings`,
    data,
    {
      headers: this.getHeader(token),
    }
  );
}

nonSubscriptionPatientData(data:any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/patient-service/patient/patient-dont-have-subscription-plan`,
    {
      params:data,
      headers: this.getHeader(token),
    }
  );
}

/** Feb 6 AP  */
deleteSubscriptionPlan(data:any){
  let token = this.auth.getToken();
  return this.http.delete(
    this.getBasePath() + `/superadmin-service/superadmin/delete-subscription-plan/${data.id}`,
    {
      params: data,
      headers : this.getHeader(token)
    }
  )
}

addContent(data: any): Observable<any> {
  let token = this.auth.getToken();

  return this.http.post(
    this.getBasePath() + `/superadmin-service/superadmin/create-content`,
    data,
    {
      headers: this.getHeader(token),
    }
  );
}


getContentlist(params: any, status?: any): Observable<any> {

  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/superadmin-service/superadmin/get-content`,
    {
      params,
      headers: this.getHeader(token),
    }
  );
}


contentListById(paramData: any) {
  // return of({ status: true });
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/superadmin-service/superadmin/get-contentById/${paramData._id}`,
    {
      params: paramData,
      headers: this.getHeader(token),
    }
  );
}

deleteContent(data: any): Observable<any> {
  let token = this.auth.getToken();
  return this.http.delete(
    this.getBasePath() + `/superadmin-service/superadmin/delete-contentById/${data._id}`,
    {
      headers: this.getHeader(token)
    }
  );
}

updateContent(data: any): Observable<any> {
  let token = this.auth.getToken();
  return this.http.put(
    this.getBasePath() +
    `/superadmin-service/superadmin/update-content/${data.id}`,
    data,
    {
      headers: this.getHeader(token),
    }
  );
}

sendNotificationApi(data: any) {
  let token = this.auth.getToken();
  return this.http.post(
    this.getBasePath() + `/superadmin-service/content-management/send-notification`,
    data,
    {
      headers: this.getHeader(token),
    }
  );
}

private activeMenuSubject = new BehaviorSubject<string>(null);
activeMenu$ = this.activeMenuSubject.asObservable();
setActiveMenu(menuName: string): void {
  this.activeMenuSubject.next(menuName);
}

adminProfileCreate(data: any): Observable<any> {
  let token = this.auth.getToken();
  return this.http.post(
    this.getBasePath() + `/superadmin-service/superadmin/create-admin-profile`,
    data,
    {
      headers: this.getHeader(token),
    }
  );
}

getAllAdmminProfileList(paramData: any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/superadmin-service/superadmin/all-admin-profile-list`,
    {
      params: paramData,
      headers: this.getHeader(token),
    }
  );
}

deleteLockAdminUser(data: any): Observable<any> {
  let token = this.auth.getToken();
  return this.http.post(
    this.getBasePath() + `/superadmin-service/superadmin/detele-lock-admin-user`,
    data,
    {
      headers: this.getHeader(token),
    }
  );
}

exportNoOfActiveDoctor(paramData :any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/superadmin-service/superadmin/doctor-records`,
    {
      params: paramData,
      headers: this.getHeader(token),
    }
  );
}
exportRegisteredPatient(paramData :any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/superadmin-service/superadmin/patient-records`,
    {
      params: paramData,
      headers: this.getHeader(token),
    }
  );
}
exportTotalPharmacy(paramData :any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/superadmin-service/superadmin/pharmacie-records`,
    {
      params: paramData,
      headers: this.getHeader(token),
    }
  );
}
exportTotalLaboratory(paramData :any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/superadmin-service/superadmin/laboratory-records`,
    {
      params: paramData,
      headers: this.getHeader(token),
    }
  );
}
exportTotalRadiology(paramData :any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/superadmin-service/superadmin/radiology-records`,
    {
      params: paramData,
      headers: this.getHeader(token),
    }
  );
}

exportActive_cancel_revenList() {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/patient-service/patient/export-revenue-list`,
    {
      headers: this.getHeader(token),
    }
  );
}


exportTotalSubscriberReport(paramData :any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/patient-service/patient/subscriber-report-get-patient-data`,
    {
      params: paramData,
      headers: this.getHeader(token),
    }
  );
}


totalRevenueExport() {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/patient-service/patient/get-total-revenue-details`,
    {
     
      headers: this.getHeader(token),
    }
  );
}

getOrderPrescribedDetails(param:any){
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/pharmacy-service/pharmacy/get-orders-doctor-patient-details`,
    {
      params: param,
      headers:this.getHeader(token),
    }
  );
}
getDoctorConsultationDetails(paramData:any){
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/doctor-service/doctor/appointments-doctor-patient-details`,
    {
      params:paramData,
      headers:this.getHeader(token),
    }
  )
}

getSubscribersDetails(param:any){
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/patient-service/patient/subscriber-report-get-patient-data`,
    {
      params: param,
      headers:this.getHeader(token),
    }
  )
}

getActiveCancelledSubscriptions(param:any){
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/patient-service/patient/subscriber-report-active-cancel-data`,
    {
      params: param,
      headers:this.getHeader(token),
    }
  )
}

getOnlineDoctor(){
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/doctor-service/individual-doctor/get-all-online-doctor`,
    {
        headers:this.getHeader(token),
    }
  )
}

getPaymentDetails(params) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() + `/patient-service/payment/get-payment-details-by-id`,
    {
      params,
      headers: this.getHeader(token),
    }
  );
}

getLabRadioDiscountCoupon(params: any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() +
    `/patient-service/patient/get-patient-discount-coupon-details`,
    {
      params,
      headers: this.getHeader(token),
    }
  );
}

getLabRadioTestInvoiceCancellation(params: any) {
  let token = this.auth.getToken();
  return this.http.get(
    this.getBasePath() +
    `/patient-service/patient/get-labRadioTest-invoice-cancel-details`,
    {
      params,
      headers: this.getHeader(token),
    }
  );
}
}



