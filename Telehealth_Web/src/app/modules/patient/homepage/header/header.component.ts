import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AuthService } from 'src/app/shared/auth.service';
import { CoreService } from 'src/app/shared/core.service';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  loginUserID: string = "";
  loginUserNAME: string = "";
  role: any;
  type: any;
  profilePic: any;
  selectedLang: string = 'en'; 
  
  constructor(
    private router: Router,
    private coreService: CoreService,
    private auth: AuthService,
    public translate: TranslateService,
    private ngxLoader: NgxUiLoaderService) {
    let userData = this.coreService.getLocalStorage("loginData");
    let profileData = this.coreService.getLocalStorage("profileData");

    if(userData){
      this.loginUserID = userData?._id;
      // this.loginUserNAME = profileData?.full_name;
      this.role = userData?.role
      this.type = userData?.type
    }
    if(profileData){
      this.profilePic = profileData?.profile_pic
      this.loginUserNAME = profileData?.full_name;
    }


    if (this.translate.currentLang == undefined) {
      this.translate.use("en");

    }
    else {
      // this.translate.use(this.translate.currentLang)

    }

  }

  ngOnInit(): void {

    this.checkUserLogin();
  }
  checkUserLogin() {
    let role = this.auth.getRole();
    this.type = this.auth.getType();
    
    if (role == "super-admin") {
      role = "SUPERADMIN"
    }
    if ((role || "").toUpperCase() === "PATIENT") {

    }
    else if ((role || "").toUpperCase() === "PHARMACY") {
      this.router.navigateByUrl("/pharmacy");
    }  
    else if ((role || "") === "SUPERADMIN") {
      this.router.navigateByUrl("/super-admin");
    }
    else if ((role || "") === "portals") {
      this.router.navigateByUrl("/portals/login/"+this.type);
    }
    else if ((role || "").toUpperCase() === "INDIVIDUAL-DOCTOR") {
      this.router.navigateByUrl("/individual-doctor");
    }

    else {

      // this.router.navigateByUrl("/");

    }



  }
  checkurl(pagename) {
    var currenturl = this.router.url.split("/")[3];
    if (currenturl == pagename) {
      return true;
    }
    else {
      return false;
    }
  }


  handleRoute() {
    this.router.navigate(["patient/homepage/retailpharmacy"])
  }
  handleDoctorRoute() {
    this.router.navigate(["patient/homepage/retaildoctor"])
  }

  handleFourPortalRoute(path: any) {
    this.router.navigate(["patient/homepage/list", path]);
  }


  sendOnpath(dest: string) {
    this.ngxLoader.start();
    this.router.navigate([`/${dest}`]).then((res) => {
      if (res) {
        this.ngxLoader.stop();
      }

    }, (rej) => {
      console.log('in rejection');

    })

  }

  sendOnpathFourPortal(path: any) {
    this.ngxLoader.start();
    this.router.navigate([`/portals/login/${path}`]).then((res) => {
      if (res) {
        this.ngxLoader.stop();
      }

    }, (rej) => {
      console.log('in rejection');

    })

  }

  bloghandleRoute() {
    this.router.navigate(['patient/homepage/blog'])
  }

  logout() {
    this.auth.logout();
  }


  onLangChange(lang: string) {
    this.selectedLang = lang; // Update selected language
  }

}
