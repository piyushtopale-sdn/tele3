import { HttpErrorResponse, HttpEvent, HttpEventType, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { catchError, Observable, tap, throwError, map } from "rxjs";
import { AuthService } from "./auth.service";
import { CoreService } from "./core.service";
import { IndiviualDoctorService } from "../modules/individual-doctor/indiviual-doctor.service";
import { FourPortalService } from "../modules/four-portal/four-portal.service";
import { SuperAdminService } from "../modules/super-admin/super-admin.service";
import { PharmacyService } from "../modules/pharmacy/pharmacy.service";
// import { EncryptionDecryption } from "./encryptionFile"

@Injectable()

export class loaderInterceptor implements HttpInterceptor {
    role: string;
    isSessionExpiredWarningShown = false;
    constructor(private ngxService: NgxUiLoaderService,
        private authService: AuthService,
        private coreService: CoreService,
        private pharmacyservice: PharmacyService,
        private superadminservice: SuperAdminService,
        private labradioService: FourPortalService,
        private doctorService: IndiviualDoctorService,
    ) {
        this.role = localStorage.getItem("role");


    }

    // intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    //     if (request && request.body) {
    //         let encryptedBody: any;
    //         let encryptedRequest;
    //         if (request.body instanceof FormData) {
    //             const formData = new FormData();
    //             let valuetest = {};
    //             request.body.forEach((value, key) => {
    //                 if (key === "filePath") {
    //                     formData.append(key, value);
    //                 } else {
    //                     valuetest[key] = value;
    //                 }
    //             });
    //             formData.append("data", this.coreService.encryptObjectData(valuetest));
    //             encryptedBody = formData;
    //             encryptedRequest = request.clone({ body: encryptedBody });
    //         } else {
    //             encryptedBody = this.coreService.encryptObjectData(request.body);

    //             encryptedRequest = request.clone({ body: { data: encryptedBody } });
    //         }

    //         /*  return next.handle(encryptedRequest).pipe(
    //            catchError((error) => throwError(error)),
    //            map((event: HttpEvent<any>) => {
    //              return event;
    //            })
    //          ); */

    //         return next.handle(encryptedRequest).pipe(
    //             catchError((error) => throwError(error)),
    //             map((event: HttpEvent<any>) => {
    //                 return event;
    //             })
    //         );
    //     }
    //     return next.handle(request).pipe(
    //         catchError((err) => {
    //             if (err.status === 401 && err.statusText === "Unauthorized") {
    //                 this.authService.logout();
    //                 this.coreService.showWarning('Session Expired', '');
    //             }

    //             return throwError(err);
    //         })
    //     )
    // }

    // intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    //     return next.handle(req).pipe(
    //         catchError((err) => {
                
    //             if (err.status === 401 && (err.statusText === "OK" || err.statusText === "Unauthorized") ) {
    //                 this.logOutUser();
    //                 this.coreService.showWarning('Session Expired', '');
    //             }

    //             return throwError(err);
    //         })
    //     )
    // }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError((err: HttpErrorResponse) => {
                if (err.status === 401 && (err.statusText === "OK" || err.statusText === "Unauthorized")) {
                    
                    if (!this.isSessionExpiredWarningShown) {
                        this.isSessionExpiredWarningShown = true;
                        const message = "Your session has expired or your account has been logged in from another device. Please log in again to continue.";
                    
                        this.coreService.showInfo("", message)

                        this.logOutUserOnExpiry();

                        // Reset flag after a short delay to allow re-showing after re-login
                        setTimeout(() => {
                            this.isSessionExpiredWarningShown = false;
                        }, 5000);
                    }
                }
                return throwError(() => err);
            })
        );
    }

    logOutUser() {
        if (this.role === 'super-admin') {
            this.superadminservice.logoutApi().subscribe((res) => {
                let encryptedData = { data: res };
                let response = this.coreService.decryptObjectData(encryptedData);
                if (response.status) {
                    this.coreService.showSuccess("", response.message)
                    this.authService.logout('/super-admin/login');
                }
            })

        } else if (this.role === 'individual-doctor') {
            this.doctorService.userLogoutAPI().subscribe((res) => {
                let encryptedData = { data: res };
                let response = this.coreService.decryptObjectData(encryptedData);
                if (response.status) {
                    this.coreService.showSuccess("", response.message)
                    this.authService.logout("/individual-doctor/login");
                }
            })
        } else if (this.role === 'pharmacy') {
            this.pharmacyservice.logOutUserApi().subscribe((res) => {
                let encryptedData = { data: res };
                let response = this.coreService.decryptObjectData(encryptedData);
                if (response.status) {
                    this.coreService.showSuccess("", response.message)
                    this.authService.logout("/pharmacy/login");
                }
            })
        } else if (this.role === 'portals') {
            this.labradioService.logOutUserApi().subscribe((res) => {
                let encryptedData = { data: res };
                let response = this.coreService.decryptObjectData(encryptedData);
                if (response.status) {
                    this.coreService.showSuccess("", response.message)
                    this.authService.logout();
                }
            })
        }
    }

    logOutUserOnExpiry() {
        this.authService.logout("/individual-doctor/login");
    }

}