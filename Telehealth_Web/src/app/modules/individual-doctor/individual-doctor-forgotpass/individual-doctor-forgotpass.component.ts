import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "../indiviual-doctor.service";
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: "app-individual-doctor-forgotpass",
  templateUrl: "./individual-doctor-forgotpass.component.html",
  styleUrls: ["./individual-doctor-forgotpass.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class IndividualDoctorForgotpassComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  forgotPassForm: FormGroup;
  isSubmitted: boolean = false;
  loading: boolean = false;
  response: any = [];

  constructor(
    private fb: FormBuilder,
    private doctorService: IndiviualDoctorService,
    private coreService: CoreService,
    private route: Router,
    private translate: TranslateService
  ) {
    this.forgotPassForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    this.isSubmitted = true;
    if (this.forgotPassForm.invalid) {
      return;
    }
    this.loading = true; // Disable the button
    this.isSubmitted = false;

    let reqData = {
      email: this.forgotPassForm.value.email,
    };

    this.doctorService.forgotPassword(reqData).subscribe((res) => {
      let result = this.coreService.decryptObjectData({data:res});
      if (result.status === true) {
        this.coreService.showSuccess("", result.message);
        this.route.navigate(['/individual-doctor/login'])
      }else{
        this.coreService.showError("", result.message);
      }
      this.loading = false; // Enable the button after response
    });
    
  }

  get forgotFormControl(): { [key: string]: AbstractControl } {
    return this.forgotPassForm.controls;
  }

  goToHomePage(){
    if(this.translate.store.currentLang === undefined || this.translate.store.currentLang === 'ar'){
      this.route.navigate([`/test_p/home-ar`]);
    }else{
      this.route.navigate([`/test_p/home-en`]);
    }
  }
}
