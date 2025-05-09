import { Component, OnInit,ElementRef, ViewChild,ViewEncapsulation, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AuthService } from 'src/app/shared/auth.service';
import { CoreService } from 'src/app/shared/core.service';
import { TranslateService } from '@ngx-translate/core';
import { PatientService } from '../../patient.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import intlTelInput from "intl-tel-input";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-en-landing-page',
  templateUrl: './en-landing-page.component.html',
  styleUrls: ['./en-landing-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class EnLandingPageComponent implements OnInit {
  bussinessForm: FormGroup;
  loginUserID: string = "";
  loginUserNAME: string = "";
  role: any;
  type: any;
  profilePic: any;
  selectedLang: string = 'en'; 
  faqList: any[] = [];
  showData: any;
  selectedCountryCode: string = '+966'; 
  selectedcountrycodedb: any = '+966';
  iti: any;
  @ViewChild('contactModal') contactModal: any;
  @ViewChild('terms_policy') terms_policy: any;
  @Input() hideLanguage: boolean = true;

  //for both landing page component

  @ViewChild("phone") phone: ElementRef<HTMLInputElement>;

  constructor(
    private fb :FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private coreService: CoreService,
    private modalService: NgbModal,
    private service: PatientService,
    private _coreService: CoreService,
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

    } else {
      this.translate.use(this.translate.currentLang);
    }
    this.bussinessForm = this.fb.group({
      fullName: ["",[Validators.required]],
      email: ["",[Validators.required]],
      phone: ["", [Validators.required, Validators.pattern(/^\d{2}-\d{3}-\d{4}$/)]],
      subject: ["",[Validators.required]],
      message: ["",[Validators.required]]
    });
  }


  onLangChange(lang: string) {
    this.selectedLang = lang; 
    if(this.selectedLang === 'en'){
      this.router.navigate([`/test_p/home-en`]).then((res) => {
        if (res) {
          this.ngxLoader.stop();
        }
  
      }, (rej) => {
        console.log('in rejection');
  
      })   
    }else{
      this.router.navigate([`/test_p/home-ar`]).then((res) => {
        if (res) {
          this.ngxLoader.stop();
        }
  
      }, (rej) => {
        console.log('in rejection');
  
      })
    }
  }

  sendOnpath(dest: string) {
    // this.ngxLoader.start();
    this.router.navigate([`/${dest}`]).then((res) => {
      if (res) {
        // this.ngxLoader.stop();
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

  scrollToDiv(data:any) {
    const element = document.getElementById(data);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ngOnInit(): void {
    this.listfaq();
  }

  ngAfterViewInit() {
    this.initializeIntlTelInput();
  }

  initializeIntlTelInput() {
    const countryData = (window as any).intlTelInputGlobals.getCountryData();
    let country_code = '';

    for (let i = 0; i < countryData.length; i++) {
      if (countryData[i].dialCode === this.selectedCountryCode.replace("+", "")) {
        country_code = countryData[i].iso2;
        break;
      }
    }

    const input = this.phone.nativeElement;
    this.iti = intlTelInput(input, {
      initialCountry: country_code,
      separateDialCode: true, 
    });
    this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
    input.addEventListener("countrychange", () => {
      this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
    });
  }

  onFocus() {
    this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
  }

  onMobileInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    let formattedNumber = '';

    if (input.length <= 2) {
      formattedNumber = input;
    } else if (input.length <= 5) {
      formattedNumber = `${input.slice(0, 2)}-${input.slice(2)}`;
    } else {
      formattedNumber = `${input.slice(0, 2)}-${input.slice(2, 5)}-${input.slice(5, 9)}`;
    }

    this.bussinessForm.get('phone')?.setValue(formattedNumber, { emitEvent: false });
  }
  listfaq() { 
    let reqData = {
      language: this.translate.currentLang,
    };
    this.service.getallFaq(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      this.showData = response?.body
    });
  }


  // submitForm() {
  //   if (this.formData.fullName && this.formData.email && this.formData.phone && this.formData.subject && this.formData.message) {
  //     console.log(this.formData);            //[[7 feb Landing Page Bussiness Form Data Send in Payload Task ]]
      
  //     this.service.postBussinessForm(this.formData).subscribe(
  //       (response) => {
  //         console.log('Form submitted successfully:', response);
  //       },
  //       (error) => {
  //         console.error('Error submitting form:', error);
  //       }
  //     );
  //   } else {
  //     alert('Please fill in all fields.');
  //   }
  // }

  // onMobileInput(event: Event): void {
  //   const input = (event.target as HTMLInputElement).value.replace(/\D/g, ''); // Remove all non-digit characters
  //   let formattedNumber = '';

  //   if (input.length <= 2) {
  //     formattedNumber = input;
  //   } else if (input.length <= 5) {
  //     formattedNumber = `${input.slice(0, 2)}-${input.slice(2)}`;
  //   } else {
  //     formattedNumber = `${input.slice(0, 2)}-${input.slice(2, 5)}-${input.slice(5, 9)}`;
  //   }

  //   this.bussinessForm.get('main_phone_number')?.setValue(formattedNumber, { emitEvent: false });
  // }
  submitForm(){
    this.ngxLoader.start();
    if (this.bussinessForm.invalid){
      return;
    }
    
    let reqData = {
      fullName : this.bussinessForm.value.fullName,
      email : this.bussinessForm.value.email,
      phone : this.bussinessForm.value.phone,
      country_code: this.selectedCountryCode,
      subject: this.bussinessForm.value.subject,
      message: this.bussinessForm.value.message,
    }
    
    this.service.postBussinessForm(reqData).subscribe(
      (res: any) =>{
        let encryptedData = { data :res };
        let response = this.coreService.decryptObjectData(encryptedData);
        
        if(response.status){
          this.toastr.success(response.message);
        }else{
          this.toastr.error(response.message);
        }
      },
      (error) => {
        this.toastr.error("Something Went Wrong while Submitting Form!!")
      }
    );
    this.ngxLoader.stop();
    this.bussinessForm.reset();
  }
  openContactModal() {
    this.modalService.open(this.contactModal, { centered: true, size: 'lg' });
  }

  openTermsPolicyModal() {
    this.modalService.open(this.terms_policy, { centered: true, size: 'xl' });
    }

  closePopup() {
    this.modalService.dismissAll();
  }
  
}
