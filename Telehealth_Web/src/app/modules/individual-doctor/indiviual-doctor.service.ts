import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { environment } from "src/environments/environment";
import { BehaviorSubject, Observable, of } from "rxjs";
@Injectable({
  providedIn: "root",
})
export class IndiviualDoctorService {
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
      role: "individual-doctor",
      Authorization: `Bearer ${token}`,
      uuid: localStorage.getItem("deviceId"),
    });
    return httpHeaders;
  }
  getHeaderFileUpload(token: any) {
    const httpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      role: "individual-doctor",
      Authorization: `Bearer ${token}`,
      uuid: localStorage.getItem("deviceId"),
    });
    return httpHeaders;
  }
  getBasePath() {
    return environment.apiUrl;
  }
  getHeaderFormData(token: any) {
    const httpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "uuid": localStorage.getItem('deviceId')
    });
    return httpHeaders;
  }
  getAccessToken(data: any) {    
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/individual-doctor/fetch-room-call`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  getParticipantDetails(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/individual-doctor/get-participant-details?roomName=${data.roomName}&identtity=${data.identity}`,

      {
        headers: this.getHeader(token),
      }
    );
    // let observable = Observable.create(observer => {
    //   let finalResponse = {
    //     participantName: "vikas",
    //     userId: "63e1f567a825766f5c52b0de",
    //     Identity: "544dishfhsdgfds",
    //     image: null,
    //     isAudioMute: false,
    //     isVideoMute: false,
    //   };
    //   let data1={
    //     status: 'Success',
    //     messageID: 200,
    //     message: "FETCH_SUCCESS",
    //     data: finalResponse,
    //   }
    //     observer.next(data1); // This method same as resolve() method from Angular 1
    //     observer.complete();//to show we are done with our processing
    //     // observer.error(new Error("error message"));
    // })

    // return observable
  }
 
  getPurchasedPlanOfUser(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/payment/subscription-purchased-plan`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  getDoctorSubscriptionPlan(parameter: any) {
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

  viewAppointmentDetailsbyroomname(id: any, token: any, portal_type: any): Observable<any> {
      return this.http.get(
        this.getBasePath() +
        `/doctor-service/doctor/view-appointment-by-roomname?appointment_id=${id}`,
        {
          headers: this.getHeader(token),
        }
      );
  }

  updateUnreadMessage(chatId: any, id: any, token: any): Observable<any> {
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/updateUnreadMessage?id=${id}&chatId=${chatId}`,
      {
        headers: this.getHeader(token),
      }
    );    
  }

  viewAppointmentCheck(id: any, portal_type: any): Observable<any> {
    if (portal_type != "") {
      return this.http.get(
        this.getBasePath() +
        `` 
      );
    } else {
      return this.http.get(
        this.getBasePath() +
        `/doctor-service/doctor/viewAppointmentCheck?appointment_id=${id}`
      );
    }
  }

  createGuestUser(name: any) {
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/create-guest-user`
      , {
        name: name
      }
    );
  }

  sendExternalUserEmail(email: any, appointmentId: any, portaltype: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/send-external-user-email`
      , {
        email: email,
        appointment: appointmentId,
        portaltype: portaltype ? portaltype : ""
      },
      {
        headers: this.getHeader(token),
      }
    );
  }

  getcinetpaylink(data: any) {
    return this.http.post('https://api-checkout.cinetpay.com/v2/payment', data, { headers: this.getHeader("") });
  }

  hospitalSignup(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/individual-doctor/sign-up`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addStaff(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/individual-doctor/add-staff`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  editStaff(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/individual-doctor/edit-staff`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadDoc(formaData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/upload-document`,
      formaData,
      {
        headers: this.getHeaderFileUpload(token),
      }
    );
  }
  //....................emailVerification.............
  getVerificationCodeEmail(data: any) {
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/send-email-otp-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  verifyOtp(data: any, uuid: any = ""): Observable<any> {
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/match-otp-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  verifyEmailOtp(data: any, uuid: any = ""): Observable<any> {
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/match-Email-Otp-For-2-fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  //...................LOGIN...........
  hospitalLogin(data: any) {
    return this.http.post(
      this.getBasePath() + `/doctor-service/individual-doctor/login`,
      data,
      {
        headers: this.getHeader("asdasd"),
      }
    );
  }

  //.................mobileVerification..............
  getVerificationCodeMobile(data: any): Observable<any> {
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/send-sms-otp-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  getAllStaff(paramsData: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/individual-doctor/get-all-staff`,
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
      `/doctor-service/individual-doctor/get-all-staff-without-pagination`,
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
      `/doctor-service/individual-doctor/get-staff-details`,
      {
        params: data,
        headers: this.getHeader(token),
      }
    );
  }

  getAllRole(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/individual-doctor/all-staff-role`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  deleteActiveAndLockStaff(param: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/delete-active-and-lock-staff`,
      param,
      {
        headers: this.getHeader(token),
      }
    );
  }

  serachFilterdoctor(param: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/advance-doctor-filter`,
      param,
      {
        headers: this.getHeader(token),
      }
    );
  }

  doctorDetails(param: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/patient/view-doctor-details-for-patient`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }
  getDoctorSubscriptionPlanDetails(parameter: any) {
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

  DoctorReviweandRating(param: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/patient/post-review-and-rating`,
      param,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getDoctorReviweAndRating(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/patient/get-review-and-rating`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getReviweAndRatingForSuperAdmin(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/patient/get-review-and-rating-for-admin`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  deleteRatingAndReview(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/patient/delete-review-and-rating-hospital`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

 updateRatingAndReview(data: any) {             //Disable Rating & Reviews 
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/patient/update-Status-review-and-rating`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getHospitalListUnderDoctor(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/get-all-hospital-list-under-doctor`,
      {
        params: data,
        headers: this.getHeader(token),
      }
    );
  }

  doctorAvailableSlot(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/appointment/doctor-available-slot`,
      {
        params:param,
        headers: this.getHeader(token),
      }
    );
  }

  doctorAppoinment(param: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/doctor-appointment`,
      param,
      {
        headers: this.getHeader(token),
      }
    );
  }
  viewAppoinment(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/patient/view-appointment`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  resonForAppoinment(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/reason-for-appointment-list`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  // doctor-appointment-list
  appoinmentListApi(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/appointment/list-appointment`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }
  // multiple-cancel-appointment
  cancelMultipleAppoinmentApi(param: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/cancel-and-approve-appointment`,
      param,
      {
        headers: this.getHeader(token),
      }
    );
  }
  // single-cancel-appointment
  cancelSingleAppoinmentApi(param: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      // `/doctor-service/doctor/cancel-and-approve-appointment`,
      `/doctor-service/appointment/cancel-and-approve-appointment`,
      param,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addPatientByDoctor(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/patient-add-by-doctor`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  assignHealthCareProvider(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/assign-healthcare-provider`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  activeAndLockPatient(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/patient-service/patient/active-lock-patient`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  viewAppointmentDetails(id: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/appointment/view-appointment?appointment_id=${id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getPastAppointOfPatient(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/patient/list-appointment?patient_portal_id=${data.patient_portal_id}&page=${data.page}&limit=${data.limit}&status=${data.status}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getPatientListAddedByDoctor(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/get-all-patient-added-by-doctor`,
      {
        params: data,
        headers: this.getHeader(token),
      }
    );
  }

  getAllPatientForSuperAdmin(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/getAllPatientForSuperAdminNew`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  //added by dilip
  getAllPatientForSuperAdminToNotify(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/getAllPatientForSuperAdminNewToNotify`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getAllPatientSubscriber(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/subscriber-dashboard`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }


  getAllsubscriberDiscountUsedReport(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/subscriber-discount-used-report`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }



  rescheduleAppointment(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/reschedule-appointment`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  nextAvailableSlot(id: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/next-available-slot?appointmentId=${id}`,

      {
        headers: this.getHeader(token),
      }
    );
  }
  // templateBuilder
  addtemplateBuilder(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/doctor/add-template`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  gettemplateBuilderListApi(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/doctor/template-list`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  editTemplateBuilder(templateId: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/template-details?templateId=${templateId}`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  deleteTemplateBuilder(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/doctor/template-delete`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  // appointmentReason
  addAppointmentReasonApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/add-appointment-reason`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  uploadExcelAppointmentReason(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/bulk-upload-appointment-reason`,
      data,
      {
        headers: this.getHeaderFileUpload(token),
      }
    );
  }

  listAppointmentReason(params: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/reason-for-appointment-list`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  updateAppointmentReasonApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/update-appointment-reason`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteAppointmentReasonApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/action-on-appointment-reason`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  forgotPassword(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/forgot-password`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  setNewPassword(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/reset-forgot-password`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  changePassword(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/change-password`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  //-----------Roles & Permissions-------------
  addRole(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/individual-doctor/add-staff-role`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  getAllStaffRole(userId: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/individual-doctor/all-staff-role?userId=${userId}`,

      {
        headers: this.getHeader(token),
      }
    );
  }

  getAllStaffRoles(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/individual-doctor/all-staff-role`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  updateStaffRole(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/update-staff-role`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteStaffRole(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/delete-staff-role`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  getAllMenus(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/menu/all-menus`, {
      params,
      headers: this.getHeader(token),
    });
  }

  getAllSubMenus(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/menu/all-submenus`, {
      params,
      headers: this.getHeader(token),
    });
  }

  getUserMenus(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/menu/all-user-menu`, {
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
      { params: { module_name: "hospital" }, headers: this.getHeader(token) }
    );
  }
  //Questionnaire
  questiinnaireListApi(params: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/hospital/questionnaire-list`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }
  deleteQuestionnaireApi(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/action-on-questionnaire`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  relatedDoctors(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/get-related-doctors`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  relatedDoctorsForFourPortals(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/get-related-doctors-fourPortals`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  addQuestionnaire(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/add-questionnaire`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  getQuestionnaire(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/hospital/questionnaire-list`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }
  getQuestionnaireDetails(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/hospital/questionnaire-details`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  updateQuestionnaire(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/update-questionnaire`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  AllPatient() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/get-all-patient`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getmedicineListWithParam(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/medicine/get-medicine?limit=${data.limit}&searchText=${data.searchText}`,
      {
       
        headers: this.getHeader(token),
      }
    );
  }

  getLabListData(parameters: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/lab-test-master-list-for-doctor`,
      {
        params: parameters,
        headers: this.getHeader(token),
      }
    );
  }

  createEprescription(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/patient-clinical-info/create-epresciption`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  labtestPrescribe(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/patient-clinical-info/prescribe-labtest`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getMedicineDosages(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/get-eprescription-medicine-dosage`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  deleteMedicineDose(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/delete-eprescription-medicine-dosage`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getEprescription(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/get-eprescription`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  addEprescriptionLabTest(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/add-eprescription-labTest`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getEprescriptionLabTest(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/get-eprescription-lab-test`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  addEprescriptionImagingTest(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/add-eprescription-imagingTest`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getEprescriptionImagingTest(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/get-eprescription-imaging-test`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  addEprescriptionVaccinationTest(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/add-eprescription-vaccination`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getEprescriptionVaccinationTest(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/get-eprescription-vaccination-test`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  addEprescriptionOtherTest(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/add-eprescription-other`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getEprescriptionOtherTest(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/get-eprescription-other-test`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  addEprescriptionEyeglassTest(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/add-eprescription-eyeglass`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getEprescriptionEyeglassTest(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/get-eprescription-eyeglass-test`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  getAllEprescriptionTests(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/patient-clinical-info/get-epresciption`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  addEprescriptionSignature(formdata: FormData) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/add-eprescription-esignature`,
      formdata,
      {
        headers: this.getHeaderFileUpload(token),
      }
    );
  }

  listAllEprescription(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/list-all-eprescription`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getRecentPrescribedMedicinesList(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/recent-medicine-prescribed-by-doctor`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  listImagingForDoctor(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/imaging-test-master-list-for-doctor`,

      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  listVaccinationForDoctor(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/vaccination-master-list-for-doctor`,

      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  listEyeglassessForDoctor(parameter: any) {
    let token = this.auth.getToken();

    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/list-eyeglass-master-for-doctor`,

      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  listOthersForDoctor(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/others-test-master-list-for-doctor`,

      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  getLocationInfo(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/get-doctor-location`,

      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  getLocationInfoWithNames(data: any) {
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

  updateConsultation(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/add-consulatation-data`,
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
      `/doctor-service/payment/hospital-is-plan-purchased`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  async isPlanPurchesdByDoctor(user_id: any): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let reqData = {
        user_id,
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

  getnotificationdate(data: any) {
    return this.http.get(this.getBasePath() +
      `/doctor-service/doctor2/notificationlist`, { params: data, headers: this.getHeader(localStorage.getItem("token")) })
  }
  getInsurancePlanDetailsbysubscriber(param: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + ``, //{}-insurance/insurance-subscriber/get-plan-service-by-subscriber
     {
      params: param,
      headers: this.getHeader(token)
    });
  }

  getAllNotificationService(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/doctor2/get-all-notification`,

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
      `/doctor-service/doctor2/update-notification`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  markAllReadNotification(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/doctor-service/doctor2/mark-all-read-notification`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  markReadNotificationById(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/doctor-service/doctor2/mark-read-notification-id`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getdepartmentAsperDoctor(param: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/doctor/department-Asper-Hospital_Doctor`,
      {
        departmentArray: param.departmentArray,
        doctor_list: param.doctor_list,

        serviceArray: param.serviceArray,

        unitArray: param.unitArray,
        in_hospital: param.in_hospital,



      },
      {

        headers: this.getHeader(token),
      }
    );
  }

  postAssignDoctor(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/get-AssignDoctor`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  onlineConsultationApi(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/doctor/online-consultation-count`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  facetofaceConsultationApi(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/doctor/facetoface-consultation-count`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  homeConsultationApi(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/doctor/home-consultation-count`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  allConsultationApi(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/doctor/all-consultation-count`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  patientPaymentHistoryToDoc(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/doctor/Patient-payment-historyToDoc`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  appointmentRevenuesCount(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/doctor/appointment-revenues-count`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getTotalRevenueMonthwiseF2F(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/doctor/totalRevenue-monthwise-f2f`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getTotalRevenueMonthwiseOnline(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/doctor/totalRevenue-monthwise-online`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  approvedStatusApi(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/doctor/graph-list-status`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  //--------User Invitation--------------
  invitationList(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/individual-doctor/get-email-invitation-list`,
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
      this.getBasePath() + `/doctor-service/individual-doctor/get-email-invitation-id`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  inviteUser(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/doctor-service/individual-doctor/send-email-invitation`, data, {
      headers: this.getHeader(token),
    });
    // return of({
    //   response: { status: true, message: "Invitation Sent", ...data },
    // });
  }

  deleteInvitation(data: any) {
    // return of({ status: true, message: "Succesfully delete invitation" });

    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/doctor-service/individual-doctor/delete-email-invitation`, data,
      {
        headers: this.getHeader(token)
      }
    );
  }
  getAllTitle() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/common-titlelist`,
      {

        headers: this.getHeader(token),
      }
    );
  }


  getAllDesignation() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/common-designationlist`,
      {

        headers: this.getHeader(token),
      }
    );
  }

  getAllTeam() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/common-api/common-teamlist`,
      {

        headers: this.getHeader(token),
      }
    );
  }
  myLeaveList(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/leave/get-myleave`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  // Hospitalids list for dropdown
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
  doctorStaffleaveList(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/leave/self-leaves-list`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  leaveTypeList(paramData: any) {
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

  // all leave list
  allStaff_Leave_List_in_doctor(paramData: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/leave/doctor-staff-leaves-list`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  leaveReject(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/doctor-service/leave/staffleave-reject`,
      data,
      {
        headers: this.getHeader(token),

      }
    );
  }

  leaveAccept(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/doctor-service/leave/staffleave-accept`,
      data,
      {
        headers: this.getHeader(token),

      }
    );
  }

  addleave(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/leave/add-leave`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateStaffLeave(id: string, data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/doctor-service/leave/self-leave-update/${id}`,
      data,
      { headers: this.getHeader(token) }
    );
  }

  sendMailToPAtient(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/doctor/send-Mail-TO-Patient`,
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
      `/doctor-service/hospital/update-notification-status`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getDoctorBasicInfo(id: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/doctor-management-view-doctor-profile?portal_user_id=${id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getLocationDetailsById(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/get-all-doctor-location-by-id?portal_user_id=${data.portal_user_id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addManualTestss(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/doctor/add-manuall-tests`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  editTests(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/doctor/edit-manual-tests`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  updateLogs(data: any) {

    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/update-logs`,
      data,

    );
  }

  getUserLogs(params: any) {

    return this.http.get(
      this.getBasePath() + `/doctor-service/individual-doctor/get-all-logs-by-userId`,
      {
        params,

      }
    );
  }

  getTestsTotalClaimsForGraph(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/doctor/doctor_totalClaims_ForGraph`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getTotalTests(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/doctor/doctor_totalTests_allAppTypes`,
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
      `/doctor-service/hospital/providerdocument`,
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
      this.getBasePath() + `/doctor-service/hospital/providerdocumentlist`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  statusUpdateProviderDoc(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/doctor-service/hospital/inactive_isdelete_providerdocument`,
      data,
      {
        headers: this.getHeader(token),

      }
    );
  }

  getProviderDoc(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/hospital/getproviderdocument`,
      {
        params: param,
        headers: this.getHeader(token),

      }
    );
  }

  createUnRegisteredDoctor(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/create-unregister-doctor`,
      data,
      {
        headers: this.getHeader(token),

      }
    );
  }

  createUnRegisteredDoctorStaff(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/create-unregister-doctor-staff`,
      data,
      {
        headers: this.getHeader(token),

      }
    );
  }

  updateRole(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/hospital/update-staff-role`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  getAllSpeciality() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/speciality/speciality-list?limit=0&page=1&searchText=`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getAllCategory(reqData) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/category/get-category?page=${reqData.page}&limit=${reqData.limit}&searchText=${reqData.searchText}&status=${reqData.status}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getDoctorProfileDetails(id: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/doctor-management-view-doctor-profile?portal_user_id=${id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getLocations(id: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/doctor-management-get-locations?portal_user_id=${id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  feeManagement(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/doctor-management-fee-management`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  educationalDetails(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/doctor-management-educational-details`,
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
      `/doctor-service/doctor/doctor-management-document-management`,
      data,
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

  basicInformation(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/doctor-management-basic-info`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  deletePathologyTest(data: any) {
    
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/delete-hospital-pathology-tests`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  doctorAvailability(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/doctor-management-doctor-availability`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateAvailability(data:any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/doctor-management-update-availability`,
      data,
      {
        headers: this.getHeader(token)
      }
    )
  }

  getHospitalChatUser(paramData: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/doctor2/get-all-user-for-chat`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }


  getAllMessagesService(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/doctor2/all-message`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  clearAllMessages(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/doctor-service/doctor2/clear-all-messages`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  clearSingleMessages(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/doctor-service/doctor2/clear-single-message`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getRoomlistService(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/doctor2/get-create-chat`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  locationDetails(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/doctor-management-hospital-location`,
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
      `/doctor-service/doctor/delete-availabilty-by-deleting-location`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getHospitalList(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/get-all-hospital-list?page=${data.page}&limit=${data.limit}&status=${data.status}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getHospitalLocationById(id: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/read-hospital-locations?hospital_id=${id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getAllServices(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/all-service?limit=0&page=1&added_by=${data.added_by}&searchText=&for_department=${data.for_department}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getAllDepartment(reqData: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/all-department?added_by=${reqData.added_by}&limit=${reqData.limit}&page=${reqData.page}&searchText=${reqData.searchText}&sort=${reqData.sort}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getAllUnits(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/all-unit?limit=0&page=1&added_by=${data.added_by}&searchText=&for_service=${data.for_service}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getAllExperties(id: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/all-expertise?added_by=${id}&limit=0&page=1&searchText=`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getServiceDepartmentUnit(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/hospital/list-of-department-service-unit`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  userLogoutAPI() {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/logout`,
      {},
      {
        headers: this.getHeader(token),
      }
    );
  }

  addDiagnosis(data:any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/patient-clinical-info/add-diagnosis`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getDiagnosisListApi(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/get-diagnosis`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  updateDiagnosisApi(data:any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/doctor-service/patient-clinical-info/edit-diagnosis`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getLAbTestAddedByDoctor(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/get-prescribe-labtest`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getradioTestAddedByDoctor(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/get-prescribe-radiology-test`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  addLabtest(data:any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/patient-clinical-info/prescribe-labtest`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addradiotest(data:any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/patient-clinical-info/prescribe-radiology-test`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getDoctorDashboardApi(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/individual-doctor/dashboard`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getPrescribeTestHistory(param: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/get-prescribed-test-history/${param?.id}?serviceType=${param.serviceType}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getAllDoctor(){
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/individual-doctor/get-all-doctor`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  doctoradminDashboard(params:any){
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/individual-doctor/doctor-admin-dashboard`,
      {
        params:params,
        headers: this.getHeader(token),
      }
    );
  }

  private activeMenuSubject = new BehaviorSubject<string>(null);
  activeMenu$ = this.activeMenuSubject.asObservable();

  setActiveMenu(menuName: string): void {
    this.activeMenuSubject.next(menuName);
  }

  generateSignUrl(data:any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio/get-signed-url`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  appointmentStatusUpdate(data:any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/appointment/appointment-status-maskAs-complete`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  patientSubscriberdashboard(params:any){
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/patient-service/patient/get-subscribed-patient-for-doctor`,
      {
        params:params,
        headers: this.getHeader(token),
      }
    );
  }
  getAllCodesFilter(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/list-icd-code-filter`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  doctorDashboardExport(params:any){
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/individual-doctor/dashboard-export`,
      {
        params:params,
        headers: this.getHeader(token),
      }
    );
  }

  patientDashboardExport(params:any){
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/individual-doctor/get-patientData-export-for-doctor`,
      {
        params:params,
        headers: this.getHeader(token),
      }
    );
  }

  prescribedLabTestExport(params:any){
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/individual-doctor/get-labtest-appointment-list`,
      {
        params:params,
        headers: this.getHeader(token),
      }
    );
  }

  prescribedradioTestListExport(params:any){
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/individual-doctor/get-radio-test-appointment-list`,
      {
        params:params,
        headers: this.getHeader(token),
      }
    );
  }


  getAllPatientListForAdminDashboard(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/get-all-patient-lis-for-admin-dashboard`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }


  getExportAllDoctorLastLogin(fromDate?: string, toDate?: string) {
    let token = this.auth.getToken();
  
    // Build query params for fromDate and toDate
    let params: any = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
  
    return this.http.get(
      this.getBasePath() + `/doctor-service/individual-doctor/doctor-admin-dashboard-export-last-login`,
      {
        headers: this.getHeader(token),
        params: params, 
      }
    );
  }
  
  getPatientsWithCurrentAssignedDoctors(data: any) {
    let token = this.auth.getToken(); // Get the token
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/getAllPatient-with-currentassign-doc`,
      {
        params: data,
        headers: this.getHeader(token), 
      }
    );
  }

  getPatientsWithPreviousDoctors(data: any) {
    let token = this.auth.getToken(); // Get the token
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/getAllPatient-with-previous-doc`,
      {
        params: data,
        headers: this.getHeader(token),
      }
    );
  }
  
  

  
  getPendingLabTests(doctorId: string, data: { fromDate?: string; toDate?: string }) {
    let token = this.auth.getToken();
  
    return this.http.get(
      this.getBasePath() +
        `/doctor-service/individual-doctor/get-pending-labtest-appointment-list/${doctorId}`,
      {
        headers: this.getHeader(token),
        params: data,
      }
    );
  }
  
  

  getPendingRadiologyTests(doctorId: string,data: { fromDate?: string; toDate?: string }) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
        `/doctor-service/individual-doctor/get-pending-radio-test-appointment-list/${doctorId}`,
      {
        headers: this.getHeader(token),
        params: data,
      }
    );
  }
  
  
  

  
  


  getUnBookedPrescribedLabTest(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/get-un-booked-prescribe-lab-test`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }


  getUnBookedPrescribedRadiologyTest(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/get-un-booked-prescribe-radiology-test`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  labradioOrderListExport(params:any){
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/labradio-service/appointment/get-total-labradio-order-list-records-export`,
      {
        params:params,
        headers: this.getHeader(token),
      }
    );
  }
  ChangeAvailability(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/doctor-service/doctor/doctor-management-update-availability`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

}

