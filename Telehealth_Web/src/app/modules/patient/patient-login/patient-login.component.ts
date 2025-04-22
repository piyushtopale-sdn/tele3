import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { PatientService } from "../patient.service";
import { Location } from '@angular/common';
import intlTelInput from "intl-tel-input";
import { TranslateService } from "@ngx-translate/core";
@Component({
  selector: "app-patient-login",
  templateUrl: "./patient-login.component.html",
  styleUrls: ["./patient-login.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PatientLoginComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  logo: string = "assets/img/logo.svg";
  loginForm: FormGroup;
  isSubmitted: boolean = false;
  isLoading: boolean = false;
  deviceId: any;
  phoneNumber: string;
  countryCode: string;
  userEmail: string;
  userId: string;
  password: any;
  passwordShow = false;
  iti: any;
  selectedCountryCode: any = "+966";
  @ViewChild("addsecondsubsriber", { static: false }) addsecondsubsriber: any;
  @ViewChild("phone") phone: ElementRef<HTMLInputElement>;
  constructor(
    private modalService: NgbModal,
    private auth: AuthService,
    private route: Router,
    private fb: FormBuilder,
    private _patientService: PatientService,
    private _coreService: CoreService,
    private location: Location,
    private translate: TranslateService
  ) {
    let token = this.auth.isLoggedIn();
    let role = this.auth.getRole();
    if (token && role == "patient") {
      route.navigate(["/patient/dashboard"]);
    }

    this.loginForm = this.fb.group({
      mobile: ["", [Validators.required]],
      // password: ["", [Validators.required]],
      country_code:[""]
    });
  }

  ngOnInit(): void {
    sessionStorage.clear();
    this.password = 'password';
  }

  ngOnDestroy(): void {
    localStorage.setItem("status","false")
  }

  passwordClick() {
    if (this.password === 'password') {
      this.password = 'text';
      this.passwordShow = true;
    } else {
      this.password = 'password';
      this.passwordShow = false;
    }
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  onSubmit() {
    this.isSubmitted = true;

    if (this.loginForm.invalid) {
      return;
    }
    this.isLoading = true;
    let reqData = {
      mobile: this.loginForm.value.mobile,
      country_code: this.selectedCountryCode
    }

    this._patientService.login(reqData, this.deviceId).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let result = this._coreService.decryptObjectData(encryptedData);

        // return;
        if (result.status) {
          
          if (result?.body?.otp_verified === false) {
            this.phoneNumber = result.body.user_details.portalUserData.mobile;
            this.countryCode =
              result.body.user_details.portalUserData.country_code;
            this.userEmail = result.body.user_details.portalUserData.email;
            this.userId = result.body.user_details.portalUserData._id;
            this.openVerticallyCenteredsecond(this.addsecondsubsriber);
          }
          if (result?.body?.otp_verified === true) {

            if (result.errorCode) {
              sessionStorage.setItem(
                "loginData",
                JSON.stringify(result?.body?.portalUserData)
              );
              sessionStorage.setItem(
                "adminData",
                JSON.stringify(result?.body?.profileData)
              );
              sessionStorage.setItem(
                "loginCreds",
                JSON.stringify(this.loginForm.value)
              );
              this.route.navigate(["patient/createprofile"]);
              this._coreService.showInfo(result.errorCode, "");
            } else {
              this._coreService.setLocalStorage(
                result.body?.user_details?.profileData,
                "profileData"
              );
              this._coreService.setLocalStorage(
                result.body?.user_details?.portalUserData,
                "loginData"
              );
              this.auth.setToken(result.body.token);
              this.auth.setRole("patient");
              this._coreService.setLocalStorage(
                "Dashboard",
                "menuTitle"
              );
              this.auth.setRefreshToken(result.body.refreshToken);
              // this.route.navigate(["/patient/dashboard"]);
              if(localStorage.getItem('status')=='true')
              {
                this.location.back()
              }
              else{
                this.route.navigate(["/patient/dashboard"]);
              }
            }
          }
        } else {
          this.isLoading = false;
          this._coreService.showError(result.message, "");
        }
      },
      error: () => {},
    });
  }

  get loginFormControl(): { [key: string]: AbstractControl } {
    return this.loginForm.controls;
  }

  //otpverification
  getVerificationCode() {
    return {
      code: "12345",
    };
  }
  openVerticallyCenteredsecond(patientpopup: any) {
    this.modalService.open(patientpopup, { centered: true, size: "",backdrop:'static' });
  }

  sendVerificationCode(medium: any) {
    if (medium === "mobile") {
      let twoFaData = {
        mobile: this.phoneNumber,
        country_code: this.countryCode,
      };
      // /superadmin/send-sms-otp-for-2fa
      this._patientService.getVerificationCodeMobile(twoFaData).subscribe(
        (res: any) => {
          let encryptedData = { data: res };
          let result = this._coreService.decryptObjectData(encryptedData);
          if (result.status) {
            this.closePopUp();
            sessionStorage.setItem(
              "loginCreds",
              JSON.stringify(this.loginForm.value)
            );
            this.route.navigate(["/patient/entercode"], {
              state: {
                mobile: this.phoneNumber,
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

/*     if (medium == "email") {
      let twoFaData = {
        email: this.userEmail,
        userId:this.userId
      };
      this._patientService.getVerificationCodeEmail(twoFaData).subscribe(
        (res: any) => {
          let encryptedData = { data: res };
          let result = this._coreService.decryptObjectData(encryptedData);

          if (result.status) {
            this.closePopUp();
            this._coreService.showSuccess(" ", result.message);
            sessionStorage.setItem(
              "loginCreds",
              JSON.stringify(this.loginForm.value)
            );
            this.route.navigate(["/patient/entercode"], {
              state: {
                mobile: this.phoneNumber,
                country_code: this.countryCode,
                mode: medium,
                email: this.userEmail,
                userId: this.userId,
              },
            });
          } else {
            this._coreService.showError(result.message, "");
          }
        },
        (err: any) => {
          this._coreService.showError("Some thing went wrong", err.statusText)
        }
      );
    } */
    this._coreService.setLocalStorage("login", "component");
    this._coreService.setLocalStorage(medium, "medium");
  }

  private closePopUp() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }

  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  };

  ngAfterViewInit() {
    const input = this.phone.nativeElement;
    this.iti = intlTelInput(input, {
      initialCountry: "SA",
      separateDialCode: true,
    });
    this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
  }

  goToHomePage(){
    if(this.translate.store.currentLang === undefined || this.translate.store.currentLang === 'ar'){
      this.route.navigate([`/test/home-ar`]);
    }else{
      this.route.navigate([`/test/home-en`]);
    }
  }

}

//   sendVerificationCode(medium:any){
//     let code = this.getVerificationCode();
//     let modalDespose = this.getDismissReason(1);
//     this.modalService.dismissAll(modalDespose);
//     this.route.navigate(['patient/entercode']);
//   }
// }
