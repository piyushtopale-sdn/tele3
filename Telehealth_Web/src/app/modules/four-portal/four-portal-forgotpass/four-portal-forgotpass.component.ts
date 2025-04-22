import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "../../../modules/individual-doctor/indiviual-doctor.service";
import { FourPortalService } from '../four-portal.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-four-portal-forgotpass',
  templateUrl: './four-portal-forgotpass.component.html',
  styleUrls: ['./four-portal-forgotpass.component.scss']
})
export class FourPortalForgotpassComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  forgotPassForm: FormGroup;
  isSubmitted: boolean = false;
  loading: boolean = false;
  response: any = [];
  route_type:any;
  constructor(
    private fb: FormBuilder,
    private coreService: CoreService,
    private route: Router,
    private activateRoute: ActivatedRoute,
    private fourPortalService: FourPortalService,
    private loader: NgxUiLoaderService,   
    private translate: TranslateService, 
  ) {
    this.forgotPassForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.activateRoute.paramMap.subscribe(params => {
      this.route_type = params.get('path');
    });
  }

  onSubmit() {
    this.isSubmitted = true;
    if (this.forgotPassForm.invalid) {
      return;
    }
    this.loading = true; // Disable the button while processing
    this.isSubmitted = false;

    let reqData = {
      email: this.forgotPassForm.value.email,
      type:this.route_type
    };
    this.loader.start();
    this.fourPortalService.forgotPassword(reqData).subscribe((res) => {
      let result = this.coreService.decryptObjectData({data:res});
      if (result.status === true) {
        this.loader.stop();
        this.coreService.showSuccess("", result.message);
        this.route.navigate([`/portals/login/${this.route_type}`])
      }else{
        this.loader.stop();
        this.coreService.showError("", result.message);
      }
      this.loading = false; // Enable the button after response
    });
    
  }

  routeToLogin(){
    this.route.navigate([`/portals/login/${this.route_type}`])
  }

  routeToEntercode(){
    this.route.navigate([`/portals/entercode/${this.route_type}`])
  }


  get forgotFormControl(): { [key: string]: AbstractControl } {
    return this.forgotPassForm.controls;
  }

  goToHomePage(){
    if(this.translate.store.currentLang === undefined || this.translate.store.currentLang === 'ar'){
      this.route.navigate([`/test/home-ar`]);
    }else{
      this.route.navigate([`/test/home-en`]);
    }
  }
}
