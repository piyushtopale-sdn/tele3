import { Component, OnInit, ViewChild } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,  
  FormGroup,
  Validators,
} from "@angular/forms";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { ActivatedRoute, Router } from "@angular/router";
import { FourPortalService } from "../four-portal.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { InsuranceManagementService } from "../../super-admin/super-admin-insurance.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'app-four-portal-login',
  templateUrl: './four-portal-login.component.html',
  styleUrls: ['./four-portal-login.component.scss']
})
export class FourPortalLoginComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  logo: string = "assets/img/logo.svg";
  isDisabled1: boolean = false;
  isDisabled2: boolean = false;
  isSubmitted: boolean = false;
  isLoading: boolean = false;
  loginForm: FormGroup;
  phoneNumber: string;
  countryCode: string;
  userEmail: string;
  userId: string;
  emailId: string;
  errorMessage: any;
  companyName: string = "";
  selectedType:any= 'INDIVIDUAL';
  @ViewChild("addsecondsubsriber", { static: false }) addsecondsubsriber: any;
  route_type: any;
  password: any;
  passwordShow = false;
  routeTo: any;

  constructor(
    private readonly modalService: NgbModal,
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly _coreService: CoreService,
    public translate: TranslateService,
    private readonly route: ActivatedRoute,
    private readonly fourPortalService: FourPortalService,
    private readonly loader: NgxUiLoaderService,
    private readonly insuranceManagementService: InsuranceManagementService,



  ) {


    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.route_type = params.get('path');
    });
    let token = this.authService.isLoggedIn();
    let role = this.authService.getRole();
    if (token && role == "portals") {

      if (this.route_type === 'Laboratory') {
        this.router.navigate([`/portals/lab-dashboard/${this.route_type}`]);
      } else {
        this.router.navigate([`/portals/radio-dashboard/${this.route_type}`]);
      }
    }
    sessionStorage.clear();
    this.password = 'password';
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

  onSubmit() {
    this.isSubmitted = true;
    if (this.loginForm.invalid) {
      return;
    }
    let reqData = {
      email: this.loginForm.value?.email?.toLowerCase(),
      password: this.loginForm.value.password,
      type: this.route_type,
      role: this.selectedType
    }
    this.loader.start();
    this.isLoading = true;
    this.fourPortalService.fourPortalLogin(reqData).subscribe(
      (res) => {
        try {
          let result = this._coreService.decryptObjectData({ data: res });
          if (result.status) {
            this.loader.stop();
            this.phoneNumber = result.body.user_details.portalUserData.phone_number;
            this.countryCode = result.body.user_details.portalUserData.country_code;
            this.userEmail = result.body.user_details.portalUserData.email;
            this.userId = result.body.user_details.portalUserData._id;
            this.openVerticallyCenteredsecond(this.addsecondsubsriber);
            return;
          } else {
            this.loader.stop();
            this.isLoading = false;
            this._coreService.showError(result.message, "");
          }
        } catch (error) {
          this.loader.stop();
          this.isLoading = false;
          this._coreService.showError(error.statusText, "");

        }
      },
      (err: Error) => {
        this.loader.stop();
        alert(err.message);
      }
    );
  }

  sendVerificationCode(medium: any) {
    if (medium === "mobile") {
      if (this.isDisabled1) return; // Prevent multiple clicks
      this.isDisabled1 = true; // Disable button 
  
      // Enable button after 5 seconds
      setTimeout(() => {
        this.isDisabled1 = false;
      }, 15000);
      let twoFaData = {
        phone_number: this.phoneNumber, type: this.route_type
      };
      // superadmin/send-sms-otp-for-2fa
      this.loader.start();
      this.fourPortalService.sendOtpSMS(twoFaData).subscribe(
        (res: any) => {

          let result = this._coreService.decryptObjectData({ data: res });
          if (result.status) {
            this.loader.stop();
            this._coreService.showSuccess(result.message, "");
            this.modalService.dismissAll("close");
            this.closePopUp();
            this.router.navigate([`/portals/entercode/${this.route_type}`], {
              state: {
                mobile: this.phoneNumber,
                country_code: this.countryCode,
                mode: medium,
                email: this.userEmail,
                userId: this.userId,
                component: "login",
                companyName: this.companyName,
              },
            });
          } else {
            this.loader.stop();
            this.modalService.dismissAll("close");
            this._coreService.showError(result.message, "");
          }
        },
        (err: any) => {
          this.loader.stop();
          this.modalService.dismissAll("close");
          this._coreService.showError(err.statusText, "");

        }
      );
    }

    if (medium == "email") {
      if (this.isDisabled2) return; // Prevent multiple clicks

      this.isDisabled2 = true; // Disable button
  
  
      // Enable button after 5 seconds
      setTimeout(() => {
        this.isDisabled2 = false;
      }, 15000);
      let twoFaData = {
        email: this.userEmail,
        type: this.route_type
      };
      this.loader.start();
      this.fourPortalService.sendOtpEmail(twoFaData).subscribe(
        (res: any) => {
          let result = this._coreService.decryptObjectData({ data: res });

          if (result.status) {
            this.loader.stop();
            this.modalService.dismissAll("close");
            this.closePopUp();
            this._coreService.showSuccess(" ", result.message);
            this.router.navigate([`/portals/entercode/${this.route_type}`], {
              state: {
                mobile: this.phoneNumber,
                country_code: this.countryCode,
                mode: medium,
                email: this.userEmail,
                userId: this.userId,
                component: "login",
                companyName: this.companyName,
              },
            });
          } else {
            this.loader.stop();
            this.modalService.dismissAll("close");
            this._coreService.showError(result.message, "");
          }
        },
        (err: any) => {
          let errResponse = this._coreService.decryptObjectData({
            data: err.error,
          });
          this.loader.stop();
          this.modalService.dismissAll("close");
          this._coreService.showError("", errResponse.message);
          console.log(err);
        }
      );
    }

  }
  
  private closePopUp() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }

  get loginFormControl(): { [key: string]: AbstractControl } {
    return this.loginForm.controls;
  }

  openVerticallyCenteredsecond(insurancepopup: any) {
    this.modalService.open(insurancepopup, { centered: true, size: "", backdrop: 'static' });
  }


  routeToSingup() {
    this.router.navigate([`/portals/signup/${this.route_type}`])

  }

  routeToForgotpass() {
    this.router.navigate([`/portals/reset/${this.route_type}`])
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
              this.router.navigate([this.routeTo]);
            } else {
              this.routeTo = decryptedData?.body[0]?.menu_id?.route_path;
              this.router.navigate([this.routeTo]);
            }

          } else {
            this.router.navigate([`/portals/viewProfile/${this.route_type}`])
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
      this.router.navigate([`/test_p/home-ar`]);
    }else{
      this.router.navigate([`/test_p/home-en`]);
    }
  }


  onRoleChange(data:string){    
    this.selectedType = data;  
  }
}

