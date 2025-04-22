import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { CoreService } from './core.service';
import { AuthService } from './auth.service';
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private ngxService: NgxUiLoaderService, private coreService: AuthService) {
    // this.ngxService.start();
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(this.addAuthToken(request)).pipe(
        catchError((error)=>{
            // this.ngxService.stop();
            // if(error && error.status === 401){
            //     return throwError(() => new Error(error.message));
            // }else{
            //     return [];
            // }
            return throwError(() => new Error(error.message));
            return [];
            
        })
    );
  }


  addAuthToken(request: HttpRequest<any>) {
    const token = this.coreService.getToken();

    if (!token) {
      return request;
    }

    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

}