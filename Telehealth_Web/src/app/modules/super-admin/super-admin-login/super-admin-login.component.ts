import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/shared/auth.service';
import { CoreService } from 'src/app/shared/core.service';
import { environment } from '../../../../environments/environment';
import { SuperAdminService } from '../super-admin.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-super-admin-login',
  templateUrl: './super-admin-login.component.html',
  styleUrls: ['./super-admin-login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SuperAdminLoginComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  isSubmitted: boolean = false;
  isLoading: boolean = false;
  loginForm: FormGroup;
  phoneNumber: string;
  countryCode: string;
  userEmail: string;
  userId: string;
  password: any;
  passwordShow = false;
  isDisabled1: boolean = false;
  isDisabled2: boolean = false;
  @ViewChild('addsecondsubsriber', { static: false }) addsecondsubsriber: any;
  routeTo: any;
  constructor(private modalService: NgbModal,
    private fb: FormBuilder, private authService: AuthService, private route: Router,
    public translate: TranslateService,
    private _sadminservice: SuperAdminService, private _coreService: CoreService,) {

    let token = this.authService.isLoggedIn();
    let role = this.authService.getRole();
    if (token && role == environment.SUPERADMIN) {
      route.navigate(['/super-admin/dashboard']);
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required,
      Validators.email,
      Validators.pattern('[A-Za-z0-9._%+-]{3,}@[a-zA-Z]{3,}([.]{1}[a-zA-Z]{2,}|[.]{1}[a-zA-Z]{2,}[.]{1}[a-zA-Z]{2,})')]],
      password: ['', [Validators.required]]
    })

  }

  ngOnInit(): void {
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
    this._sadminservice.login(formData).subscribe((res) => {
      try {
        let result = this._coreService.decryptObjectData(res);
        if (result.status) {         
          if (result.body.otp_verified === false) {
            this.phoneNumber =
              result.body.findUser.mobile;
            this.countryCode =
              result.body.findUser.country_code;
            this.userEmail = result.body.findUser.email;
            this.userId = result.body.findUser._id;
            this.openVerticallyCenteredsecond(this.addsecondsubsriber);
          }

        } else {
          this._coreService.showError('Login Message', result.message);
        }
      } catch (error) {
        this._coreService.showError('', error);      }
    }, (err: Error) => {
      alert(err.message);
    })

  }
  get loginFormControl(): { [key: string]: AbstractControl } {
    return this.loginForm.controls;
  }
  sendVerificationCode(medium: any) {


    if (medium === 'mobile') {
      if (this.isDisabled1) return;
      this.isDisabled1 = true;   
      setTimeout(() => {
        this.isDisabled1 = false;
      }, 15000);
      
      let twoFaData = {
        email: this.userEmail,
      }
      this._sadminservice.getVerificationCodeMobile(twoFaData).subscribe((res: any) => {

        let result = this._coreService.decryptObjectData(res);
        if (result.status) {
          this.closePopUp();
          this._coreService.showSuccess(" ", result.message);
          this.route.navigate(['/super-admin/entercode'], {
            state: {
              mobile: this.phoneNumber,
              country_code: this.countryCode,
              mode: medium,
              userId: this.userId,
              email: this.userEmail
            }
          });
        } else {
          this._coreService.showError(result.message, '');
          this.closePopUp();
        }
      }, (err: any) => {
        console.log(err);
      });
    }

    if (medium == 'email') {
      if (this.isDisabled2) return;
      this.isDisabled2 = true;   
      setTimeout(() => {
        this.isDisabled2 = false;
      }, 15000);

      let twoFaData = {
        email: this.userEmail,
      }

      this._sadminservice.getVerificationCodeEmail(twoFaData).subscribe((res: any) => {

        let result = this._coreService.decryptObjectData(res);

        if (result.status) {
          this.closePopUp();
          this._coreService.showSuccess(" ", result.message);
          this.route.navigate(['/super-admin/entercode'], {
            state: {
              mobile: this.phoneNumber,
              country_code: this.countryCode,
              mode: medium,
              email: this.userEmail,
              userId: this.userId
            }
          });
        } else {
          this._coreService.showError(result.message, '');
          this.closePopUp();
        }
      }, (err: any) => {
        console.log(err);

      });
    }

    // this.loginApiRes['component'] = "login";
    // this._coreService.setSharingData(this.loginApiRes);
    this._coreService.setLocalStorage('login', 'component');
    this._coreService.setLocalStorage(medium, 'medium');

  }

  private closePopUp() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }

  openVerticallyCenteredsecond(insurancepopup: any) {
    this.modalService.open(insurancepopup, { centered: true, size: '',backdrop:'static' });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  getUserMenus(id) {
    const params = {
      module_name: "superadmin",
      user_id: id,
    };
    this._sadminservice.getUserMenus(params).subscribe(
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
            this.route.navigate([`super-admin/profile`])
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