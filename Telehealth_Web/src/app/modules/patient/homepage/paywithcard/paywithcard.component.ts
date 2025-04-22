import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { PatientService } from '../../patient.service';
import { CoreService } from 'src/app/shared/core.service';
import { IndiviualDoctorService } from 'src/app/modules/individual-doctor/indiviual-doctor.service';
import { StripeService, StripePaymentElementComponent } from 'ngx-stripe';
import { StripeElementsOptions, PaymentIntent } from '@stripe/stripe-js';
import { Router, ActivatedRoute } from "@angular/router";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormArray,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Location } from '@angular/common';

export interface ILocationData {
  order_id:string;
  consultationFees:string;
  appointmentID:string;
  order_type:string;


}
@Component({
  selector: 'app-paywithcard',
  templateUrl: './paywithcard.component.html',
  styleUrls: ['./paywithcard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PaywithcardComponent implements OnInit {
  appointmentDetails: any
  cordDetails: FormGroup
  profileData: any
  loginData: any
  locationDetails: any
  plan_price: any
  appointment_id: any
  consultationFees:any;
  elementsOptions: StripeElementsOptions = {
    locale: 'en'
  };

  @ViewChild(StripePaymentElementComponent)
  paymentElement: StripePaymentElementComponent;
  @ViewChild('paymentcontent', { static: false }) paymentcontent: any
  app_id: any;
  order_type: string;
  portal_type: string;




  constructor(private modalService: NgbModal,
    private _PatientService: PatientService,
    private _indiviualDoctorService: IndiviualDoctorService,
    private fb: FormBuilder,
    private stripeService: StripeService,
    private route: ActivatedRoute,
    private coreService: CoreService,
    private location : Location,
    private router: Router) {
    // this.route.queryParams.subscribe(async(res) => {
    //   this.appointment_id = await res["appointment_id"]
    //   this.plan_price = res["consultationFee"]
    // })

    this.cordDetails = this.fb.group({
      name: ["", [Validators.required]],
      email: ["", [Validators.email]],

    })
    this.profileData = this.coreService.getLocalStorage('profileData');
    this.loginData = this.coreService.getLocalStorage('loginData');


    this.cordDetails.patchValue({
      name: this.profileData?.first_name + this.profileData?.last_name,
      email: this.loginData?.email,
      country: this.profileData?.locationinfos[0].country


    })
  }
  ngOnInit(): void {
    const locationInfo = this.location.getState() as ILocationData;
    this.plan_price = locationInfo.consultationFees;
    this.appointment_id = locationInfo.order_id
    this.app_id = locationInfo.appointmentID,
    this.order_type = locationInfo.order_type,
    this.profileDetails()
    
    if(locationInfo.consultationFees == undefined){
      this.router.navigate(
        ["/patient/homepage"]
      );
    }

  }

  ngAfterViewInit(){
    //this.showWarningMsg()
  }

  showWarningMsg() {
    throw new Error('An error has occurred');
  }


  createPaymentIntent() {
    // return;
        let param = {
      "order_type": this.order_type,
      "payment_method_types": "card",
      "description": "PAYMENT APPOINTMENT",
      // "plan_name": "Plan A",
      "plan_price": this.plan_price,
      // "plan_type": "monthly",
      "for_user": this.loginData._id,
      "patient_name": this.profileData.first_name + " " + this.profileData.last_name,
      // "patient_postal_code": this.locationDetails?.pincode,
      // "patient_city": this.locationDetails?.cityName.name,
      // "patient_state": this.locationDetails?.provinceName.name,
      // "patient_country": 'US',
      // "patient_country": this.locationDetails?.countryName.name,
      // "patient_address": this.locationDetails?.address,

      "patient_postal_code":(this.profileData?.locationinfos[0]?.pincode)?this.profileData?.locationinfos[0]?.pincode:'440030',
      "patient_city": (this.profileData?.locationinfos[0]?.city)?this.profileData?.locationinfos[0]?.city:'test city',
      "patient_state":(this.profileData?.locationinfos[0]?.province)?this.profileData?.locationinfos[0]?.province:'test city',
      "patient_country":this.profileData?.locationinfos[0]?.country?.country_iso_code?this.profileData?.locationinfos[0]?.country?.country_iso_code:'BF',
      "patient_address": (this.profileData?.locationinfos[0]?.address)?this.profileData?.locationinfos[0]?.address:'test address',
      "order_id": this.appointment_id,
      "payment_mode": "Stripe",
      "payment_type": "pre-payment",
    }
    // return
    this._PatientService.createPayment(param).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res })

        this.elementsOptions.clientSecret = result?.body?.client_secret

      },
      error: (err) => {

        console.log(err)
      }
    })
  }

  profileDetails() {
    const param={
      patient_id : this.loginData._id
    }

    this._PatientService.profileDetails(param).subscribe({
      next: async(res) => {
        let result = await this.coreService.decryptObjectData({ data: res });
        
        if(result.status){
          let body ={
            location:result?.body?.locationDetails
          }
          this._PatientService.getLocationInfoWithNames(body).subscribe({
            next:async(res)=>{
              let locRes = await this.coreService.decryptContext(res);
              this.locationDetails = await locRes?.body
        
              this.createPaymentIntent();
            },
            error:(err)=>{
              console.log(err.message);
               
            }
          })
        

        
        }
        
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  Pay() {

    this.stripeService.confirmPayment({
      elements: this.paymentElement.elements,
      confirmParams: {
        payment_method_data: {
          billing_details: {
            name: this.cordDetails.value.name,
            email: this.cordDetails.value.email,
            address: {
              city: this.profileData?.locationinfos[0]?.city,
              country: this.profileData?.locationinfos[0]?.country?.countryname,
              line1: this.profileData?.locationinfos[0]?.neighborhood,
              line2: '',
              postal_code: this.profileData?.locationinfos[0]?.pincode,
              state: this.profileData?.locationinfos[0]?.province
            }
            // address: {
            //   city: this.locationDetails?.cityName.name,
            //   country: "US",
            //   line1: this.profileData?.in_location?.neighborhood,
            //   line2: '',
            //   postal_code: this.profileData?.in_location?.pincode,
            //   state: this.profileData?.in_location?.province
            // }
          }
        }
      },
      redirect: 'if_required'

    }).subscribe({
      next: (res) => {

        if (res.error) {
          // Show error to your customer (e.g., insufficient funds)
          
          // alert({ success: false, error: res.error.message });
        } else {

          // The payment has been processed!
          if (res.paymentIntent.status === 'succeeded') {
            // Show a success message to your customer
            // alert({ success: true });

            this.openVerticallyCenteredpaymentcontent(this.paymentcontent);
          }
        }

      },
      error: (res) => {
        console.log(res)
      }
    })

  }

  routeBack(){
    this.router.navigate([`patient/homepage/retailreviewappointment`],{queryParams:{appointment_id:this.app_id}})
  }


  //  Edit category service modal
  openVerticallyCenteredpaymentcontent(paymentcontent: any) {

    this.modalService.open(paymentcontent, { centered: true, size: 'sm', windowClass: "payment_successfull" });
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





}
