import { Component, OnInit, ViewEncapsulation,ViewChild } from "@angular/core";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "src/app/modules/individual-doctor/indiviual-doctor.service";
import { PatientService } from "../../patient.service";
import { Router, ActivatedRoute } from "@angular/router";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormArray,
  FormGroup,
  Validators,
} from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { environment } from "src/environments/environment";
@Component({
  selector: 'app-four-portal-view-appointment',
  templateUrl: './four-portal-view-appointment.component.html',
  styleUrls: ['./four-portal-view-appointment.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FourPortalViewAppointmentComponent implements OnInit {
  doctor_basic_info: any;
  appointmentDetails: any;
  appointmentType: any = "";
  patientDetails: any;
  paymentDetailsForm: FormGroup;
  appointment_id: any;
  doctor_id: any;
  patient_document: any[];
  paymentType: any = "pre-payment";
  PaymentMode: any;
  totalReview: number = 0;
  averagerate: number = 0;
  rating: any;
  isDisable:boolean=true;
  portal_type: any;
  profileData: any;
  loginData: any;
  patient_id: any;

  @ViewChild("mobilePaycontent", { static: false }) mobilePaycontent: any;
  mobilePayDetails: any;
  mobilePaynumbers: any;
  mobilePayForm!: FormGroup;
  selectedProvider: any;
  selectedProviderNumber: string = '';
  countryCodes:any;
  isSubmitted: boolean = false;
  constructor(
    private modalService: NgbModal,
    private _indiviualDoctorService: IndiviualDoctorService,
    private coreService: CoreService,
    private _PatientService: PatientService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private toster: ToastrService
  ) {
    this.profileData = this.coreService.getLocalStorage('profileData');
    this.loginData = this.coreService.getLocalStorage("loginData")
    this.patient_id =   this.loginData?._id;
    this.route.queryParams.subscribe((res) => {
      this.appointment_id = res["appointment_id"];
      this.portal_type = res["portal_type"];

    });

    this.paymentDetailsForm = this.fb.group({
      payment_mode: [""],
      payment_type: [""],
    });

      // Define the country codes array in your component
      this.countryCodes = ["+226(BF)","+229(BJ)", "+225(CI)", "+223(ML)", "+221(SN)", "+228(TG)"];
      this.mobilePayForm = this.fb.group({
        selectedProvider: [''], 
        mobilepaynumber: ['',[Validators.required]],
        countryCode: [this.countryCodes[0],[Validators.required]]
      });
  
      // Subscribe to changes in the selected provider dropdown
      this.mobilePayForm.get('selectedProvider').valueChanges.subscribe(selectedProviderId => {
        // Find the selected provider based on the ID
        const selectedProvider = this.mobilePayDetails.find(provider => provider._id === selectedProviderId);

        // Update the mobile pay number field with the selected provider's number
        this.mobilePayForm.get('mobilepaynumber').setValue(selectedProvider ? selectedProvider.pay_number : '');

        this.mobilePayForm.get('countryCode').setValue(selectedProvider ? selectedProvider.mobile_country_code : '');
      });
  }

  ngOnInit(): void {
    window.scroll({
      top: 0,
    });
    this.viweAppoinment();
  }

  viweAppoinment() {
    let prama = {
      appointment_id: this.appointment_id,
      portal_type:this.portal_type

    };
    this._PatientService.fourPortal_viewAppointment(prama).subscribe({
      next: async (res) => {
        let result = await this.coreService.decryptObjectData({ data: res });

        this.doctor_basic_info = await result?.data?.doctor_basic_info[0];
        (this.appointmentDetails = await result?.data?.result),
          (this.appointmentType = await result?.data?.result?.appointmentType);
        this.doctor_id = await result?.data?.result?.portalId?._id;
        this.patientDetails = await result?.data?.result?.patientDetails;
        this.patient_document = await result?.data.patient_document;
        this.averagerate = parseInt(result?.data.doctor_rating.average_rating);
        this.rating = result?.data.doctor_rating;
        this.counter(this.averagerate);
      },
      error: (err) => {
      },
    });
  }

  addpaymentTypeMode() {
    let param: any;

    
    // return;
    if (this.paymentType === "pre-payment") {
      param = {
        appointmentId: this.appointment_id,
        paymentType: this.paymentType,
        paymentMode: this.PaymentMode,
        portal_type:this.portal_type
      };
    }

    if (this.paymentType === "post-payment") {
      param = {
        appointmentId: this.appointment_id,
        paymentType: this.paymentType,
        portal_type:this.portal_type
      };
    }

    if (
      this.paymentType === "pre-payment" && this.PaymentMode === undefined
        ? true
        : false
    ) {
      this.toster.error("please select PaymentMode");
    } else {
      // return;
      this._PatientService.fourPortal_bookAppointment(param).subscribe({
        next: (res) => {
          let result = this.coreService.decryptObjectData({ data: res });
          this.closePopup();
          // return;
          if (result.status) {
            if (result.body?.paymentType == "pre-payment") {
              if(this.PaymentMode === 'stripe'){
              this.router.navigate(["/patient/homepage/paywithcard"], {               
                
                state: {
                  appointmentID:this.appointment_id,
                  order_id: this.appointmentDetails?.order_id,
                  consultationFees: this.appointmentDetails?.consultationFee,
                  order_type: 'portal_appointment'
                  
                },
              });
            }else {
              this.getProfileDetails();
              this.openVerticallyCenteredmobilePaydetails(this.mobilePaycontent);
            }
            }
            if (result.body?.paymentType == "post-payment") {
              this.router.navigate(["/patient/myappointment/list"]);
            }
          }
        },
        error: (err) => {
          console.log(err);
        },
      });
    }
  }

  counter(i: number) {
    return new Array(i);
  }

  selectPaymetTypeAndMode(data: any) {

    if (data.type) {
      this.paymentType = data.type;
      if(data.type == 'post-payment'){
        this.isDisable=false
      }else{
        this.isDisable=true
      }
    } else {
      this.PaymentMode = data.mode;
    }


  }

  createPayment() {
    this.addpaymentTypeMode();
  }

  closePopup() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }

  editAppointment() {
    this.router.navigate(["/patient/homepage/portal-book-appointment"], {
      queryParams: {
        appointmentId: this.appointment_id,
        portal_id: this.doctor_id,
        appointment_type: this.appointmentDetails.appointmentType,
        portal_type:this.portal_type
      },
    });
  }

  //  Cancel Appointment modal
  openVerticallyCenteredcancelappointment(cancel_appointment: any) {
    this.modalService.open(cancel_appointment, {
      centered: true,
      size: "md",
      windowClass: "cancel_appointments",
    });
  }

  //  Payment details modal
  openVerticallyCenteredpayment(payment: any) {
    this.modalService.open(payment, {
      centered: true,
      size: "md",
      windowClass: "payment_details",
      backdrop:'static'
    });
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

  isPrePayment: boolean = false;
  isPostPayment: boolean = false;

  cancelationNote() {
    let note = "";
    if (this.appointmentType === "ONLINE") {
      if (
        this.doctor_basic_info?.in_fee_management?.online?.cancelPolicy
          ?.comments
      ) {
        note =
          this.doctor_basic_info?.in_fee_management?.online?.cancelPolicy
            ?.comments;
      }

      this.isPrePayment =
        this.doctor_basic_info?.in_fee_management?.online?.pre_payment;
      this.isPostPayment =
        this.doctor_basic_info?.in_fee_management?.online?.post_payment;
    } else if (this.appointmentType === "HOME_VISIT") {
      if (
        this.doctor_basic_info?.in_fee_management?.home_visit?.cancelPolicy
          ?.comments
      ) {
        note =
          this.doctor_basic_info?.in_fee_management?.home_visit?.cancelPolicy
            ?.comments;
      }

      this.isPrePayment =
        this.doctor_basic_info?.in_fee_management?.home_visit?.pre_payment;
      this.isPostPayment =
        this.doctor_basic_info?.in_fee_management?.home_visit?.post_payment;
    } else {
      if (
        this.doctor_basic_info?.in_fee_management?.f2f?.cancelPolicy?.comments
      ) {
        note =
          this.doctor_basic_info?.in_fee_management?.f2f?.cancelPolicy
            ?.comments;
      }

      this.isPrePayment =
        this.doctor_basic_info?.in_fee_management?.f2f?.pre_payment;
      this.isPostPayment =
        this.doctor_basic_info?.in_fee_management?.f2f?.post_payment;
    }
    return note;
  }


  returnFormatedType(type: any) {
    let formatedString = "";

    if (type === "ONLINE") {
      formatedString = "Online";
    } else if (type === "HOME_VISIT") {
      formatedString = "Home Visit";
    } else {
      formatedString = "Hospital Visit";
    }

    return formatedString;
  }

  openVerticallyCenteredmobilePaydetails(mobilePaycontent: any){
    // this.planId=data._id;
    // this.plandata=data;
    this.modalService.open(mobilePaycontent, { centered: true,size: 'md' ,windowClass : "payment_details",backdrop:'static' });
  }

  getProfileDetails() {
    let params = {
      patient_id: this.patient_id,
    };
    this._PatientService.profileDetails(params).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if(response){
        let profile = response.body;
        this.mobilePayDetails= response?.body?.mobilePayDetails?.mobilePay;
      }
      // for(let data of this.mobilePayDetails ){
      //   this.mobilePaynumbers = data;
      // }
    });
  }

  get f() {
    return this.mobilePayForm.controls;
  }

  getDirection(direction : any) {
    if (!direction)
    {
      this.coreService.showError("","Location coordinates not found")
      return 
    }
    const lat = direction[1];
    const lng = direction[0];
    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(mapUrl, "_blank");
    
  }

  downloadpdf(data:any) {    
    window.location.href = data;
  }

}
