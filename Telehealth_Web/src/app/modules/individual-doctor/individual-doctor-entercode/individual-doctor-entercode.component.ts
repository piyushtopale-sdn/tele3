import { Location } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "../indiviual-doctor.service";
import { InsuranceManagementService } from "../../super-admin/super-admin-insurance.service";
import { TranslateService } from '@ngx-translate/core';
export interface ILocationData {
  mode: "email" | "mobile";
  mobile: string;
  country_code: string;
  email: string;
  userId: string;
  component: string;
  companyName: string;
}

@Component({
  selector: "app-individual-doctor-entercode",
  templateUrl: "./individual-doctor-entercode.component.html",
  styleUrls: ["./individual-doctor-entercode.component.scss"],
})
export class IndividualDoctorEntercodeComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  logo: string = "assets/img/logo.svg";
  isResendDisabled: boolean = false; // Initially the resend button is enabled
  isDisabled: Boolean = true;
  routeTo: any;

  constructor(
    private _coreService: CoreService,
    private individualService: IndiviualDoctorService,
    private auth: AuthService,
    private route: Router,
    private location: Location,
    private insuranceManagementService: InsuranceManagementService,
    private translate: TranslateService

  ) { }

  medium: any;
  resEmail: any;
  resMobile: any;

  mode: string;
  countryCode: string = "";
  email: string = "";
  mobileNo: string = "";
  otpContext: string;
  userId: string;
  component: string;
  companyName: string;
  config = {
    allowNumbersOnly: true,
    length: 4,

    disableAutoFocus: false,
    placeholder: "0",
  };

  loginCreds: any;

  ngOnInit(): void {
    const locationInfo = this.location.getState() as ILocationData;
    this.loginCreds = JSON.parse(sessionStorage.getItem("loginCreds"));

    this.mode = locationInfo.mode;
    this.countryCode = locationInfo.country_code;
    this.mobileNo = locationInfo.mobile;
    this.email = locationInfo.email?.toLowerCase();
    this.userId = locationInfo.userId;
    this.component = locationInfo.component;

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
      this.route.navigateByUrl("/individual-doctor/login");
    }
  }

  resendOtpDetails() {    
    if (this.isResendDisabled) {
      return; // Prevent further actions if it's disabled
    }

    if (this.mode === "mobile") {
      this.sendOtpUser();
    }
    if (this.mode === "email") {
      this.sendEmailUser();
    }

    this.isResendDisabled = true;

    setTimeout(() => {
      this.isResendDisabled = false; // Re-enable after 30 seconds
    }, 30000); 
  }

  maskCharacter(str: string, mask, n = 1) {
    return (
      ("" + str).slice(0, n) +
      ("" + str).slice(n, -n).replace(/./g, mask) +
      ("" + str).slice(-n)
    );
  }

  private sendOtpUser() {
    let twoFaData = {
      email: this.email?.toLowerCase(),
    };

    this.individualService.getVerificationCodeMobile(twoFaData).subscribe(
      (res: any) => {

        let result = this._coreService.decryptObjectData({ data: res });
        if (result.status) {
          this._coreService.showSuccess(" ", result.message);
        } else {
          this._coreService.showError(" ", result.message);
        }
      },
      (err: any) => {
        this._coreService.showError("", err.message);
      }
    );
  }

  private sendEmailUser() {
    let twoFaData = {
      email: this.email?.toLowerCase(),
    };
    this.individualService.getVerificationCodeEmail(twoFaData).subscribe(
      (res: any) => {
        let result = this._coreService.decryptObjectData({ data: res });

        if (result.status) {
          this._coreService.showSuccess(" ", result.message);
        } else {

          this._coreService.showError(" ", result.message);
        }
      },
      (err: any) => {
        this._coreService.showError("", err.statusText);
      }
    );
  }

  verifyOtp(val: any) {
    if (val.currentVal.length == 4) {
      let otpData = null;

      if (this.mode == "email") {
        otpData = {
          email: this.email,
          for_portal_user: this.userId,
          otp: val.currentVal,
        };

        this.individualService.verifyEmailOtp(otpData).subscribe(
          (res: any) => {

            let encryptedData = { data: res };
            let result = this._coreService.decryptObjectData(encryptedData);
            if (result.status) {
              this._coreService.showSuccess(result.message, "Login Successfully!");
              this._coreService.setLocalStorage(
                result.body?.user_details.adminData,
                "adminData"
              );
              this._coreService.setLocalStorage(
                result.body?.user_details.portalUserData,
                "loginData"
              );
              this.auth.setToken(result.body.token);
              this.auth.setRole("individual-doctor");
              this.auth.setRefreshToken(result.body.refreshToken);
              if(result.body?.user_details.portalUserData?.role === "INDIVIDUAL_DOCTOR_ADMIN"){
                this.route.navigate([`individual-doctor/admin-dashboard`]);
              }else{
                this.getUserMenus(result?.body?.user_details?.portalUserData?._id);
                this.route.navigate([`individual-doctor/dashboard`]);
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

      if (this.mode == "mobile") {
        otpData = {
          mobile: this.mobileNo,
          for_portal_user: this.userId,
          otp: val.currentVal,
        };


        this.individualService.verifyOtp(otpData).subscribe(
          (res: any) => {

            let encryptedData = { data: res };
            let result = this._coreService.decryptObjectData(encryptedData);
            
            if (result.status) {
              this._coreService.showSuccess(result.message, "Login Successfully!");
              this._coreService.setLocalStorage(
                result.body?.user_details.adminData,
                "adminData"
              );
              this._coreService.setLocalStorage(
                result.body?.user_details.portalUserData,
                "loginData"
              );
              this.auth.setToken(result.body.token);
              this.auth.setRole("individual-doctor");
              this.auth.setRefreshToken(result.body.refreshToken);
              if(result.body?.user_details.portalUserData?.role === "INDIVIDUAL_DOCTOR_ADMIN"){
                this.route.navigate([`individual-doctor/admin-dashboard`]);
              }else{
                this.getUserMenus(result?.body?.user_details?.portalUserData?._id);
                this.route.navigate([`individual-doctor/dashboard`]);
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

  onOtpChnage(event: any) {
    if (event.length == 4) {
      this.isDisabled = false;
    }
  }


  getUserMenus(id) {
    const params = {
      module_name: "superadmin",
      user_id: id,
    };
    this.insuranceManagementService.getUserMenus(params).subscribe(
      (res: any) => {
        const decryptedData = this._coreService.decryptObjectData(res);

        if (decryptedData.status) {
          if (decryptedData?.body.length > 0) {
            const findMenu = decryptedData?.body.find(ele => ele.menu_id.name === 'Dashboard');

            if (findMenu) {
              this.routeTo = findMenu?.menu_id?.route_path;
              this.route.navigate([this.routeTo]);
            } else {
              this.routeTo = decryptedData?.body[0]?.menu_id?.route_path;
              this.route.navigate([this.routeTo]);
            }

          } else {
            this.route.navigate([`individual-doctor/editprofile`])
          }
        }

      },
      (err) => {
        console.log(err);
      }
    );
  }

  goToHomePage(){
    if(this.translate.store.currentLang === undefined || this.translate.store.currentLang === 'ar'){
      this.route.navigate([`/test/home-ar`]);
    }else{
      this.route.navigate([`/test/home-en`]);
    }
  }
}
