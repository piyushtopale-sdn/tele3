import { Location } from "@angular/common";
import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import { CoreService } from "src/app/shared/core.service";
import { PatientService } from "../patient.service";
import { AuthService } from "src/app/shared/auth.service";
import { TranslateService } from "@ngx-translate/core";

export interface ILocationData {
  mode: "email" | "mobile";
  mobile: string;
  country_code: string;
  email: string;
  userId: string;
}
@Component({
  selector: "app-patient-entercode",
  templateUrl: "./patient-entercode.component.html",
  styleUrls: ["./patient-entercode.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PatientEntercodeComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  logo: string = "assets/img/logo.svg";
  medium: any;
  resEmail: any;
  resMobile: any;

  deviceId: any = "";
  isSubmitted: boolean = false;
  isDisabled: boolean = true;
  component: any;
  constructor(
    private _coreService: CoreService,
    private _patientService: PatientService,
    private route: Router,
    private location: Location,
    private auth: AuthService,
    private translate : TranslateService
  ) {}

  mode: string;
  countryCode: string ;
  email: string = "";
  mobileNo: string = "";
  otpContext: string;
  userId: string;
  loginCreds: any;

  ngOnInit(): void {
    const locationInfo = this.location.getState() as ILocationData;
    this.loginCreds = JSON.parse(sessionStorage.getItem("loginCreds"));

    this.mode = locationInfo.mode;
    this.countryCode = locationInfo.country_code;
    this.mobileNo = locationInfo.mobile;
    this.email = locationInfo.email;
    this.userId = locationInfo.userId;
    if (locationInfo.mode === "mobile") {
      this.otpContext = this.maskCharacter(
        locationInfo.country_code + locationInfo.mobile,
        "*",
        3
      );
    }

    if (locationInfo.mode === "email") {
      this.otpContext = this.maskCharacter(locationInfo.email, "*", 3);
    }

    if (locationInfo && locationInfo.mode == undefined) {
      this.route.navigateByUrl("/patient/login");
    }
  }

  maskCharacter(str: string, mask, n = 1) {
    return (
      ("" + str).slice(0, n) +
      ("" + str).slice(n, -n).replace(/./g, mask) +
      ("" + str).slice(-n)
    );
  }

  config = {
    allowNumbersOnly: true,
    length: 4,

    disableAutoFocus: false,
    placeholder: "0",
  };

  onOtpChange(event: any) {
    if (event.length ==4) {
      this.isDisabled = false;
    }
  }

  verifyOtp(val: any) {
    
    if (val.currentVal.length == 4) {
      let otpData = null;

      // if (this.mode == "email") {
      //   otpData = {
      //     email: this.email,
      //     otp: val.currentVal,
      //     userId:this.userId
      //   };
        
      //   this._patientService.verifyEmailOtp(otpData).subscribe(
      //     (res: any) => {
      //       let encryptedData = { data: res };
      //       let result = this._coreService.decryptObjectData(encryptedData);
  
      //       if (result.status) {
  
      //         this._coreService.showSuccess(result.message, "");
  
      //         if (result.errorCode) {

      //           sessionStorage.setItem(
      //             "loginData",
      //             JSON.stringify(result?.body?.portalUserData)
      //           );
      //           sessionStorage.setItem(
      //             "adminData",
      //             JSON.stringify(result?.body?.profileData)
      //           );
      //           this.route.navigate(["patient/createprofile"]);
      //           this._coreService.showInfo(result.errorCode, "");
      //         } else {

      //           this._patientService
      //             .login(this.loginCreds, this.deviceId)
      //             .subscribe({
      //               next: (res) => {
      //                 let encryptedData = { data: res };
      //                 let response =
      //                   this._coreService.decryptObjectData(encryptedData);
      //                 if (response.body.otp_verified === true) {
      //                   this._coreService.setLocalStorage(
      //                     response.body?.user_details?.profileData,
      //                     "profileData"
      //                   );
      //                   this._coreService.setLocalStorage(
      //                     response.body?.user_details?.portalUserData,
      //                     "loginData"
      //                   );
      //                   this.auth.setToken(response.body.token);
      //                   this.auth.setRole("patient");
      //                   this.auth.setRefreshToken(response.body.refreshToken);
      //                   this._coreService.showSuccess(response.message, "");
      //                   this.route.navigate(["/patient/dashboard"]);
      //                 }else{
                        
      //                   this._coreService.showError(result.message, "");
      //                 }
      //               },
      //             });
      //         }
      //       } else {

      //         this._coreService.showWarning(result.message, "");
      //       }
      //     },
      //     (err: any) => {
      //       console.log("error in verify otp", err);
      //     }
      //   );
      // }

      if (this.mode == "mobile") {
        otpData = {
          mobile: this.mobileNo,
          otp: val.currentVal,
        };
        this._patientService.verifyMobileOtp(otpData).subscribe(
          (res: any) => {
            let encryptedData = { data: res };
            let result = this._coreService.decryptObjectData(encryptedData);
  
            if (result.status) {
  
              this._coreService.showSuccess(result.message, "");
  
              if (result.errorCode) {
                sessionStorage.setItem(
                  "loginData",
                  JSON.stringify(result?.body?.portalUserData)
                );
                sessionStorage.setItem(
                  "adminData",
                  JSON.stringify(result?.body?.profileData)
                );
                this.route.navigate(["patient/createprofile"]);
                this._coreService.showInfo(result.errorCode, "");
              } else {
                this._patientService
                  .login(this.loginCreds, this.deviceId)
                  .subscribe({
                    next: (res) => {
                      let encryptedData = { data: res };
                      let response =
                        this._coreService.decryptObjectData(encryptedData);
                      if (response.body.otp_verified === true) {
                        this._coreService.setLocalStorage(
                          response.body?.user_details?.profileData,
                          "profileData"
                        );
                        this._coreService.setLocalStorage(
                          response.body?.user_details?.portalUserData,
                          "loginData"
                        );
                        this.auth.setToken(response.body.token);
                        this.auth.setRole("patient");
                        this.auth.setRefreshToken(response.body.refreshToken);
                        this._coreService.showSuccess(response.message, "");
                        this.route.navigate(["/patient/dashboard"]);
                      }else{
                        this._coreService.showError(result.message, "");
                      }
                    },
                  });
              }
            } else {
              this._coreService.showWarning(result.message, "");
            }
          },
          (err: any) => {
            console.log("error in verify otp", err);
          }
        );
      }

    
    }
  }

  resendOtpDetails() {
    if (this.mode === "mobile") {
      this.sendVerificationCode("mobile");
    }
    if (this.mode === "email") {
      this.sendVerificationCode("email");
    }
  }


  sendVerificationCode(medium: any) {
    if (medium === "mobile") {
      let twoFaData = {
        mobile: this.mobileNo,
        country_code: this.countryCode,
      };
      // /superadmin/send-sms-otp-for-2fa
      this._patientService.getVerificationCodeMobile(twoFaData).subscribe(
        (res: any) => {
          let encryptedData = { data: res };
          let result = this._coreService.decryptObjectData(encryptedData);
          if (result.status) { 
            this._coreService.showSuccess("",result.message);         
            this.route.navigate(["/patient/entercode"], {
              state: {
                mobile: this.mobileNo,
                country_code: this.countryCode,
                mode: medium,
                userId: this.userId,
              },
            });
          } else {
            this._coreService.showError(result.message, "");
          }
        },
        (err: any) => {
          this._coreService.showError("", err.statusText)
        }
      );
    }

    if (medium == "email") {
      let twoFaData = {
        email: this.email,
        userId:this.userId
      };
      this._patientService.getVerificationCodeEmail(twoFaData).subscribe(
        (res: any) => {
          let encryptedData = { data: res };
          let result = this._coreService.decryptObjectData(encryptedData);

          if (result.status) {
            this._coreService.showSuccess(" ", result.message);
            this.route.navigate(["/patient/entercode"], {
              state: {
                mobile: this.mobileNo,
                country_code: this.countryCode,
                mode: medium,
                email: this.email,
                userId: this.userId,
              },
            });
          } else {
            this._coreService.showError(result.message, "");
          }
        },
        (err: any) => {
          console.log(err);
          this._coreService.showError("Something went wrong!", err.statusText)
        }
      );
    }
    this._coreService.setLocalStorage("login", "component");
    this._coreService.setLocalStorage(medium, "medium");
  }
  goToHomePage(){
    if(this.translate.store.currentLang === undefined || this.translate.store.currentLang === 'ar'){
      this.route.navigate([`/test_p/home-ar`]);
    }else{
      this.route.navigate([`/test_p/home-en`]);
    }
  }
}
