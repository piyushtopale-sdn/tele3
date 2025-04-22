import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CoreService } from 'src/app/shared/core.service';
import { PatientService } from '../patient.service';
import { customFieldValidator } from '../patient-setnewpass/patient-setnewpass.validator';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-patient-setnewpass',
  templateUrl: './patient-setnewpass.component.html',
  styleUrls: ['./patient-setnewpass.component.scss']
})
export class PatientSetnewpassComponent implements OnInit {
  login_logo: string = "assets/img/logo2.svg";
  logo: string = "assets/img/logo.svg";
  resetForm: FormGroup;
  submitted: boolean = false;
  password: any;
  confirmPassword: any;

  constructor(private fb: FormBuilder,
    private translate: TranslateService, 
    private toastr: ToastrService,
    private _patientService: PatientService,
    private activatedRoute: ActivatedRoute,
    private _coreService: CoreService,private router: Router) {
    this.resetForm = this.fb.group({
      resetToken: [''],
      user_id: [''],
      newPassword: ['', [ Validators.required,
        Validators.pattern("^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).{8,}$"),]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: [customFieldValidator]})
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams
      .subscribe((params: any) => {
        this.resetForm.patchValue({
          resetToken: params.token,
          user_id: params.user_id
        })
      }
      );
  }

  private getFieldTouched(field: string) {
    return (
      this.resetForm.get(field).touched ||
      this.resetForm.get(field).dirty
    );
  }

  public customValidatorError(field: string, customValidatorField: string) {
    return (
      this.getFieldTouched(field) &&
      this.resetForm.errors &&
      this.resetForm.errors?.[customValidatorField]
    );
  }

  setNewPassword() {
    this.submitted = true;
    if (this.resetForm.invalid) {
      this._coreService.showError("","Check all required fields!")
      return;
    }
    // const data = this.resetForm.value
    this._patientService.setNewPassword(this.resetForm.value).subscribe((res) => {
      let response = this._coreService.decryptObjectData({data:res});
      if (response.status) {        
        this.toastr.success(response.message)
        this.router.navigateByUrl('/patient/login');

      } else {
        this.toastr.error(response.message)
      }
    })
  }

  get resetFormControl(): { [key: string]: AbstractControl } {
    return this.resetForm.controls;
  }

  goToHomePage(){
    if(this.translate.store.currentLang === undefined || this.translate.store.currentLang === 'ar'){
      this.router.navigate([`/test/home-ar`]);
    }else{
      this.router.navigate([`/test/home-en`]);
    }
  }
}
