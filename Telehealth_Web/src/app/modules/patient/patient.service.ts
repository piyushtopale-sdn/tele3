import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, Observable, throwError, of, map, BehaviorSubject } from "rxjs";
import { Constants } from "src/app/config/constants";
import { ApiEndpointsService } from "src/app/core/services/api-endpoints.service";
import { ApiHttpService } from "src/app/core/services/api-http.service";
import { AuthService } from "src/app/shared/auth.service";
import { IResponse } from "src/app/shared/classes/api-response";
import { QueryStringParameters } from "src/app/shared/classes/query-string-parameters";
import { CoreService } from "src/app/shared/core.service";
import { environment } from "src/environments/environment";
import {
  IDocMetaDataRequest,
  IDocMetaDataResponse,
  INewOrderRequest,
  INewOrderResponse,
  ISubscriberData,
  IUniqueId,
} from "./homepage/retailpharmacy/retailpharmacy.type";
import {
  IDocumentMetaDataResponse,
  IMedicineConfirmResponse,
  IMedicineUpdateResponse,
  IOrderCancelResponse,
  IOrderConfimRequest,
  IOrderDetailsRequest,
  IOrderDetailsResponse,
  IOrderUpdateRequest,
  ISignedUrlRequest,
} from "./patient-prescriptionorder/neworder/neworder.type";
import {
  IOrderCountResponse,
  IOrderListRequest,
  IOrderListResponse,
  IOrderCountRequest,
} from "./patient-prescriptionorder/prescriptionorder/prescriptionorder.type";

@Injectable({
  providedIn: "root",
})
export class PatientService {
  private pharmacyDataSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private uuid = localStorage.getItem("deviceId");
  private patientURL = "";
  private pharmacyURL = "";
  private faqData = new BehaviorSubject<any[]>([]);
  param: any;
  faqData$ = this.faqData.asObservable(); // Expose it as an observable
  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private apiHttpService: ApiHttpService,
    private apiEndpointsService: ApiEndpointsService,
    private constants: Constants,
    private coreService: CoreService
  ) {
    this.param = {
      module_name: this.auth.getRole(),
    };
    this.patientURL = this.constants.PATIENT_PORTAL;
    this.pharmacyURL = this.constants.PHARMACY_PORTAL;
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
    // let token = this.auth.getToken();
    // return this.http.post(
    //   this.getBasePath() + `/doctor-service/individual-doctor/get-participant-details`,
    //   data,
    //   {
    //     headers: this.getHeader(token),
    //   }
    // );
    let observable = Observable.create(observer => {
      let finalResponse = {
        participantName: "vikas",
        userId: "63e1f567a825766f5c52b0de",
        Identity: "544dishfhsdgfds",
        image: null,
        isAudioMute: false,
        isVideoMute: false,
      };
      let data1 = {
        status: 'Success',
        messageID: 200,
        message: "FETCH_SUCCESS",
        data: finalResponse,
      }
      observer.next(data1); // This method same as resolve() method from Angular 1
      observer.complete();//to show we are done with our processing
      // observer.error(new Error("error message"));
    })

    return observable
  }

  getHeader(token: any, deviceId: any = "") {
    const httpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      role: "patient",
      Authorization: `Bearer ${token}`,
      uuid: localStorage.getItem("deviceId"),
    });
    return httpHeaders;
  }

  getBasePath() {
    return environment.apiUrl;
  }

  addPatient(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/patient-service/patient/signup`, data, {
      headers: this.getHeader(""),
    });
  }

  getcinetpaylink(data: any) {
    return this.http.post('https://api-checkout.cinetpay.com/v2/payment', data, { headers: this.getHeader("") });
  }

  getVerificationCode(data: any) {
    return this.http.post(
      this.getBasePath() + `/patient/send-sms-otp-for-2fa`,
      data,
      {
        headers: this.getHeader("asdasd"),
      }
    );
  }

  verifyOtp(data: any, uuid: any = ""): Observable<any> {
    return this.http.post(
      this.getBasePath() + `/patient/match-sms-otp-for-2fa`,
      data,
      {
        headers: this.getHeader("", uuid),
      }
    );
  }

  getVerificationCodeMobile(data: any) {
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/send-sms-otp-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  getVerificationCodeEmail(data: any) {
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/send-email-otp-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  verifyMobileOtp(data: any): Observable<any> {
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/match-sms-otp-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  verifyEmailOtp(data: any): Observable<any> {
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/match-email-otp-for-2fa`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  login(data: any, uuid: any = "") {
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/login`,
      data,
      {
        headers: this.getHeader("", uuid),
      }
    );
  }

  public newOrder(
    orderData: INewOrderRequest
  ): Observable<IResponse<INewOrderResponse>> {
    const NEW_ORDER_URL = this.apiEndpointsService.createUrl(
      this.pharmacyURL + "order/new-order",
      true
    );
    return this.apiHttpService
      .post<INewOrderResponse>(NEW_ORDER_URL, orderData, {
        headers: new HttpHeaders().set(
          "Authorization",
          "Bearer " + this.auth.getToken()
        ),
      })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
  }

  public saveMetadata(
    docData: any
  ): Observable<IResponse<IDocMetaDataResponse[]>> {
    const META_DATA_URL = this.apiEndpointsService.createUrl(
      this.pharmacyURL + "pharmacy/save-documentmetadata",
      true
    );
    return this.apiHttpService
      .post<IDocMetaDataResponse[]>(META_DATA_URL, docData)
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
  }

  public orderList(
    listRequest: IOrderListRequest
  ): Observable<IResponse<IOrderListResponse>> {
    const ORDER_LIST_URL = this.apiEndpointsService.createUrl(
      this.pharmacyURL + "order/list-order",
      true
    );
    return this.apiHttpService
      .post<IOrderListResponse>(ORDER_LIST_URL, listRequest, {
        headers: new HttpHeaders().set(
          "Authorization",
          "Bearer " + this.auth.getToken()
        ),
      })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
  }

  public orderCount(
    countRequest: IOrderCountRequest
  ): Observable<IResponse<IOrderCountResponse[]>> {
    const ORDER_COUNT_URL =
      this.apiEndpointsService.createUrlWithQueryParameters(
        this.pharmacyURL + "order/order-count",
        (qs: QueryStringParameters) => {
          const listEntries = Object.entries(countRequest);
          listEntries.forEach((entry) => {
            qs.push(entry[0], entry[1]);
          });
        }
      );
    return this.apiHttpService
      .get<IOrderCountResponse[]>(ORDER_COUNT_URL, {
        headers: new HttpHeaders().set(
          "Authorization",
          "Bearer " + this.auth.getToken()
        ),
      })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
  }

  public getOrderDetails(userData: IOrderDetailsRequest): Observable<IResponse<IOrderDetailsResponse>> {
    const ORDER_DETAIL_URL = this.apiEndpointsService.createUrl(
      this.pharmacyURL + "order/order-details",
      true
    );
    return this.apiHttpService
      .post<IOrderDetailsResponse>(ORDER_DETAIL_URL, userData, {
        headers: new HttpHeaders().set(
          "Authorization",
          "Bearer " + this.auth.getToken()
        ),
      })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
  }


  public fetchAppointmentDetails(userData: IOrderDetailsRequest): Observable<IResponse<IOrderDetailsResponse>> {
    const ORDER_DETAIL_URL = this.apiEndpointsService.createUrl(
      this.pharmacyURL + "labimagingdentaloptical/appointment-details",
      true
    );
    return this.apiHttpService
      .post<IOrderDetailsResponse>(ORDER_DETAIL_URL, userData, {
        headers: new HttpHeaders().set(
          "Authorization",
          "Bearer " + this.auth.getToken()
        ),
      })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
  }


  public updateOrderDetails(
    userData: IOrderUpdateRequest
  ): Observable<IResponse<IMedicineUpdateResponse>> {
    const ORDER_DETAIL_URL = this.apiEndpointsService.createUrl(
      this.pharmacyURL + "order/order-details",
      true
    );
    return this.apiHttpService
      .put<IMedicineUpdateResponse>(ORDER_DETAIL_URL, userData, {
        headers: new HttpHeaders().set(
          "Authorization",
          "Bearer " + this.auth.getToken()
        ),
      })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
  }

  public confirmOrderDetails(
    userData: IOrderConfimRequest
  ): Observable<IResponse<IMedicineConfirmResponse>> {
    const ORDER_DETAIL_URL = this.apiEndpointsService.createUrl(
      this.pharmacyURL + "order/confirm-order",
      true
    );
    return this.apiHttpService
      .post<IMedicineConfirmResponse>(ORDER_DETAIL_URL, userData, {
        headers: new HttpHeaders().set(
          "Authorization",
          "Bearer " + this.auth.getToken()
        ),
      })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
  }

  public cancelOrderDetails(
    userData: IOrderConfimRequest
  ): Observable<IResponse<IOrderCancelResponse>> {
    const ORDER_DETAIL_URL = this.apiEndpointsService.createUrl(
      this.pharmacyURL + "order/cancel-order",
      true
    );
    return this.apiHttpService
      .post<IOrderCancelResponse>(ORDER_DETAIL_URL, userData, {
        headers: new HttpHeaders().set(
          "Authorization",
          "Bearer " + this.auth.getToken()
        ),
      })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
  }

  public getDocumentMetadata(
    userData: IUniqueId
  ): Observable<IResponse<IDocumentMetaDataResponse>> {
    const DOC_METADATA_URL =
      this.apiEndpointsService.createUrlWithQueryParameters(
        this.pharmacyURL + "pharmacy/get-document-metadata",
        (qs: QueryStringParameters) => {
          const listEntries = Object.entries(userData);
          listEntries.forEach((entry) => {
            qs.push(entry[0], entry[1]);
          });
        }
      );
    return this.apiHttpService
      .get<IDocumentMetaDataResponse>(DOC_METADATA_URL)
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
  }

  public signedUrl(userData: ISignedUrlRequest): Observable<IResponse<string>> {
    const DOC_URL = this.apiEndpointsService.createUrl(
      this.pharmacyURL + "pharmacy/get-signed-url",
      true
    );
    return this.apiHttpService.post<string>(DOC_URL, userData).pipe(
      map((response) => this.handleResponse(response)),
      catchError(this.handleError)
    );
  }

  private handleEncryptedError(err: HttpErrorResponse) {
    return throwError(() => new Error(err.error));
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

  //signup
  addPatSuperAdmin(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/patient/signup`, data, {
      headers: this.getHeader("asdasd"),
    });
  }

  //...........forgotPassword.............
  forgotPassword(body: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/forgot-password`,
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
      this.getBasePath() + `/patient-service/patient/reset-forgot-password`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  //--------User Invitation--------------
  invitationList(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/get-email-invitation-list`,
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
      this.getBasePath() + `/patient-service/patient/get-email-invitation-id`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  inviteUser(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/patient-service/patient/send-email-invitation`, data, {
      headers: this.getHeader(token),
    });
    // return of({
    //   response: { status: true, message: "Invitation Sent", ...data },
    // });
  }

  deleteInvitation(data: any) {
    // return of({ status: true, message: "Succesfully delete invitation" });

    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/patient-service/patient/delete-email-invitation`, data,
      {
        headers: this.getHeader(token)
      }
    );
  }

  //---------------Profile Creation -------------

  uploadFile(formData: FormData) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/labradio-service/lab-radio/upload-documents`,
      formData,
      {
        headers: this.getHeaderFileUpload(token),
      }
    );
  }

  profileDetails(paramData: any) {

    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/patient-details`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  //new , added by dilip

  patientParentFullDetails(paramData: any) {

    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/patient-parent-details`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  updateNotification(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/patient-service/patient/update-notification-status`,
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  viewPaientPersonalDetails(paramData: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/patient-personal-details`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  // profileDetails(params: any) {
  //   let token = this.auth.getToken();
  //   return this.http.get(
  //     this.getBasePath() + `/patient-service/patient/patient-details`,
  //     {
  //       params: params,
  //       headers: this.getHeader(token),
  //     }
  //   );
  // }

  commonData() {
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/common-api`,
      {
        headers: this.getHeader(""),
      }
    );
  }

  immunizationList() {
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/static-immunization-list`,
      {
        headers: this.getHeader(""),
      }
    );
  }
  vaccineList() {
    var token = localStorage.getItem("token");
    return this.http.get(
      this.getBasePath() + `/doctor-service/hospital/vaccination-master-list?searchText=&limit=0&page=1`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  allergiesList() {
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/static-allergies-list`,
      {
        headers: this.getHeader(""),
      }
    );
  }

  patientHistoryTypeList() {
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/static-patient-history-type-list`,
      {
        headers: this.getHeader(""),
      }
    );
  }

  lifestyleTypeList() {
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/static-patient-lifestyle-type-list`,
      {
        headers: this.getHeader(""),
      }
    );
  }

  familyHistoryTypeList() {
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/static-family-history-type-list`,
      {
        headers: this.getHeader(""),
      }
    );
  }

  personalDetails(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient/create-profile/personal-details`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  insuranceDetails(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient/create-profile/insurance-details`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addVitals(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient/create-profile/add-vitals`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getAllMedicationInfo(parameter: any) {
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

  getDiagnosisListApi(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/get-diagnosis`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  medicalHistoryDetail(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/create-profile/list-medical-history`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  socialHistoryDetail(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/create-profile/list-social-history`,
      {
        params,
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

  getLabTestListAPi(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/get-prescribe-labtest`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getradioTestListApi(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/get-prescribe-radiology-test`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  medicines(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient/create-profile/medicine-details`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  immunizations(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient/create-profile/immunization-details`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  editImmunization(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/edit-immunization`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteImmunization(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/delete-Immunization`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  patientHistory(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient/create-profile/history-details`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  medicalDocuments(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient/create-profile/medical-document`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  dependentFamilyMembers(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient/create-profile/family-details`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  //patient purchase plan service

  getPatientSubscriptionPlan(parameter: any) {
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

  parseStringToHTML(str) {
    var dom = document.createElement('div');
    dom.innerHTML = str;
    return dom.firstChild;

  }

  getPatientSubscriptionPlanDetails(parameter: any) {
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

  getPatientPlanOfUser(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/payment/subscription-purchased-plan`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  //patient purchase plan service ends

  //get common data

  public getAllCommonData() {
    // let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/common-api`,
      {
        headers: this.getHeader(""),
      }
    );
  }

  getmedicineListWithParam(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/superadmin/list-medicine-without-pagination`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }



  getmedicineList(param: any = {}) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin-service/superadmin/list-medicine-without-pagination`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getInsuanceList(isDeleted: any = "") {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/superadmin/get-insurance-admin-approved-list?limit=10000&page=1&isDeleted=${isDeleted}`,
      { headers: this.getHeader(token) }
    );
  }

  spokenLanguage() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/common-api`,
      { headers: this.getHeader(token) }
    );
  }

  getPharmacyDetails(pharmacyID: any) {
    return this.http.get(
      this.getBasePath() +
      `/pharmacy-service/pharmacy/pharmacy-details?pharmacyId=${pharmacyID}`,
      { headers: this.getHeader("") }
    );
  }

  patientExistingDocs(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/patient-existing-docs`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  createMedicalDoc(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient/create-profile/medical-document`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  SubscribersList(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/subscribers-list-for-patient`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  subscribersDetails(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      ``, //{}-insurance/insurance-subscriber/subscriber-details
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  createPayment(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient-service/payment/create-payment-intent`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }



  getInsuranceList() {
    return this.http.get(
      this.getBasePath() + `/get-insurance-admin-approved-list`,
      { headers: this.getHeader("") }
    );
  }

 
  patientAppointmentList(parameter: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/patient/list-appointment`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }


  getAll(parameter: any): Observable<any> {
    // const headers = new HttpHeaders({
    //   additionalHeaders: this.getAdditionalHeaders,
    // });
    // isLoading && this.loadingStateSubject.next(true);
    let token = this.auth.getToken();
    return this.http
      .get<any>(this.getBasePath() + `/doctor-service/patient/list-appointment`, { params: parameter, headers: this.getHeader(token) })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }




  cancelAppointment(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/doctor-service/patient/cancel-appointment`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  setReminder(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/patient/set-reminder-for-appointment`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }
  getRemindersData(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/patient/get-reminder-for-appointment`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }
  getDoctorInfo(parameter: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/patient/view-doctor-details-for-patient`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }
  getAppointmentDetails(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/patient/view-appointment`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  getPastAppointOfPatient(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/appointment/list-appointment`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getAllDoctor() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/hospital-doctor/all-doctors`,
      {
        headers: this.getHeader(token),
      }
    );
  }


  allDoctorsHopitalizationList() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/hospital-doctor/allDoctorsHopitalizationList`,
      {
        headers: this.getHeader(token),
      }
    );
  }
  getPermission(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/get-profile-permission`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  setPermission(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/set-profile-permission`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addMedicineOnWaitingRoom(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/patient-service/patient/add-medicine-on-waiting-room`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  editMedicineOnWaitingRoom(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/patient-service/patient/edit-medicine-on-waiting-room`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  getAssesment(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/hospital/assessment-list`,
      {
        params: parameter,
        headers: this.getHeader(token)
      })

  }
  allRole(userId: string) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/role/all-role`, {
      params: {
        userId,
        module_name: "pharmacy",
      },
      headers: this.getHeader(token),
    });
  }

  addAssesment(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/doctor-service/hospital/add-and-edit-assessment`,
      data,
      {
        headers: this.getHeader(token)
      })
  }

  getAssessmentList(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/get-assessment`,
      {
        params: data,
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

  getSubscriberDetails(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + ``, //{}-insurance/insurance-subscriber/view-subscriber

      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getAllRatingAndReviews(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/all-rating-reviews-by-patient`,

      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getAllFourPortalRatingAndReviews(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + ``, //{}-labimagingdentaloptical/labimagingdentaloptical/get-rating-and-reveiws

      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getPurchasedPlanByPatient(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/get-plan-purchased-by-patient`,

      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  checkForPlanPurchased(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/payment/patient-is-plan-purchased`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  async isPlanPurchesdByPatient(user_id: any): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let reqData = {
        user_id,
      };
      this.checkForPlanPurchased(reqData).subscribe(async (res) => {
        let isPlanPurchased = false;
        let response = await this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          isPlanPurchased = response?.isPlanPurchased;
        }
        resolve(isPlanPurchased);
      }, error => {
        reject(error);
      });
    });
  }



  getDependentFamilyMembers(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/patient-dependent-family-members`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getPatientVitals(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/get-vitals`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  getVitalThreshold(paramData: any) {
    let token = this.auth.getToken();
    return this.http.get(
      // this.getBasePath() + `/superadmin-service/vitalsthreshold/get-vitals-threshold`,
      this.getBasePath() + `/superadmin-service/newvitalsthreshold/get-reference-range`, //temporary
      {
        params: paramData,
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

  // getPatientVitalsMonthly(parameter: any) {
  //   let token = this.auth.getToken();
  //   return this.http.get(
  //     this.getBasePath() +
  //       `/patient-service/patient/get-vitals-monthly`,
  //     {
  //       params: parameter,
  //       headers: this.getHeader(token),
  //     }
  //   );
  // }

  getPatientAppointmentss(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/patient/list-appointment-upcoming`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }


  getallplanPriceforPatient(params) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/payment/patient-getallplanPrice`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  // sendInvitation(data: any) {
  //   let token = this.auth.getToken();
  //   return this.http.post(this.getBasePath() + `patient/send-email-invitation`, data, {
  //     headers: this.getHeader(""),
  //   });
  // }

  updatePharmacyData(data: any) {
    this.pharmacyDataSubject.next(data);
  }

  getPharmacyData(): Observable<any> {
    return this.pharmacyDataSubject.asObservable();
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
  getPaymentHistoryForPatient(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/payment/getPaymentHistoryForPatient`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

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

  // getallFaq(params: any) {
  //   let token = this.auth.getToken();
  //   return this.http.get(
  //     this.getBasePath() + `/superadmin-service/content-management/all-faq`,
  //     {
  //       params,
  //       headers: this.getHeader(token),
  //     }
  //   );
  // }
  getallFaq(params: any): Observable<{ body: { faqs: any[] }[] }> {
    let token = this.auth.getToken();
    return this.http.get<{ body: { faqs: any[] }[] }>(
      this.getBasePath() + `/superadmin-service/content-management/all-faq`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }
  
  fetchAndStoreFaqs(params: any) {
    this.getallFaq(params).subscribe((res) => {
      this.faqData.next(res?.body[0]?.faqs || []); // Store the fetched FAQs
    });
  }
//[[7 feb Landing Page Bussiness Form Data Send in Payload Task ]]

  //..........Bussiness Form...........
  postBussinessForm(reqData: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.post<any>(
      this.getBasePath() + `/superadmin-service/common-api/add-bussiness-form`,
      reqData,
      {
        headers: this.getHeader(token),
      }
    );
  }

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
  //...........forgotPassword.............
  changePassword(body: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/change-password`,
      body,
      {
        headers: this.getHeader(token),
      }
    );
  }



  postInsuranceDetails(body: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      ``, ///{}-insurance/insurance/post-subscriber-list-by-first-last-name-dob-mobile
      body,
      {
        headers: this.getHeader(token),
      }
    );
  }


  articleByIdApi(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/content-management/get-Article-by-Id`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getAllNotificationService(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/patient-service/patient/get-all-notification`,

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
      `/patient-service/patient/update-notification`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  markAllReadNotification(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/patient-service/patient/mark-all-read-notification`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  markReadNotificationById(data: any) {
    let token = this.auth.getToken();
    return this.http.put(this.getBasePath() + `/patient-service/patient/mark-read-notification-id`, data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getLabListDataWithoutPagination(param: any = {}) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/labTestList-without-pagination`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  getLabTestId(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/lab-test-byId`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  newLabOrder(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + ``, //{}-labimagingdentaloptical/labimagingdentaloptical/add-new-lab-order
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  savefourPortalMetaData(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + ``, //{}-labimagingdentaloptical/labimagingdentaloptical/save-documentmetadata
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  orderlistallfourPortal(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + ``, //{}}-labimagingdentaloptical/labimagingdentaloptical/four-portal-order-list
      data,

      {
        headers: this.getHeader(token),
      }
    );
  }

  totalcountallPortal(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + ``, //{}-labimagingdentaloptical/labimagingdentaloptical/four-portal-totalOrderCount

      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  fetchOrderDetailsallPortal(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + ``, //{}-labimagingdentaloptical/labimagingdentaloptical/four-portal-fetchOrderDetails
       data,

      {

        headers: this.getHeader(token),
      }
    );
  }

  getIamgingListDataWithoutPagination(param: any = {}) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/imagingTestList-without-pagination`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  getImagingTestId(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/imaging-test-byId`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getOthersListDataWithoutPagination(param: any = {}) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/othersTestList-without-pagination`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  getOthersTestId(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/others-test-byId`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  getEyeglassesListDataWithoutPagination(param: any = {}) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/eyeglassesTestList-without-pagination`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  getEyeglassesTestId(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/eyeglasses-test-byId`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  fourPortal_bookAppointment(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      ``, //{}-labimagingdentaloptical/labimagingdentaloptical/four-portal-appointment
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }


  fourPortal_viewAppointment(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      ``, //{}-labimagingdentaloptical/labimagingdentaloptical/four-portal-view-Appointment
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getallClinicHospital(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/hospital/get-all-hospital-and-clinic`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getfourportalClinicHospital(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      ``, //{}-labimagingdentaloptical/labimagingdentaloptical/get-fourportal-all-hospital-and-clinic
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  getIDbyImmunization(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/get-id-by-immunization`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  searchbyPortaluserName(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/search-any-portaluser-by-search-keyword`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  blogByIdApi(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/content-management/get-Blog-by-Id`,
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  getAllDoctor_fourportalUsers() {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/hospital-doctor/alldoctor_fourportal_users`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteVitalsAPI(id: any) {
    let token = this.auth.getToken();
    return this.http.delete(
      this.getBasePath() + `/patient-service/patient/create-profile/delete-vitals/${id}`,     
      {
        headers: this.getHeader(token),
      }
    );
  }
  getMedicalDoument(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/get-medical-documents`,
      {
        params: data,
        headers: this.getHeader(token),
      }
    );
  }
  deleteSocialHistory(data:any){
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/patient-service/patient/create-profile/delete-social-history`, 
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteMedicalHistory(data:any){
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/patient-service/patient/create-profile/delete-medical-history`, 
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addSocialHistory(data:any){
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/patient-service/patient/create-profile/add-social-history`, 
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addMedicalHistory(data:any){
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/patient-service/patient/create-profile/add-medical-history`, 
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateSocialHistory(data:any){
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/patient-service/patient/create-profile/edit-social-history`, 
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateMedicalHistory(data:any){
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/patient-service/patient/create-profile/edit-medical-history`, 
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getlab_TestProcedureDetails(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/appointment/get-test-procedure-history`,
      {
        params: data,
        headers: this.getHeader(token),
      }
    );
  }
  addVitals_newAPI(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/add-vitals`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getPatientAllVitals_newAPI(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/get-all-vitals`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }
  getAssignedDoctors(params: any): Observable<any> {
    let token = this.auth.getToken()
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/get-assigned-doctors/${params.id}`, 
      {
        params: params,
        headers: this.getHeader(token),
      }
    );
  }

  getFamilyMembersList(params: any): Observable<any> {
    let token = this.auth.getToken()
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/create-profile/list-family-member?patientId=${params.patient_id}`, 
      {
        headers: this.getHeader(token),
      }
    );
  }

  getDeletedFamilyMembersList(params: any): Observable<any> {
    let token = this.auth.getToken()
    return this.http.get(
      this.getBasePath() +
      `/patient-service/patient/create-profile/deleted-list-family-member?patientId=${params.patient_id}`, 
      {
        headers: this.getHeader(token),
      }
    );
  }

  addFamilyMembers(data: FormData) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/patient-service/patient/create-profile/add-family`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  editFamilyMembers(data: FormData) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/patient-service/patient/create-profile/edit-family`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteFamilyMembers(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() + `/patient-service/patient/create-profile/delete-activate-family`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  //API For getting VitalThreshold for BP
  getBloodPressureVitals(paramData: any) {
    let token = this.auth.getToken();
  
    paramData = {
      ...paramData, 
      searchText: 'BLOOD_PRESSURE|HEART_RATE|PULSE|TEMPERATURE|BLOOD_GLUCOSE|WEIGHT|HEIGHT'
    };
    return this.http.get(
      this.getBasePath() + `/superadmin-service/newvitalsthreshold/get-vitals-threshold`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

}


