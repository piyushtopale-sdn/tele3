// Angular Modules
import { Injectable } from "@angular/core";
// http
import {
  HttpClient,
  HttpContext,
  HttpHeaders,
  HttpParams,
} from "@angular/common/http";
import { IResponse } from "src/app/shared/classes/api-response";

interface HttpOption {
  headers?:
    | HttpHeaders
    | {
        [header: string]: string | string[];
      };
  context?: HttpContext;
  observe?: "body";
  params?:
    | HttpParams
    | {
        [param: string]:
          | string
          | number
          | boolean
          | ReadonlyArray<string | number | boolean>;
      };
  reportProgress?: boolean;
  responseType?: "json";
  withCredentials?: boolean;
  body?: null;
}

@Injectable({
  providedIn: "root",
})
export class ApiHttpService {
  private readonly uuid = localStorage.getItem("deviceId");
  constructor(private readonly http: HttpClient) {}
  public get<T>(url: string, options?: HttpOption) {
    return this.http.get<IResponse<T>>(url, {
      headers: new HttpHeaders()
        .set("Accept", "application/json")
        .set("uuid", this.uuid)
        .set("role", 'pharmacy'),
      ...options,
    });
  }
  public post<T>(url: string, data: any, options?: HttpOption) {
    return this.http.post<IResponse<T>>(url, data, {
      headers: new HttpHeaders()
        .set("Accept", "application/json")
        .set("uuid", this.uuid)
        .set("role", 'pharmacy'),
      ...options,
    });
  }
  public put<T>(url: string, data: any, options?: HttpOption) {
    return this.http.put<IResponse<T>>(url, data, {
      headers: new HttpHeaders()
        .set("Accept", "application/json")
        .set("uuid", this.uuid)
        .set("role", 'pharmacy'),
      ...options,
    });
  }
  public delete<T>(url: string, options?: HttpOption) {
    return this.http.delete<IResponse<T>>(url, {
      headers: new HttpHeaders()
        .set("Accept", "application/json")
        .set("uuid", this.uuid)
        .set("role", 'pharmacy'),
      ...options,
    });
  }
}
