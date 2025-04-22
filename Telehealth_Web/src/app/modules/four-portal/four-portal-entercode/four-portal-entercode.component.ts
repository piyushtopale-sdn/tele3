import { Location } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { FourPortalService } from "../four-portal.service";
import { InsuranceManagementService } from "../../super-admin/super-admin-insurance.service";
import { TranslateService } from "@ngx-translate/core";

export interface ILocationData {
  mode: "email" | "mobile";
  mobile: string;
  country_code: string;
  email: string;
  userId: string;
  component: string;
  companyName: string;
  type: string
}

@Component({
  selector: 'app-four-portal-entercode',
  templateUrl: './four-portal-entercode.component.html',
  styleUrls: ['./four-portal-entercode.component.scss']
})
export class FourPortalEntercodeComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  logo: string = "assets/img/logo.svg";
  isResendDisabled: boolean = false; // Initially the resend button is enabled

  isDisabled: Boolean = true;
  route_type: any;
  routeTo: any;
  constructor(
    private _coreService: CoreService,
    private auth: AuthService,
    private route: Router,
    private location: Location,
    private activateRoute: ActivatedRoute,
    private fourPortalService: FourPortalService,
    private loader: NgxUiLoaderService,
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
  type: string
  config = {
    allowNumbersOnly: true,
    length: 4,

    disableAutoFocus: false,
    placeholder: "0",
  };

  loginCreds: any;

  ngOnInit(): void {
    this.activateRoute.paramMap.subscribe(params => {
      this.route_type = params.get('path');
    });

    const locationInfo = this.location.getState() as ILocationData;
    this.loginCreds = JSON.parse(sessionStorage.getItem("loginCreds"));

    this.mode = locationInfo.mode;
    this.countryCode = locationInfo.country_code;
    this.mobileNo = locationInfo.mobile;
    this.email = locationInfo.email;
    this.userId = locationInfo.userId;
    this.component = locationInfo.component;
    this.type = locationInfo.component;

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
      this.route.navigateByUrl(`/portals/login/${this.route_type}`);
    }
  }

  resendOtpDetails() {
    if (this.isResendDisabled) {
      return; // Prevent further actions if it's disabled
    }
    if (this.mode === "mobile") {
      this.sendOtpSMSUser();
    }
    if (this.mode === "email") {
      this.sendOtpEmailUser();
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

  private sendOtpSMSUser() {
    let twoFaData = {
      phone_number: this.mobileNo,
      type: this.route_type
    };
    this.loader.start();
    this.fourPortalService.sendOtpSMS(twoFaData).subscribe(
      (res: any) => {

        let result = this._coreService.decryptObjectData({ data: res });
        if (result.status == true) {
          this.loader.stop();
          this._coreService.showSuccess(" ", result.message);
        } else {
          this.loader.stop();
          this._coreService.showError(" ", result.message);
        }
      },
      (err: any) => {
        this.loader.stop();
        this._coreService.showError("", err.message);
      }
    );
  }

  private sendOtpEmailUser() {
    let twoFaData = {
      email: this.email?.toLowerCase(),
      type: this.route_type
    };
    this.loader.start();
    this.fourPortalService.sendOtpEmail(twoFaData).subscribe(
      (res: any) => {
        let result = this._coreService.decryptObjectData({ data: res });

        if (result.status == true) {
          this.loader.stop();
          this._coreService.showSuccess(" ", result.message);
        } else {
          this.loader.stop();
          this._coreService.showError(" ", result.message);
        }
      },
      (err: any) => {
        this.loader.stop();
        this._coreService.showError("", err.statusText);
        console.log(err);
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
          type: this.route_type
        };

        this.loader.start();
        this.fourPortalService.verifyEmailOtp(otpData).subscribe(
          (res: any) => {

            let encryptedData = { data: res };
            let result = this._coreService.decryptObjectData(encryptedData);
            if (result.status == true) {
              this.loader.stop();
              this._coreService.setLocalStorage(
                result.body?.user_details.adminData,
                "adminData"
              );
              this._coreService.setLocalStorage(
                result.body?.user_details.portalUserData,
                "loginData"
              );
              this.auth.setToken(result.body.token);
              this.auth.setRole('portals');
              this.auth.setType(this.route_type);
              this.auth.setRefreshToken(result.body.refreshToken);
              if(result.body?.user_details?.portalUserData?.role === "ADMIN"){
                this.route.navigate([`/portals//admin-dashboard/${this.route_type}`]);                  
              }else{
                this.getUserMenus(result.body?.user_details?.portalUserData?._id);
              }
              this._coreService.showSuccess(result.message, "Login Successfully!");

            } else {
              this.loader.stop();
              this._coreService.showWarning(result.message, "");
            }
          },
          (err: any) => {
            this.loader.stop();
          }
        );
      }

      if (this.mode == "mobile") {
        otpData = {
          phone_number: this.mobileNo,
          for_portal_user: this.userId,
          otp: val.currentVal,
          type: this.route_type
        };

        this.loader.start();
        this.fourPortalService.verifyOtpSMS(otpData).subscribe(
          (res: any) => {

            let encryptedData = { data: res };
            let result = this._coreService.decryptObjectData(encryptedData);

            if (result.status) {
              this.loader.stop();
              if (result.status == true) {
                this.loader.stop();
                this._coreService.setLocalStorage(
                  result.body?.user_details.adminData,
                  "adminData"
                );
                this._coreService.setLocalStorage(
                  result.body?.user_details.portalUserData,
                  "loginData"
                );
                this.auth.setToken(result.body.token);
                this.auth.setRole('portals');
                this.auth.setType(this.route_type);
                this.auth.setRefreshToken(result.body.refreshToken);
                if(result.body?.user_details?.portalUserData?.role === "ADMIN"){
                  this.route.navigate([`/portals//admin-dashboard/${this.route_type}`]);                  
                }else{
                  this.getUserMenus(result.body?.user_details?.portalUserData?._id);
                }
                this._coreService.showSuccess(result.message, "Login Successfully!");
              }
            } else {
              this.loader.stop();
              this._coreService.showWarning(result.message, "");
            }
          },
          (err: any) => {
            this.loader.stop();
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

  routeToLogin() {
    this.route.navigate([`/portals/login/${this.route_type}`])
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
            this.route.navigate([`/portals/viewProfile/${this.route_type}`])
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

