import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  AbstractControl,
  Validators,
} from "@angular/forms";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import Validation from "../../../utility/validation";
import { Router } from "@angular/router";
import intlTelInput from "intl-tel-input";
import { PatientService } from "../patient.service";
import { CoreService } from "src/app/shared/core.service";
import { formatDate } from "@angular/common";
import { TranslateService } from "@ngx-translate/core";
@Component({
  selector: "app-patient-signup",
  templateUrl: "./patient-signup.component.html",
  styleUrls: ["./patient-signup.component.scss"],
})
export class PatientSignupComponent implements OnInit, AfterViewInit {
  login_logo: string = "assets/img/logo.svg";
  logo: string = "assets/img/logo.svg";
  signUpForm: FormGroup;
  isSubmitted: boolean = false;
  iti: any;
  selectedCountryCode: any = "+966";
  apiResponse: any;
  errorMessage: any;
  admindetails: any;
  childData: any;
  userId: string; 
  bloodGroup: any[] = [];
  country: any[] = [];
  gender: any[] = [];
  maritalStatus: any[] = [];
  // relationship:any[] = [];
  maxDOB: any;
  hide = true;
  hide1 = true;

  @ViewChild("patientpopup", { static: false }) patientpopup: any;
  @ViewChild("phone") phone: ElementRef<HTMLInputElement>;
  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private translate: TranslateService,
    private _patientService: PatientService,
    private _coreService: CoreService,
    private route: Router
  ) {

    this._patientService.getAllCommonData().subscribe((res) => {
      let encryptedData = { data: res };
      let result = this._coreService.decryptObjectData(encryptedData);
      this.bloodGroup = result?.body?.bloodGroup;
      this.country = result?.body?.country;
      this.gender = result?.body?.gender;
      this.maritalStatus = result?.body?.martialStatus;
      // this.relationship = result.body.relationship;
    });

    this.signUpForm = this.fb.group({
      first_name: ["", [Validators.required]],
      last_name: ["", [Validators.required]],
      mobile: ["", [Validators.required, Validators.pattern(/^\+?\d+$/)]],
      termscondition: ["", Validators.required],
      // email: ["", [Validators.required, Validators.email,Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      // middle_name: [""],
      // mobile: ['', [Validators.required, Validators.pattern("^((\\+91-?)|0)?[0-9]{10}$")]],
      // dateofbirth: ["", [Validators.required]],
      // gender: ["", [Validators.required]],
      // marital_status: [""],
      // blood_group: [""],
      

/*       password: [
        null,
        Validators.compose([
          Validators.required,
          // check whether the entered password has a number
          Validation.patternValidator(/\d/, {
            hasNumber: true,
          }),
          // check whether the entered password has upper case letter
          Validation.patternValidator(/[A-Z]/, {
            hasCapitalCase: true,
          }),
          // check whether the entered password has a lower case letter
          Validation.patternValidator(/[a-z]/, {
            hasSmallCase: true,
          }),
          // check whether the entered password has a special character
          Validation.patternValidator(
            /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
            {
              hasSpecialCharacters: true,
            }
          ),
          Validators.minLength(8),
        ]),
      ],
      confirmPassword: ["", Validators.required], */
      
    })
      // , { validators: [Validation.match("password", "confirmPassword")] };
  }

  openVerticallyCenteredsecond(patientpopup: any) {
    this.modalService.open(patientpopup, {
      centered: true,
      size: "",
      backdrop: "static",
      keyboard: false,
    });
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

  ngOnInit(): void {   
    // var d = new Date();
    // d.setMonth(d.getMonth() - 3);

    // this.maxDOB = d
    // if (this.signUpForm.invalid) {
    //   return;
    // }
  }  

  /*
  code for country code starts
  */
  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  };

  ngAfterViewInit() {
    const input = this.phone.nativeElement;

    // const input = document.querySelector("#phone");
    this.iti = intlTelInput(input, {
      initialCountry: "SA",
      separateDialCode: true,
    });
    this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
  }

  /*
    code for country code ends
    */

  onSubmit() {
    this.isSubmitted = true;
    // var date =
    if (this.signUpForm.invalid) {
      const invalid = [];
      const controls = this.signUpForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          invalid.push(name);
        }

      }
      this._coreService.showError("", "Please fill all details.")
      return;
    }
    let signUpData = {
      first_name: (this.signUpForm?.value?.first_name).trim(),
      last_name: (this.signUpForm?.value?.last_name).trim(),
      mobile: this.signUpForm.value.mobile,
      country_code: this.selectedCountryCode,
      // email: this.signUpForm.value.email,
      // middle_name: this.signUpForm.value.middle_name,
      // dob: this.signUpForm.value.dateofbirth,
      // password: this.signUpForm.value.password,
      // blood_group: this.signUpForm.value.blood_group
      //   ? this.signUpForm.value.blood_group
      //   : "",
      // gender: this.signUpForm.value.gender,
      // marital_status: this.signUpForm.value.marital_status
      //   ? this.signUpForm.value.marital_status
      //   : "",
    };
    
    // return;
    this._patientService.addPatient(signUpData).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let result = this._coreService.decryptObjectData(encryptedData);
        if (result?.status) {
          this._coreService.showSuccess(result.message,"")
          this.route.navigate(['/patient/login'])
          // this.userId = result.body.portalUserData._id;

          // sessionStorage.setItem(
          //   "loginCreds",
          //   JSON.stringify({
          //     mobile: this.signUpForm.value.mobile,
          //     password: this.signUpForm.value.password,
          //   })
          // );
          // this._coreService.setLocalStorage(result.body,'loginData');
          // this.openVerticallyCenteredsecond(this.patientpopup);
        } else {
          this._coreService.showError(result.message, "");
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  get patientFormControl(): { [key: string]: AbstractControl } {
    return this.signUpForm.controls;
  }

  public sendTo2fa(medium: "email" | "mobile"): void {
    if (medium === "mobile") {
      let twoFaData = {
        mobile: this.signUpForm.value.mobile,
        country_code: this.selectedCountryCode,
      };
      // /superadmin/send-sms-otp-for-2fa
      this._patientService.getVerificationCodeMobile(twoFaData).subscribe(
        (res: any) => {

          let encryptedData = { data: res };
          let result = this._coreService.decryptObjectData(encryptedData);
          if (result.status) {
            this.modalService.dismissAll("close");
            this.route.navigate(["/patient/entercode"], {
              state: {
                mobile: this.signUpForm.value.mobile,
                country_code: this.selectedCountryCode,
                mode: medium,
                userId: this.userId,
              },
            });
          } else {
            this._coreService.showError(result.message, "");
          }
        },
        (err: any) => {
          console.log(err);
        }
      );
    }

    if (medium == "email") {
      let twoFaData = {
        email: this.signUpForm.value.email,
        userId: this.userId,
      };
      this._patientService.getVerificationCodeEmail(twoFaData).subscribe(
        (res: any) => {
          let result = this._coreService.decryptObjectData({ data: res });

          if (result.status == true) {
            this.modalService.dismissAll();
            this._coreService.showSuccess(" ", result.message);
            this.route.navigate(["/patient/entercode"], {
              state: {
                mobile: this.signUpForm.value.mobile,
                country_code: this.selectedCountryCode,
                mode: medium,
                email: this.signUpForm.value.email,
                userId: this.userId,
              },
            });
          } else {
            this._coreService.showError(result.message, "");
          }
        },
        (err: any) => {
          this._coreService.showSuccess(" ", err.message);
        }
      );
    }
    this._coreService.setLocalStorage("login", "component");
    this._coreService.setLocalStorage(medium, "medium");
  }

  closePopUp() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }

  openVerticallyCenteredterms(termsofuse: any) {
    this.modalService.open(termsofuse, {
      centered: true,
      size: "md",
      windowClass: "new_invite",
    });
  }

  goToHomePage(){
    if(this.translate.store.currentLang === undefined || this.translate.store.currentLang === 'ar'){
      this.route.navigate([`/test_p/home-ar`]);
    }else{
      this.route.navigate([`/test_p/home-en`]);
    }
  }
}
