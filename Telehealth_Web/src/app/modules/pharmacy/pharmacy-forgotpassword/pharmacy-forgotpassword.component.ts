import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { IResponse } from "src/app/shared/classes/api-response";
import { CoreService } from "src/app/shared/core.service";
import {
  ISendEmailRequest,
  ISendOtpResponse,
} from "../pharmacy-entercode/pharmacy-entercode.type";
import { PharmacyService } from "../pharmacy.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-pharmacy-forgotpassword",
  templateUrl: "./pharmacy-forgotpassword.component.html",
  styleUrls: ["./pharmacy-forgotpassword.component.scss"],
})
export class PharmacyForgotpasswordComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  logo: string = "assets/img/logo.svg";
  loading: boolean = false;
  
  public forgotPasswordFields: FormGroup = new FormGroup({
    email: new FormControl("", [Validators.required]),
  });
  constructor(
    private router: Router,
    private pharmacyService: PharmacyService,
    private coreService: CoreService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {}

  private getPasswordField(field: string) {
    return this.forgotPasswordFields.get(field).value;
  }

  forgotPasswordFlow() {
    if (this.forgotPasswordFields.invalid) {
      return;
    }
    this.loading = true; // Disable the button while processing
    const forgotPasswordRequest: ISendEmailRequest = {
      email: this.getPasswordField("email"),
    };
    this.pharmacyService.forgotPasswordUser(forgotPasswordRequest).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let result = this.coreService.decryptObjectData(encryptedData);
       
        if (result.status === true) {
             this.coreService.showSuccess("", result.message);
          this.router.navigateByUrl("/pharmacy/login", {
            state: { email: this.getPasswordField("email") },
          });
        }else{
          this.coreService.showError("", result.message);
        }
        this.loading = false; // Re-enable the button after response
      },
      error: (err: ErrorEvent) => {
        
        this.coreService.showError("", err.message);
        this.loading = false; // Re-enable the button after response
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
