
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SuperAdminService } from '../super-admin.service';
import { CoreService } from 'src/app/shared/core.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-super-admin-forgotpass',
  templateUrl: './super-admin-forgotpass.component.html',
  styleUrls: ['./super-admin-forgotpass.component.scss']
})
export class SuperAdminForgotpassComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  logo: string = "assets/img/logo.svg";
  forgotPassForm: FormGroup;
  responce: any = [];
  isSubmitted: boolean;
  toastr: any;
  loading: boolean = false;
  
  constructor(
    private fb: FormBuilder, 
    private _superAdminService: SuperAdminService, 
    private _coreService:CoreService,
     private router: Router,
     private translate: TranslateService    
    ) {
    this.forgotPassForm = this.fb.group({
      email: ['', [Validators.required]]
    })
  }

  get forgotFormControl(): { [key: string]: AbstractControl } {
    return this.forgotPassForm.controls;
  }

  ngOnInit(): void {
  }

  onSubmit(){
    let body=this.forgotPassForm.value
    this.isSubmitted=true;
    this.loading = true; // Disable button while processing

    this._superAdminService.forgotPassword(body).subscribe((res) =>{
      let result = this._coreService.decryptObjectData(res);
      if(result.status === true){
        this._coreService.showSuccess('',result.message)
        this.router.navigateByUrl("/super-admin/login", {
          state: { email: this.forgotPassForm.value },
        });
      }else{

        this._coreService.showError('',result.message)
      }
      this.loading = false; // Enable button after response
    })
  }

  goToHomePage(){
    if(this.translate.store.currentLang === undefined || this.translate.store.currentLang === 'ar'){
      this.router.navigate([`/test_p/home-ar`]);
    }else{
      this.router.navigate([`/test_p/home-en`]);
    }
  }
}



