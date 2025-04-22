import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { environment } from "src/environments/environment";

@Injectable()
export class PharmacyPlanService {
  param: any;
  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private _coreService: CoreService
  ) {
    this.param = {
      module_name: this.auth.getRole(),
    };
  }

  getHeader(token: any, deviceId: any = "") {
    const httpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
      role: "pharmacy",
      Authorization: `Bearer ${token}`,
      uuid: localStorage.getItem("deviceId"),
    });
    return httpHeaders;
  }


  getBasePath() {
    return environment.apiUrl;
  }

  getPharmacySubscriptionPlan(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/all-subscription-plans`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  getcinetpaylink(data: any) {
    // return this.http.post('https://api-checkout.cinetpay.com/v2/payment', data,{  headers: this.getHeader("")});
    return this.http.post('https://api-checkout.cinetpay.com/v2/payment', data, { headers: this.getHeader("") });

  }

  getPharmacySubscriptionPlanDetails(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin-service/superadmin/get-subscription-plan-details`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  getPurchasedPlanOfUser(parameter: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/pharmacy-service/payment/subscription-purchased-plan`,
      {
        params: parameter,
        headers: this.getHeader(token),
      }
    );
  }

  signUp(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/pharmacy-service/pharmacy/signup`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  getVerificationCodeMobile(data: any) {
    return this.http.post(
      this.getBasePath() + `/pharmacy-service/pharmacy/send-sms-otp`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  getVerificationCodeEmail(data: any) {
    return this.http.post(
      this.getBasePath() + `/pharmacy-service/pharmacy/send-email-verification`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  verifyMobileOtp(data: any): Observable<any> {
    return this.http.post(
      this.getBasePath() + `/pharmacy-service/pharmacy/match-sms-otp`,
      data,
      {
        headers: this.getHeader(""),
      }
    );
  }

  // verifyEmailOtp(data:any):Observable<any>{
  //   return this.http.post(this.getBasePath()+`/pharmacy-service/patient/match-email-otp-for-2fa`,data ,{
  //     headers: this.getHeader('')
  //   });
  // }

  saveOpeningHour(data: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/pharmacy-service/pharmacy/pharmacy-opening-hours`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  saveOnDuty(data: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() + `/pharmacy-service/pharmacy/pharmacy-on-duty`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

 



  

  getApprovedInsurance(param: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/superadmin/get-insurance-admin-approved-list`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  getInsuranceAcceptedList(param: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/pharmacy-service/claim/getInsuranceAcceptedList?pharmacyId=${param.pharmacyId}`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }


  getInsuranceAcceptedListForFourPortal(param: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + ``, //{}-labimagingdentaloptical/labimagingdentaloptical/getInsuranceAcceptedListForFourPortal?portal_id=${param.portal_id}
      {
        // params: param,
        headers: this.getHeader(token),
      }
    );
  }


  getInsuranceAcceptedListDoctor(param: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/doctor-service/patient/getInsuranceAcceptedListForDoc?pharmacyId=${param.doctorId}`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getAllPatientList(): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/patient-service/patient/get-all-patient`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getPharmacyStaffName(param: any): Observable<any> {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/pharmacy-service/pharmacy/list-category-staff`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

}