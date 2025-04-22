import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AuthService } from "src/app/shared/auth.service";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class SuperAdminHospitalService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  getHeader(token: any) {
    const httpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      role: "superadmin",
      Authorization: `Bearer ${token}`,
    });
    return httpHeaders;
  }

  getBasePath() {
    return environment.apiUrl;
  }

  getMenus(params: any) { 
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath()+`/menu/all-menus`,{
      params,
      headers: this.getHeader(token)
    });
  }

  getUserMenus(params: any) { 
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath()+`/menu/all-user-menu`,{
      params,
      headers: this.getHeader(token)
    });
  }

  asignMenuSubmit(data: any){
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath()+`/menu/add-user-menu`, data ,{
      params: {
        module_name: 'superadmin',
      },
      headers: this.getHeader(token)
    });
  }

  hospitalList(data: any) {
     let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
        `/doctor-service/hospital/get-all-hospital-list?page=${data.page}&limit=${data.limit}&status=${data.status}&sort=${data.sort}&searchKey=${data.searchKey}`,
      { headers: this.getHeader(token) }
    );
  }

  approveOrRejectHospital(data: any) {
     let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
        `/doctor-service/hospital/approve-or-reject-hospital`,
      data,
      { headers: this.getHeader(token) }
    );
  }

  getHospitalDetails(id:any){
     let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
        `/doctor-service/hospital/view-hospital-admin-details?hospital_admin_id=${id}`,
      { headers: this.getHeader(token) }
    );
  }

  activeLockDeleteHospital(data:any){
     let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
        `/doctor-service/hospital/active-lock-delete-hospital`,
        data,
      { headers: this.getHeader(token) }
    );
  }
  getunregisteredHospitalList(data){
    let token = this.auth.getToken();  
   return this.http.get(
     this.getBasePath() +
       `/doctor-service/hospital/get-all-unRegistered-Hospital-list?page=${data.page}&limit=${data.limit}&status=${data.status}&sort=${data.sort}&searchKey=${data.searchKey}&createdBy=${data.createdBy}`,       
       { headers: this.getHeader(token) }
   );
 }

 getunregisteredHospitalData(data){
  let token = this.auth.getToken();  
 return this.http.get(
   this.getBasePath() +
     `/doctor-service/hospital/get-unRegistered-Hospital-details?hospitalId=${data.hospitalId}`,       
     { headers: this.getHeader(token) }
 );
}
}
