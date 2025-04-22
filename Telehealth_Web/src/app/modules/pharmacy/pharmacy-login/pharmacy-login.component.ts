import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AuthService } from "src/app/shared/auth.service";
import { IResponse } from "src/app/shared/classes/api-response";
import { CoreService } from "src/app/shared/core.service";
import { environment } from "../../../../environments/environment";
import { PharmacyService } from "../pharmacy.service";
import { ILoginRequest, ILoginResponse } from "./pharmacy-login.type";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-pharmacy-login",
  templateUrl: "./pharmacy-login.component.html",
  styleUrls: ["./pharmacy-login.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PharmacyLoginComponent implements OnInit {
  login_logo: string = "assets/img/logo2.svg";
  logo: string = "assets/img/logo.svg";
  phoneNumber: string = "";
  countryCode: string = "";
  userId: string = "";
  emailId: string = "";
  password: any;
  passwordShow = false;
  isSubmitted: any = false;
  isDisabled1: boolean = false;
  isDisabled2: boolean = false;
  @ViewChild("twofapopup", { static: false }) twofapopup: any;

  public loginFields: FormGroup = new FormGroup(
    {
      email: new FormControl("", [Validators.required, Validators.email]),
      password: new FormControl("", [
        Validators.required,
        Validators.pattern("^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).{8,}$"),
      ]),
      keep_signin: new FormControl("",),
    },
    { validators: [] }
  );
  routeTo: any;

  constructor(
    private modalService: NgbModal,
    private pharmacyService: PharmacyService,
    private coreService: CoreService,
    private router: Router,
    public translate: TranslateService,

  ) { }

  openVerticallyCenteredsecond(twofapopup: any) {
    this.modalService.open(twofapopup, { centered: true, size: "",backdrop: 'static',keyboard: false });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  ngOnInit(): void {
    sessionStorage.clear();
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

  private getLoginField(field: string) {
    return this.loginFields.get(field).value;
  }

  public loginUser(): void {
    
    this.isSubmitted = true;
    if (this.loginFields.invalid) {
      return;
    }
    this.isSubmitted = false;

    const loginRequest: ILoginRequest = {
      email: this.getLoginField("email").toLowerCase(),
      password: this.getLoginField("password"),
    };
    this.pharmacyService.loginUser(loginRequest).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let result = this.coreService.decryptObjectData(encryptedData); 
        if (result.status === true) {        
            this.userId = result.body.user_details.portalUserData._id;    
            this.phoneNumber =
              result.body.user_details.portalUserData.phone_number;
            this.countryCode =
              result.body.user_details.portalUserData.country_code;
            this.emailId =
              result.body.user_details.portalUserData.email;
            this.openVerticallyCenteredsecond(this.twofapopup);          
        }else{
          this.coreService.showError(result.message,'');
        }
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
        if (err.message === "INTERNAL_SERVER_ERROR") {
          //  this.coreService.showError("", err.message);
        }
      },
    });
  }

  public gotoVerification(mode: "email" | "mobile"): void {
    if (mode === "email") {
      if (this.isDisabled2) return;
      this.isDisabled2 = true;   
      setTimeout(() => {
        this.isDisabled2 = false;
      }, 15000);
      this.router.navigateByUrl("/pharmacy/entercode", {
        state: {
          email: this.getLoginField("email"),
          userId: this.userId,
          mode,
        },
      });
    }
    if (mode === "mobile") {
      if (this.isDisabled1) return;
      this.isDisabled1 = true;   
      setTimeout(() => {
        this.isDisabled1 = false;
      }, 15000);
      this.router.navigateByUrl("/pharmacy/entercode", {
        state: {
          email: this.emailId,
          phoneNumber: this.phoneNumber,
          countryCode: this.countryCode,
          userId: this.userId,
          mode,
        },
      });
    }
    this.modalService.dismissAll();
  }

  getUserMenus(id) {
    const params = {
      module_name: "superadmin",
      user_id: id,
    };
    this.pharmacyService.getUserMenus(params).subscribe(
      (res: any) => {
        const decryptedData = this.coreService.decryptObjectData(res);

        if(decryptedData.status){      
          if(decryptedData?.body.length > 0){
            const findMenu = decryptedData?.body.find(ele => ele.menu_id.name === 'Dashboard' );        
          
            if(findMenu){
              this.routeTo = findMenu?.menu_id?.route_path;
              this.router.navigate([this.routeTo]);
            }else{
              this.routeTo = decryptedData?.body[0]?.menu_id?.route_path;
              this.router.navigate([this.routeTo]);
            }
            
          }else{
            this.router.navigate([`pharmacy/profile`])
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
      this.router.navigate([`/test/home-ar`]);
    }else{
      this.router.navigate([`/test/home-en`]);
    }
  }
}