import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { environment } from "src/environments/environment";
import { Observable, of,BehaviorSubject } from "rxjs";
@Injectable({
  providedIn: "root",
})
export class FourPortalService {
  param: any;
  private shareprofiledata = new BehaviorSubject<string>('');

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private _coreService: CoreService
  ) {
    this.param = {
      module_name: this.auth.getRole(),
    };
  }

  setData(data: string) {
    this.shareprofiledata.next(data);
  }

  getData() {
    return this.shareprofiledata.asObservable();
  }

  getHeader(token: any) {
    const httpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      role: "lab-radio",
      Authorization: `Bearer ${token}`,
      uuid: localStorage.getItem("deviceId"),
    });
    return httpHeaders;
  }

  getHeaderFileUpload(token: any) {
    const httpHeaders = new HttpHeaders({
      // "Content-Type": "application/json",
      role: "lab-radio",
      Authorization: `Bearer ${token}`,
      // uuid: localStorage.getItem("deviceId"),
    });
    return httpHeaders;
  }
  getHeaderFormData(token: any) {
    const httpHeaders = new HttpHeaders({
      // "Content-Type": "application/json",
      role: "hospital",
      Authorization: `Bearer ${token}`,
      // "uuid": localStorage.getItem('deviceId')
    });
    return httpHeaders;
  }
  getBasePath() {
    return environment.apiUrl;
  }


  fourPortalSignup(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/sign-up`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  fourPortalLogin(data: any) {
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/login`,
      data,
      {
        headers: this.getHeader("asdasd"),
      }
    );
  }

  sendOtpSMS(data: any, uuid: any = ""): Observable<any> {
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/send-sms-otp-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }


  listCategoryStaff(param: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/listCategoryStaff?pharmacyId=${param.pharmacyId}&staffRoleId=${param.staffRoleId}`,
      {
        // params: param,
        headers: this.getHeader(token),
      }
    );
  }


  all_role(param: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/all-role`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  sendOtpEmail(data: any, uuid: any = ""): Observable<any> {
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/send-email-otp-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  verifyOtpSMS(data: any, uuid: any = ""): Observable<any> {
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/match-otp-SMS-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  verifyEmailOtp(data: any, uuid: any = ""): Observable<any> {
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/match-Otp-Email-For-2-fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  forgotPassword(data: any): Observable<any> {
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/forgot-password`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  resetPassword(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/reset-password`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  createProfile(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/fourPortal-create-profile`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addManualTestss(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/add-manuall-tests`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  editTests(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/edit-manual-tests`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  getProfileDetailsById(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/centre-view-profile`,
      {
        params:param,
        headers: this.getHeader(token),
      }
    );
  }

  getLocationDetailsById(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/get-all-location-by-id?portal_user_id=${data.portal_user_id}&type=${data.type}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadFileForPortal(formData: FormData) {

    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/upload-documents`,
      formData,
      {
        headers: this.getHeaderFileUpload(token),
      }
    );
  }

  educationalDetails(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-management-educational-details`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  locationDetails(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-management-hospital-location`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  fourPortalAvailability(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-management-availability`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getLocations(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-management-get-locations`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  feeManagement(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-management-fee-management`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  documentManage(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-management-document-management`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteAvailabiltiesOnDeletingLocation(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/delete-availabilty-by-deleting-location`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  //--------User Invitation--------------
  invitationList(paramData: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/get-email-invitation-list`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  invitationListById(paramData: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/get-email-invitation-id`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  inviteUser(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/labradio-service/lab-radio/send-email-invitation`, data, {
      headers: this.getHeader(token),
    });
  }


  changePassword(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/change-password`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }



  checkForPlanPurchased(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      ``, //{}-lab-radio/payment/four-portal-is-plan-purchased
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  async isPlanPurchesdByfourPortal(user_id: any, portal_type: any): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let reqData = {
        user_id,
        portal_type
      };

      this.checkForPlanPurchased(reqData).subscribe(async (res) => {
        let isPlanPurchased = false;
        let response = await this._coreService.decryptObjectData({ data: res });

        if (response.status) {
          isPlanPurchased = response?.isPlanPurchased;
        }
        resolve(isPlanPurchased);
      }, error => {
        reject(error);
      });
    });
  }

  getUserMenus(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/menu/all-user-menu`, {
      params,
      headers: this.getHeader(token)
    });
  }


  asignMenuSubmit(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/menu/add-user-menu`, data, {
      params: {
        module_name: 'superadmin',
      },
      headers: this.getHeader(token)
    });
  }


  getPurchasedPlanOfUser(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      ``,///{}-lab-radio/payment/subscription-purchased-plan
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }



  getSubscriptionPlan(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/superadmin/all-subscription-plans`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  getcinetpaylink(data: any) {
    return this.http.post('https://api-checkout.cinetpay.com/v2/payment', data, { headers: this.getHeader("") });
  }

  getSubscriptionPlanDetails(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/superadmin/get-subscription-plan-details`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }


  addAppointmentReason(data: any) {

    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-management-appointmentReasons`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  listAppointmentReason(params: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-management-getAppointmentReasons`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  updateAppointmentReason(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-management-updateAppointmentReasons`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteAppointmentReason(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-management-updateAppointmentReasonsStatus`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadExcelAppointmentReason(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-management-bulkImportAppointmentReasons`,
      data,
      {
        headers: this.getHeaderFileUpload(token),
      }
    );
  }

  addQuestionnaire(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-management-addQuestionnaire`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  questiinnaireList(params: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-management-getQuestionnaires`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getQuestionnaireDetails(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-management-getQuestionnaireDetail`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  updateQuestionnaire(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-management-updateQuestionnaire`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteQuestionnaire(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-management-deleteQuestionnaire`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  serachFilterForFourPortals(param: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-management-advFilters`,
      param,
      {
        headers: this.getHeader(token),
      }
    );
  }

  fourPortalDetails(param: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-management-detail`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  portalAvailableSlot(param: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-management-available-slots`,
      param,
      {
        headers: this.getHeader(token),
      }
    );
  }

  fourPortalReviweandRating(param: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-management-addReviews`,
      param,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getPortalReviweAndRating(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-management-getReviews`,
      {
        params: param,
        // headers: this.getHeader(token),
      }
    );
  }

  deleteRatingAndReview(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/delete-review-and-rating-fourportal`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getAllSubMenus(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/menu/all-submenus`, {
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


  getAllMenus(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/menu/all-menus`, {
      params,
      headers: this.getHeader(token),
    });
  }

  addSubmenusInfo(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/menu/add-submenu-permission`,
      data,
      { params: { module_name: "labradio" }, headers: this.getHeader(token) }
    );
  }

  addRole(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/add-role`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  getAllRoles(params: any) {

    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/labradio-service/lab-radio/all-role`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  updateRole(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/update-role`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteRole(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/delete-role`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  addStaff(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/add-staff`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  editStaff(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/edit-staff`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getAllStaff(paramsData: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/get-all-staff`,
      {
        params: paramsData,
        headers: this.getHeader(token),
      }
    );
  }

  getAllStaffWithoutPagination(paramsData: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/get-all-staff-without-pagination`,
      {
        params: paramsData,
        headers: this.getHeader(token),
      }
    );
  }

  getStaffDetails(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/get-staff-details`,
      {
        params: data,
        headers: this.getHeader(token),
      }
    );
  }

  deleteActiveAndLockStaff(param: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/delete-active-and-lock-staff`,
      param,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deletePathologyTest(data: any) {

    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/delete-fourportal-pathology-tests`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  // templateBuilder
  addtemplateBuilder(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/add-template`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  gettemplateBuilderListApi(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/template-list`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  editTemplateBuilder(templateId: any, type: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/template-details?templateId=${templateId}&type=${type}`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  deleteTemplateBuilder(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/template-delete`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  // Chat
  getAllFourPortalChatUser(paramData: any) {
    let token = this.auth.getToken();
   
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/get-all-chat-user`,
      {
        params: paramData,
        headers: this.getHeader(token)
      }
    );
  }

  getAllMessagesService(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/labradio-service/lab-radio/all-message`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getRoomlistService(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/labradio-service/lab-radio/get-create-chat`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getAllNotificationService(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/labradio-service/lab-radio/get-all-notification`,

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
      `/labradio-service/lab-radio/update-notification`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  markAllReadNotification(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/labradio-service/lab-radio/mark-all-read-notification`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  markReadNotificationById(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/labradio-service/lab-radio/mark-read-notification-id`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  clearAllMessages(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/labradio-service/lab-radio/clear-all-messages`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  clearSingleMessages(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/labradio-service/lab-radio/clear-single-message`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateOrderDetailsallPortal(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-update-order-details`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  // Patient Management
  getPatientListAddedByFourPortal(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/get-all-patient-added-by-doctor?doctorId=${data.doctorId}&limit=${data.limit}&page=${data.page}&searchText=${data.searchText}&sort=${data.sort}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  verifyInsuaranceallPortal(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-verify-insurance-for-order`, data,

      {

        headers: this.getHeader(token),
      }
    );
  }

  addPatientByFourPortal(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/patient-add-by-doctor`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  activeAndLockPatient(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/patient-action`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  cancelOrderFourPortal(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-cancel-order`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  confirmOrderFourPortal(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-confirm-order`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  scheduleConfirmOrderFourPortal(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-update-schedule-order`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_appointment_list(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/appointment/list-appointment`,

      {
        params: params,
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_cancel_approved_appointment(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/appointment/cancel-and-approve-appointment`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  appointment_deatils(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/appointment/view-appointment`,

      {
        params: params,
        headers: this.getHeader(token),
      }
    );
  }




  fourPortal_assignedStaff(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-assign-healthcare-provider`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  fourPortal_paymentReceived(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-consulatation-data`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  getPastAppointOfPatient(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/appointmentList_for_patient`,
      {
        params: data,
        headers: this.getHeader(token),
      }
    );
  }

  getTotalTests(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/dashboard`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  fourPortalappointmentRevenuesCount(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-appointment-revenues-count`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_nextAvaiable_slot(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-next-available-slot`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getfourPortalTotalRevenueMonthwiseOnline(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-totalRevenue-monthwise-online`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getfourPortalTotalRevenueMonthwiseF2F(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-totalRevenue-monthwise-f2f`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getRevenueForAlltypeAppointment(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-totalRevenue-all-appointment-type`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getTotalTestsForLineChart(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal_totalTests_ForLineChart`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getTestsTotalClaimsForGraph(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal_totalClaims_ForGraph`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_reschedule_Appointment(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-reschedule-appointment`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  fourPortal_setReminder_Appointment(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-set-reminder`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_getReminder_Appointment(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-get-reminder`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_AddEditAssesment_Appointment(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-add-and-edit-assessment`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  updateNotification(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/update-notification-status`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_orderflowPdf(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-save-pdf-data`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_listAssesment_Appointment(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-assessment-list`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_get_ePrescription(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-get-eprescription`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_RecentMedicine_prescribed(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-recent-medicine-prescribed`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_getMedicineDose_prescribed(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-get-eprescription-medicine`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_addMedicineDose(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-add-eprescription-medicine`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_delete_MedicineDose(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-delete-eprescription-medicine`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_create_eprescription(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-create-eprescription`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_get_all_testEprescription(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-get-all-tests-eprescription`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  fourPortal_getlocationbyid(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-get-LocationInfo-ById`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  fourPortal_addEprescriptionSignature(formdata: FormData) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-add-eprescription-esignature`,
      formdata,
      {
        headers: this.getHeaderFileUpload(token),
      }
    );
  }


  fourPortal_listAllePrescription(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-list-all-eprescription`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  fourPortal_getEprescriptionLabTest(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-get-eprescription-labTest`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_getEprescriptionImaging(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-get-eprescription-imaging`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_getEprescriptionVaccination(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-get-eprescription-vaccination`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }
  fourPortal_getEprescriptionOthers(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-get-eprescription-others`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }
  fourPortal_getEprescriptionEyeglasses(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-get-eprescription-eyeglasses`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_addLABTest(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-add-eprescription-lab`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  fourPortal_addImaging(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-add-eprescription-imaging`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  fourPortal_addVaccination(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-add-eprescription-vaccination`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  fourPortal_addEyeglass(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-add-eprescription-eyeglasses`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  fourPortal_addOthers(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-add-eprescription-others`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  fourPortal_sendMailToPatient(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-send-Mail-TO-Patient`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  fourPortal_fetchRoomcall(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-fetch-room-call`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  fourPortal_participantDetails(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/four-portal-participant-details`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getFourPortalasPerlocList(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio/get-all-fouportal-as-per-loc?clinic_id=${data.clinic_id}&type=${data.type}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateLogs(data: any) {

    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/update-logs`,
      data,
      {

      }
    );
  }

  getUserLogs(params: any) {

    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/get-all-logs-by-userId`,
      {
        params,

      }
    );
  }

  patientPaymentHistoryToFourPortal(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/four-portal-payment-history`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  uploadDocumentProvider(formData: FormData) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/addProviderDocuments`,
      formData,
      {
        headers: this.getHeaderFormData(token),
      }
    )
  }

  getPortaldocumentList(param: any) {

    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/getProviderDocumentslist`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  statusUpdateProviderDoc(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/labradio-service/lab-radio/updatestatusDocuments`,
      data,
      {
        headers: this.getHeader(token),

      }
    );
  }

  getProviderDoc(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/getProviderDocuments`,
      {
        params: param,
        headers: this.getHeader(token),

      }
    );
  }

  addleaves(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + ``, ///{}-lab-radio/leave/addfourPortalleave
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getStaffLeaveListinStaffPortal(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + ``, ///{}-lab-radio/leave/getLeavelistforstaffportal
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  getallStaffLeavesInfourPortals(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + ``, //{}-lab-radio/leave/getallStaffleavesInfourportal
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }


  leaveAccepts(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + ``, ///{}-lab-radio/leave/fourportalstaffleaveaccept
      data,
      {
        headers: this.getHeader(token),

      }
    );
  }
  leaveRejects(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + ``, ///{}-lab-radio/leave/fourportalstaffleavereject
      data,
      {
        headers: this.getHeader(token),

      }
    );
  }
  addHospitalIds(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/leave/hospitalIds`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  myLeaveListforFourportal(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + ``, ///{}-lab-radio/leave/getAllMyLeaveFourPortal
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  fourPortalRatingBySuperAdmin(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/get-reviews-rating-superadmin`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  centerProfileView(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/labradio-service/lab-radio/centre-view-profile`, {
      params,
      headers: this.getHeader(token)
    });
  }

  logOutUserApi() {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/logout`,
      {},
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadTestREsultsApi(data:any){
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/appointment/add-test-results`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadTestREsultsApiForm(formData: FormData){
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/appointment/add-test-results`,
      formData,
      {
        headers: this.getHeaderFileUpload(token),
      }
    );
  }

  getLabTestResultById(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/appointment/get-test-results/${data.id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateOrderStatus_API(data:any){
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/labradio-service/appointment/update-appointment-status`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  appointment_listEMR(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/appointment/list-appointment-for-emr`,

      {
        params: params,
        headers: this.getHeader(token),
      }
    );
  }

  dashboardGraph(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/dashboard-graph`,

      {
        params: params,
        headers: this.getHeader(token),
      }
    );
  }


  delayDashboardList(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/appointment/get-delayed-appointment`,

      {
        params: params,
        headers: this.getHeader(token),
      }
    );
  }

  maintainLabOrder_testHistory(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/appointment/get-test-history/${param.id}`,

      {
        headers: this.getHeader(token),
      }
    );
  }

  export_appointment_list(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/appointment/export-list-appointment`,

      {
        params: params,
        headers: this.getHeader(token),
      }
    );
  }
}






