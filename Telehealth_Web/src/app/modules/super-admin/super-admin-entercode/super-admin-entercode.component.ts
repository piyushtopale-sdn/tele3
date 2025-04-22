import { Location } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { CoreService } from 'src/app/shared/core.service';
import { SuperAdminService } from '../super-admin.service';
import { AuthService } from 'src/app/shared/auth.service';
import { TranslateService } from '@ngx-translate/core';
export interface ILocationData {
  mode: "email" | "mobile";
  mobile: string;
  country_code: string;
  email: string;
  userId:string;
}
@Component({
  selector: 'app-super-admin-entercode',
  templateUrl: './super-admin-entercode.component.html',
  styleUrls: ['./super-admin-entercode.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SuperAdminEntercodeComponent implements OnInit {
  login_logo: string = "assets/img/logo.svg";
  logo: string = "assets/img/logo.svg";
  isSubmitted: boolean = false;
  isDisabled: boolean = true;
  tempToken: any;
  routeTo: any;
  isResendDisabled: boolean = false; // Initially the resend button is enabled


  constructor(
    private route: Router,
    private location: Location,
    private sadminService: SuperAdminService,
    private _coreService: CoreService,
    private authService: AuthService,
    private translate: TranslateService
  ) { }

  mode: string;
  countryCode: string = "";
  email: string = '';
  mobileNo: string = '';
  otpContext:string;
  userId:string;
  config = {
    allowNumbersOnly: true,
    length: 4,
    disableAutoFocus: false,
    placeholder: '0',
    inputStyles: {
      'width': '50px',
      'height': '50px'
    }
  };



  ngOnInit(): void {
    const locationInfo = this.location.getState() as ILocationData;

    this.mode = locationInfo.mode;
    this.countryCode = locationInfo.country_code;
    this.mobileNo = locationInfo.mobile;
    this.email = locationInfo.email;
    this.userId = locationInfo.userId;
    if(locationInfo.mode === 'mobile'){
      this.otpContext = this.maskCharacter(
        locationInfo.country_code + locationInfo.mobile,
        "*",
        3
      );
    }

    if(locationInfo.mode === 'email'){
      this.otpContext = this.maskCharacter(locationInfo.email, "*", 3);
    }
    

    if (locationInfo && locationInfo.mode == undefined) {
      this.route.navigateByUrl("/super-admin/login");
    }
  }

  maskCharacter(str: string, mask, n = 1) {
    return (
      ("" + str).slice(0, n) +
      ("" + str).slice(n, -n).replace(/./g, mask) +
      ("" + str).slice(-n)
    );
  }


  verifyOtp(val: any) {
    if (val.currentVal.length == 4) {
      let otpData = null;

      if (this.mode == 'email') {
        otpData = {
          email: this.email,
          otp: val.currentVal
        }

      this.sadminService.verifyEmailOtp(otpData).subscribe((res: any) => {
        
        let result = this._coreService.decryptObjectData({data:res});
        if (result?.status) {
          this._coreService.showSuccess(result?.message, "Login Successfully!");
          this._coreService.setLocalStorage(result?.body?.adminData, 'adminData');
          this._coreService.setLocalStorage(result?.body?.findUser, 'loginData');
          this._coreService.setProfileDetails(result?.body?.findUser.fullName);
          this.authService.setToken(result?.body?.token);
          this.authService.setRole('super-admin');
          this.authService.setRefreshToken(result?.body?.refreshToken);           
          if(result?.body?.role === "superadmin"){
            this.route.navigate([`/super-admin/dashboard`]);                  
          }else{
            this.getUserMenus(result?.body?.findUser?._id) 
          }
        } else {
          this._coreService.showWarning(result?.message, '')
        }

      }, (err: any) => {
        this._coreService.showWarning(err.message, '')

      })
      }

      if (this.mode == 'mobile') {
        otpData = {
          for_portal_user: this.userId,
          otp: val.currentVal,  
        }

      this.sadminService.verifyMobileOtp(otpData).subscribe((res: any) => {
        let result = this._coreService.decryptObjectData(res);        
        if (result?.status) {
          this._coreService.showSuccess(result?.message, "Login Successfully!");
          this._coreService.setLocalStorage(result?.body?.findUser, 'loginData');
          this._coreService.setLocalStorage(result?.body?.adminData, 'adminData');
          this._coreService.setProfileDetails(result?.body?.findUser.fullName);
          this.authService.setToken(result?.body?.token);
          this.authService.setRole('super-admin');
          this.authService.setRefreshToken(result?.body?.refreshToken);  
          if(result?.body?.role === "superadmin"){
            this.route.navigate([`/super-admin/dashboard`]);                  
          }else{
            this.getUserMenus(result?.body?.findUser?._id) 
          }         
        } else {
          this._coreService.showWarning(result?.message, '')
        }

      }, (err: any) => {
        console.log('error in verify otp', err);

      })
      }


    }
  }

  onOtpChange(event: any) {
    if (event.length == 4) {
      this.isDisabled = false;
    }

  }
  resendOtpDetails() {    
    if (this.isResendDisabled) {
      return; // Prevent further actions if it's disabled
    }

    if (this.mode === "mobile") {
      this.sendVerificationCode("mobile");
    }
    if (this.mode === "email") {
      this.sendVerificationCode("email");
    }

    this.isResendDisabled = true;

    setTimeout(() => {
      this.isResendDisabled = false; // Re-enable after 30 seconds
    }, 30000); 
  }
  sendVerificationCode(medium: any) {


    if (medium === 'mobile') {
      let twoFaData = {
        email: this.email,
      }
      this.sadminService.getVerificationCodeMobile(twoFaData).subscribe((res: any) => {
        
        let result = this._coreService.decryptObjectData(res);
        if (result.status) { 
          this._coreService.showSuccess("", result.message)         
          this.route.navigate(['/super-admin/entercode'], {
            state: {
              mobile:  this.mobileNo,
              country_code: this.countryCode,
              mode: medium,
              userId: this.userId
            }
          });
        }else{
          this._coreService.showError(result.message,'');
        }
      }, (err: any) => {
        this._coreService.showError("", err.statusText)
      });
    }

    if (medium == 'email') {
      let twoFaData = {
        email: this.email,
      }
      this.sadminService.getVerificationCodeEmail(twoFaData).subscribe((res: any) => {
        let result = this._coreService.decryptObjectData(res);

        if (result.status) {
          this._coreService.showSuccess(" ", result.message);
          this.route.navigate(['/super-admin/entercode'], {
            state: {
              mobile:  this.mobileNo,
              country_code: this.countryCode,
              mode: medium,
              email: this.email,
              userId: this.userId
            }
          });
        }else{
          this._coreService.showError(result.message,'');
        }
      }, (err: any) => {
        console.log(err);
        this._coreService.showError("", err.statusText)
      });
    }

    // this.loginApiRes['component'] = "login";
    // this._coreService.setSharingData(this.loginApiRes);
    this._coreService.setLocalStorage('login', 'component');
    this._coreService.setLocalStorage(medium, 'medium');

  }

  getUserMenus(id) {
    const params = {
      module_name: "superadmin",
      user_id: id,
    };
    this.sadminService.getUserMenus(params).subscribe(
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
