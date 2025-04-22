import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/shared/auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InsuranceManagementService {

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
}
