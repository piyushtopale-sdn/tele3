import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { CoreService } from 'src/app/shared/core.service';
import { PatientService } from '../../patient.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  @ViewChild("loginRequiredWarningModal", { static: false }) loginRequiredWarningModal: any;
  showData: any;
  language: any = "en";
  email: any;
  phone: any;
  address: any;

  constructor(
    private router: Router,
    private coreService: CoreService,
    private modalService: NgbModal,
    public translate: TranslateService,
    private service: PatientService,

  ) { }

  ngOnInit(): void {
    // this.listContactUs();
  }

  openModal() {
    this.modalService.open(this.loginRequiredWarningModal, {
      centered: true,
      size: "lg",
      windowClass: "order_medicine",
    });
  }

  aboutUshandleRoute() {
    this.router.navigate(['patient/homepage/aboutus'])
  }

  bloghandleRoute() {
    this.router.navigate(['patient/homepage/blog'])
  }

  contacthandleRoute() {
    this.router.navigate(['patient/homepage/contactus'])
  }

  privacyhandleRoute() {
    this.router.navigate(['patient/homepage/privacycondition'])
  }

  termshandleRoute() {
    this.router.navigate(['patient/homepage/terms&condition'])
  }

  articlehandleRoute() {
    this.router.navigate(['patient/homepage/articles'])
  }

  faqhandleRoute() {
    this.router.navigate(['patient/homepage/faqs'])
  }

  medicalVideohandleRoute() {
    this.router.navigate(['patient/homepage/videos'])
  }

  routeclaim(flag: any) {
    if (this.coreService.getLocalStorage("loginData")) {
      if (flag === 1) {
        this.router.navigate(['/patient/medicineclaims/submitclaim'])
      } else if (flag === 2) {
        this.router.navigate(['/patient/medicineclaims'])
      }
    } else {
      this.openModal();
    }
  }


  handleBtnClick() {
    this.modalService.dismissAll();
    this.router.navigate(["/patient/login"]);
  }

  navigateToTab(tab: any) {

    this.router.navigate(["/patient/homepage"], { fragment: tab });

  }


  listContactUs() {
    const params = {
      langType: this.translate.currentLang
    }
    this.service.getContactus(params).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);
      this.showData = response?.body;
      this.email = response?.body?.email;
      this.phone = response?.body?.phone;
      this.address = response.body?.address;
    });
  }
}
