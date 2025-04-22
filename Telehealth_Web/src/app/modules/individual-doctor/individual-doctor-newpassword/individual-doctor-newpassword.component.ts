import { Component, OnInit } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";
import Validation from "src/app/utility/validation";
import { IndiviualDoctorService } from "../indiviual-doctor.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-individual-doctor-newpassword",
  templateUrl: "./individual-doctor-newpassword.component.html",
  styleUrls: ["./individual-doctor-newpassword.component.scss"],
})
export class IndividualDoctorNewpasswordComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  logo: string = "assets/img/logo.svg";
  resetForm: FormGroup;
  isSubmitted: boolean = false;

  hide1 = true;
  hide2 = true;
  
  constructor(
    private toastr: ToastrService,
    private doctorService: IndiviualDoctorService,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private coreService: CoreService,
    private route: Router,
    private translate: TranslateService
  ) {
    this.resetForm = this.fb.group(
      {
        resetToken: [""],
        user_id: [""],
        password: [
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
        confirm_password: [null, [Validators.required]],
      },
      { validators: [Validation.match("password", "confirm_password")] }
    );
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params: any) => {
      this.resetForm.patchValue({
        resetToken: params.token,
        user_id: params.user_id,
      });
    });
  }

  setNewPassword() {
    this.isSubmitted = true;
    if (this.resetForm.invalid) {
      return;
    }
    this.isSubmitted = false;

    let reqData = {
      user_id: this.resetForm.value.user_id,
      resetToken: this.resetForm.value.resetToken,
      newPassword: this.resetForm.value.password,
    };


    this.doctorService.setNewPassword(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({data:res});
        if (response.status) {
          this.toastr.success(response.message);
          this.route.navigate(["/individual-doctor/login"]);
        } else {
          this.toastr.error(response.message);
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
  }

  get f() {
    return this.resetForm.controls;
  }

  goToHomePage(){
    if(this.translate.store.currentLang === undefined || this.translate.store.currentLang === 'ar'){
      this.route.navigate([`/test/home-ar`]);
    }else{
      this.route.navigate([`/test/home-en`]);
    }
  }
}
