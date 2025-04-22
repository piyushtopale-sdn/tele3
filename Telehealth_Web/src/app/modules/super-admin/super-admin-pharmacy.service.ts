import { HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { throwError, Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { Constants } from "src/app/config/constants";
import { IResponse } from "src/app/shared/classes/api-response";
import { QueryStringParameters } from "src/app/shared/classes/query-string-parameters";
import { CoreService } from "src/app/shared/core.service";
import { environment } from "src/environments/environment";
import { ApiEndpointsService } from "../../core/services/api-endpoints.service";
import { ApiHttpService } from "../../core/services/api-http.service";
import {
  IPharmacyApproveRequest,
  IPharmacyApproveResponse,
  IPharmacyListRequest,
  IPharmacyListResponse,
  IPharmacyLockRequest,
} from "./super-admin-individualpharmacy/pharmacylist/pharmacylist.type";
import { AuthService } from "src/app/shared/auth.service";

@Injectable({
  providedIn: 'root'
})
export class SuperAdminPharmacyService {
  private pharmacyURL = "";
  constructor(
    private apiHttpService: ApiHttpService,
    private apiEndpointsService: ApiEndpointsService,
    private constants: Constants,
    private coreService: CoreService,
    private auth: AuthService
  ) {
    this.pharmacyURL = this.constants.PHARMACY_PORTAL;
  }
  getHeader(token: any) {
    const httpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      "role": "superadmin",
      "Authorization": `Bearer ${token}`,
    });
    return httpHeaders;
  }

  public listPharmacyAdmin(
    listData: IPharmacyListRequest
  ): Observable<IResponse<IPharmacyListResponse>> {
    const LIST_PHARMACY_ADMIN_URL =
      this.apiEndpointsService.createUrlWithQueryParameters(
        this.pharmacyURL + "pharmacy/list-pharmacy-admin-user",
        (qs: QueryStringParameters) => {
          const listEntries = Object.entries(listData);
          listEntries.forEach((entry) => {
            qs.push(entry[0], entry[1]);
          });
        }
      );
    let token = this.auth.getToken();
    return this.apiHttpService
      .get<IPharmacyListResponse>(LIST_PHARMACY_ADMIN_URL,{ headers: this.getHeader(token) })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
  }

  public approvePharmacy(pharmacyData: IPharmacyApproveRequest): Observable<IResponse<IPharmacyApproveResponse>> {
    const APPROVE_URL = this.apiEndpointsService.createUrl(
      this.pharmacyURL + "pharmacy/approve-or-reject-pharmacy",
      true
    );
    let token = this.auth.getToken();
    return this.apiHttpService
      .post<IPharmacyApproveResponse>(APPROVE_URL, pharmacyData, { headers: this.getHeader(token) })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
  }

  public lockPharmacy(pharmacyData: IPharmacyLockRequest): Observable<IResponse<IPharmacyApproveResponse>> {
    const LOCK_URL = this.apiEndpointsService.createUrl(
      this.pharmacyURL + "pharmacy/lock-profile",
      true
    );
    return this.apiHttpService
      .post<any>(LOCK_URL, pharmacyData)
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
  }


  public activedeletePharmacy(pharmacyData: any): Observable<any> {
    const LOCK_URL = this.apiEndpointsService.createUrl(
      this.pharmacyURL + "pharmacy/delete-active-admin",
      true
    );
    return this.apiHttpService
      .post<any>(LOCK_URL, pharmacyData)
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError(this.handleError)
      );
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
}
