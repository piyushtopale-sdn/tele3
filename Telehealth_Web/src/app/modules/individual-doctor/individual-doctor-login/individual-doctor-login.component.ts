import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "../indiviual-doctor.service";
import { InsuranceManagementService } from "../../super-admin/super-admin-insurance.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-individual-doctor-login",
  templateUrl: "./individual-doctor-login.component.html",
  styleUrls: ["./individual-doctor-login.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class IndividualDoctorLoginComponent implements OnInit {
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

  @ViewChild("addsecondsubsriber", { static: false }) addsecondsubsriber: any;
  password: any;
  passwordShow = false;
  routeTo: any;
  
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private authService: AuthService,
    private route: Router,
    private individualService: IndiviualDoctorService,
    private _coreService: CoreService,
    public translate: TranslateService,
    private insuranceManagementService: InsuranceManagementService,

  ) {
    let token = this.authService.isLoggedIn();
    let role = this.authService.getRole();
    if (token && role == "individual-doctor") {
      route.navigate(["/individual-doctor/dashboard"]);
    }

    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required]],
      keep_signin: [""],
    });    
  }

  ngOnInit(): void {
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
    this.isLoading = true;
    const formData = { ...this.loginForm.value, email: this.loginForm?.value?.email?.toLowerCase() };
    this.individualService.hospitalLogin(formData).subscribe(
      (res) => {
        try {
          let result = this._coreService.decryptObjectData({ data: res });

          if (result.status) {
           
              this.phoneNumber = result.body.user_details.portalUserData.mobile;
              this.countryCode =
                result.body.user_details.portalUserData.country_code;
              this.userEmail = result.body.user_details.portalUserData.email;
              this.userId = result.body.user_details.portalUserData._id;
            
              this.openVerticallyCenteredsecond(this.addsecondsubsriber);
              return;            
          } else {
            this.isLoading = false;
            this._coreService.showError(result.message, "");
          }
        } catch (error) {
          this.isLoading = false;
          this._coreService.showError(error.statusText, "");

        }
      },
      (err: Error) => {
        alert(err.message);
      }
    );
  }

  sendVerificationCode(medium: any) {
    if (medium === "mobile") {
      if (this.isDisabled1) return;
    this.isDisabled1 = true;   
    setTimeout(() => {
      this.isDisabled1 = false;
    }, 15000);

      let twoFaData = {
        email: this.userEmail,
      };
      // superadmin/send-sms-otp-for-2fa
      this.individualService.getVerificationCodeMobile(twoFaData).subscribe(
        (res: any) => {

          let result = this._coreService.decryptObjectData({ data: res });
          if (result.status) {
            this.closePopUp();
            this.route.navigate(["/individual-doctor/entercode"], {
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
            this.isLoading = false;
            this._coreService.showError(result.message, "");
            this.modalService.dismissAll("close");

          }
        },
        (err: any) => {
          this._coreService.showError(err.statusText, "");

        }
      );
    }

    if (medium == "email") {
      if (this.isDisabled2) return;
      this.isDisabled2 = true;
      setTimeout(() => {
        this.isDisabled2 = false;
      }, 15000);

      let twoFaData = {
        email: this.userEmail,
      };

      this.individualService.getVerificationCodeEmail(twoFaData).subscribe(
        (res: any) => {
          let result = this._coreService.decryptObjectData({ data: res });

          if (result.status) {
            this.modalService.dismissAll("close");
            this.closePopUp();
            this._coreService.showSuccess(" ", result.message);
            this.route.navigate(["/individual-doctor/entercode"], {
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
            this.isLoading = false;
            this._coreService.showError(result.message, "");
            this.modalService.dismissAll("close");

          }
        },
        (err: any) => {
          let errResponse = this._coreService.decryptObjectData({
            data: err.error,
          });
          this._coreService.showError("", errResponse.message);
        }
      );
    }

    this._coreService.setLocalStorage("login", "component");
    this._coreService.setLocalStorage(medium, "medium");
  }

  private closePopUp() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }

  get loginFormControl(): { [key: string]: AbstractControl } {
    return this.loginForm.controls;
  }

  openVerticallyCenteredsecond(insurancepopup: any) {
    this.modalService.open(insurancepopup, { centered: true, size: "",backdrop: 'static' });
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

        if(decryptedData.status){      
          if(decryptedData?.body.length > 0){
            const findMenu = decryptedData?.body.find(ele => ele.menu_id.name === 'Dashboard' );        
          
            if(findMenu){
              this.routeTo = findMenu?.menu_id?.route_path;
              this.route.navigate([this.routeTo]);
            }else{
              this.routeTo = decryptedData?.body[0]?.menu_id?.route_path;
              this.route.navigate([this.routeTo]);
            }
            
          }else{
            this.route.navigate([`/individual-doctor/editprofile`])
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
