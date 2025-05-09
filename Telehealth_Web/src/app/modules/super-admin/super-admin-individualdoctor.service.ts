import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/shared/auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminIndividualdoctorService {


  constructor(private http: HttpClient, private auth: AuthService) { }

  getHeader(token: any) {
    const httpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      "role": "superadmin",
      "Authorization": `Bearer ${token}`,
    });
    return httpHeaders;
  }

  getBasePath() {
    return environment.apiUrl;
  }


  getMenus(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/menu/all-menus`, {
      params,
      headers: this.getHeader(token)
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

  doctorsList(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/doctor/get-doctor-list`, {
      params,
      headers: this.getHeader(token)
    });
  }

  mostPerformedTestAndRevenueOfCenter(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/get-test-payment-info?labRadioId=${params.labRadioId}&type=${params.type}`, {
      headers: this.getHeader(token)
    });
  }

  frequentlyPerformedTestByDoctor(doctorId: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/most-performed-test-per-doctor?doctorId=${doctorId}`, {
      headers: this.getHeader(token)
    });
  }

  getEachTestPerformedCountByDoctor(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/total-test-Performed-each-doctor?doctorId=${params.doctorId}&type=${params.type}`, {
      headers: this.getHeader(token)
    });
  }

  totalRevenuePerTest(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/get-revenue-per-test?testId=${params.testId}&type=${params.type}`, {
      headers: this.getHeader(token)
    });
  }

  approveOrRejectDoctor(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/approve-or-reject-doctor`,
      data,
      { headers: this.getHeader(token) }
    );
  }

  getDoctorDetails(id: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/doctor-service/doctor/doctor-management-view-doctor-profile?portal_user_id=${id}`,
      { headers: this.getHeader(token) }
    );
  }


  activeLockDeleteDoctor(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/doctor/active-lock-delete-doctor`,
      data,
      { headers: this.getHeader(token) }
    );
  }

  DentalList(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + ``, //{}-labimagingdentaloptical/labimagingdentaloptical/getFourPortalList
     {
      params,
      headers: this.getHeader(token)
    });
  }

  insurancedoctorsList(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/doctor/get-insuarnce-doctor-list`, {
      params,
      headers: this.getHeader(token)
    });
  }

  getinsurancedoctor(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/individual-doctor/get-unregister-doctor`, {
      params,
      headers: this.getHeader(token)
    });
  }


  updateInsuranceDoc(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/doctor-service/individual-doctor/update-unregister-doctor`,
      data,
      { headers: this.getHeader(token) }
    );
  }
  listofDiscountCodeUsedforEachTest(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/doctor-service/patient-clinical-info/list-discountcode-usedfor-each-test`, {
      params,
      headers: this.getHeader(token)
    });
  }

  updateDoctorAdminPermission(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/doctor-service/individual-doctor/update-mark-as-doctor-admin`,
      data,
      { headers: this.getHeader(token) }
    );
  }


}
