import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Location } from "@angular/common";
import {
  ILocationData,
  ISendEmailRequest,
  ISendOtpRequest,
  ISendOtpResponse,
  IVerifyOtpRequest,
} from "./pharmacy-entercode.type";
import { Router } from "@angular/router";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { PharmacyService } from "../pharmacy.service";
import { IResponse } from "src/app/shared/classes/api-response";
import { CoreService } from "src/app/shared/core.service";
import { PharmacyPlanService } from "../pharmacy-plan.service";
import { AuthService } from "src/app/shared/auth.service";
import { environment } from "../../../../environments/environment";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-pharmacy-entercode",
  templateUrl: "./pharmacy-entercode.component.html",
  styleUrls: ["./pharmacy-entercode.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PharmacyEntercodeComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  logo: string = "assets/img/logo.svg";

  private locationData: ILocationData = {
    email: "",
    userId: "",
    mode: "mobile",
    phoneNumber: "",
    countryCode: "",
  };
  otpContext: string = "";
  isDisabled: boolean = true;
  loginCreds: any;
  routeTo: any;
  isResendDisabled: boolean = false; // Initially the resend button is enabled

  constructor(
    private location: Location,
    private router: Router,
    private pharmacyService: PharmacyService,
    private coreService: CoreService,
    private _pharService: PharmacyPlanService,
    private auth: AuthService,
    private route: Router,
    private translate: TranslateService,
  ) {
  
  }

  ngOnInit(): void {
    this.loginCreds = JSON.parse(sessionStorage.getItem("loginCreds"));
    const locationInfo = this.location.getState() as ILocationData;

    if (locationInfo.mode == "mobile") {
      this.locationData.mode = locationInfo.mode;
      this.locationData.countryCode = locationInfo.countryCode;
      this.locationData.phoneNumber = locationInfo.phoneNumber;
      this.locationData.userId = locationInfo.userId;
      this.locationData.email = locationInfo.email?.toLowerCase();
      this.otpContext = this.maskCharacter(
        locationInfo.countryCode + locationInfo.phoneNumber,
        "*",
        3
      );
      this.sendOtpUser();
    }
    if (locationInfo.mode == "email") {
      this.locationData.mode = locationInfo.mode;
      this.locationData.email = locationInfo.email?.toLowerCase();
      this.locationData.userId = locationInfo.userId;
      this.otpContext = this.maskCharacter(locationInfo.email, "*", 3);
      this.sendEmailUser();
    }
    if (locationInfo && locationInfo.userId === undefined) {
      this.router.navigateByUrl("/pharmacy/login");
    }
  }

  maskCharacter(str: string, mask, n = 1) {
    return (
      ("" + str).slice(0, n) +
      ("" + str).slice(n, -n).replace(/./g, mask) +
      ("" + str).slice(-n)
    );
  }

  resendOtpDetails() {
    if (this.isResendDisabled) {
      return; // Prevent further actions if it's disabled
    }
    if (this.locationData.mode === "mobile") {
      this.sendOtpUser();
    }
    if (this.locationData.mode === "email") {
      this.sendEmailUser();
    }

    this.isResendDisabled = true;

    setTimeout(() => {
      this.isResendDisabled = false; // Re-enable after 30 seconds
    }, 30000);
  }

  config = {
    allowNumbersOnly: true,
    length: 4,

    disableAutoFocus: false,
    placeholder: "0",
  };

  onOtpChange(event: any) {
    if (event.length == 4) {
      this.isDisabled = false;
    }
  }

  private sendOtpUser() {
    const otpRequest: ISendOtpRequest = {
      email: this.locationData.email?.toLowerCase(),
    };

    this._pharService.getVerificationCodeMobile(otpRequest).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let result = this.coreService.decryptObjectData(encryptedData);
        if (result.status === true) {
          this.coreService.showSuccess("", result.message)
        } else {
          this.coreService.showError("", result.message)

        }
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
    });
  }

  private sendEmailUser() {
    const emailRequest: ISendEmailRequest = {
      email: this.locationData.email?.toLowerCase(),
    };
    this._pharService.getVerificationCodeEmail(emailRequest).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let result = this.coreService.decryptObjectData(encryptedData);
        if (result.status === true) {
          this.coreService.showSuccess("", result.message)          
        } else {
          this.coreService.showError("", result.message)

        }
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
       
      },
    });
  }

  verifyOtp(val: any) {
    if (val.currentVal.length == 4) {
      let otpData = null;
      if (this.locationData.mode === "mobile") {
        otpData = {
          mobile: this.locationData.phoneNumber,
          for_portal_user: this.locationData.userId,
          otp: val.currentVal,
        };

        this.pharmacyService.verifyOtp(otpData).subscribe({
          next: (res) => {
            let encryptedData = { data: res };
            let response = this.coreService.decryptObjectData(encryptedData);

            if (response.status) {
              this.coreService.showSuccess(response.message, "Login Successfully!");
              this.coreService.setLocalStorage(
                response.body?.user_details.adminData,
                "adminData"
              );
              this.coreService.setLocalStorage(
                response.body?.user_details.portalUserData,
                "loginData"
              );
              this.auth.setToken(response.body.token);
              this.auth.setRole(environment.PHARMACY);
              this.auth.setRefreshToken(response.body.refreshToken);
              this.getUserMenus(response?.body?.user_details?.portalUserData?._id)
              this.router.navigateByUrl("/pharmacy/dashboard");

            } else {
              this.coreService.showError(response.message, "");
            }
          },
          error: (err: ErrorEvent) => {
            console.log("err___________",err);
            // this.coreService.showError("", err.message);
          },
        });
      }
      if (this.locationData.mode === "email") {
        otpData = {
          email: this.locationData.email,
          for_portal_user: this.locationData.userId,
          otp: val.currentVal,
        };

        this.pharmacyService.matchEmailOtpFor2fa(otpData).subscribe({
          next: (res) => {
            let encryptedData = { data: res };
            let response = this.coreService.decryptObjectData(encryptedData);
            if (response.status) {
              this.coreService.showSuccess(response.message, "Login Successfully!");
              this.coreService.setLocalStorage(
                response.body?.user_details.adminData,
                "adminData"
              );
              this.coreService.setLocalStorage(
                response.body?.user_details.portalUserData,
                "loginData"
              );
              this.auth.setToken(response.body.token);
              this.auth.setRole(environment.PHARMACY);
              this.auth.setRefreshToken(response.body.refreshToken);
              this.getUserMenus(response?.body?.user_details?.portalUserData?._id)
              this.router.navigateByUrl("/pharmacy/dashboard");

            } else {
              this.coreService.showError(response.message, "");
            }
          },
          error: (err: ErrorEvent) => {
            // this.coreService.showError("", err.message);
          },
        });
      }

    }
  }


  getUserMenus(id) {
    const params = {
      module_name: "superadmin",
      user_id: id,
    };
    this.pharmacyService.getUserMenus(params).subscribe(
      (res: any) => {
        const decryptedData = this.coreService.decryptObjectData(res);

        if (decryptedData.status) {
          if (decryptedData?.body.length > 0) {
            const findMenu = decryptedData?.body.find(ele => ele.menu_id.name === 'Dashboard');

            if (findMenu) {
              this.routeTo = findMenu?.menu_id?.route_path;
              this.router.navigate([this.routeTo]);
            } else {
              this.routeTo = decryptedData?.body[0]?.menu_id?.route_path;
              this.router.navigate([this.routeTo]);
            }

          } else {
            this.router.navigate([`pharmacy/profile`])
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
      this.router.navigate([`/test/home-ar`]);
    }else{
      this.router.navigate([`/test/home-en`]);
    }
  }
}
