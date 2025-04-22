import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { IResponse } from "src/app/shared/classes/api-response";
import { CoreService } from "src/app/shared/core.service";
import { ISendOtpResponse } from "../pharmacy-entercode/pharmacy-entercode.type";
import { customFieldValidator } from "../pharmacy-signup/pharmacy-signup.validator";
import { PharmacyService } from "../pharmacy.service";
import { IResetPasswordRequest } from "./pharmacy-newpassword.type";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-pharmacy-newpassword",
  templateUrl: "./pharmacy-newpassword.component.html",
  styleUrls: ["./pharmacy-newpassword.component.scss"],
})
export class PharmacyNewpasswordComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  logo: string = "assets/img/logo.svg";
  passwordToken: string = "";
  hide1 = true;
  hide2 = true;
  isSubmitted: boolean = false;


  public resetPasswordFields: FormGroup = new FormGroup(
    {
      password: new FormControl("", [
        Validators.required,
        Validators.pattern("^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).{8,}$"),
      ]),
      confirm_password: new FormControl("", [
        Validators.required,
        Validators.pattern("^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).{8,}$"),
      ]),
      accept_terms: new FormControl(true, []),
    },
    [customFieldValidator]
  );

  constructor(
    private router: Router,
    private pharmacyService: PharmacyService,
    private coreService: CoreService,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.passwordToken = params["token"];
      if (this.passwordToken === "") {
        this.router.navigateByUrl("/pharmacy/login");
      }
    });
  }

  private getPasswordField(field: string) {
    return this.resetPasswordFields.get(field).value;
  }

  private getFieldTouched(field: string) {
    return (
      this.resetPasswordFields.get(field).touched ||
      this.resetPasswordFields.get(field).dirty
    );
  }

  public customValidatorError(field: string, customValidatorField: string) {
    return (
      this.getFieldTouched(field) &&
      this.resetPasswordFields.errors &&
      this.resetPasswordFields.errors?.[customValidatorField]
    );
  }

  resetPasswordFlow() {
    this.isSubmitted = true;
    if (this.resetPasswordFields.invalid) {
      return;
    }
    const resetPasswordRequest: IResetPasswordRequest = {
      new_password: this.getPasswordField("password"),
      passwordToken: this.passwordToken,
    };
    
    this.pharmacyService.resetPasswordUser(resetPasswordRequest).subscribe({
      next: (res: IResponse<ISendOtpResponse>) => {
        let encryptedData = { data: res };
        let result = this.coreService.decryptObjectData(encryptedData)
        
        if (result.status === true) {
          this.coreService.showSuccess("", result.message);
          this.router.navigateByUrl("/pharmacy/login");
        }else{
          this.coreService.showError("", result.message);
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

  goToHomePage(){
    if(this.translate.store.currentLang === undefined || this.translate.store.currentLang === 'ar'){
      this.router.navigate([`/test/home-ar`]);
    }else{
      this.router.navigate([`/test/home-en`]);
    }
  }
}
