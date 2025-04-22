import { Component, OnInit,ViewChild,ViewEncapsulation } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { StripeService, StripePaymentElementComponent } from 'ngx-stripe';
import { StripeElementsOptions, PaymentIntent } from '@stripe/stripe-js';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CoreService } from 'src/app/shared/core.service';
import { ActivatedRoute } from '@angular/router';
import { PatientService } from '../../patient.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxUiLoaderService } from 'ngx-ui-loader';
@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class PaymentComponent implements OnInit {

  currentId: any;
  planName: string;
  planCost: number;
  planDuration: string;
  paymentHandler: any = null;
  paying = false;
  // customStripeForm:FormGroup;
  localStorageUserData: any;
  localStorageAdminData: any;
  stripeTest: FormGroup;

  elementsOptions: StripeElementsOptions = {
    locale: 'en'
  };
  @ViewChild(StripePaymentElementComponent)
  paymentElement: StripePaymentElementComponent;
  @ViewChild('paymentcontent', { static: false }) paymentcontent: any

  constructor(
    private modalService: NgbModal,
    private fb:FormBuilder,
    private _coreService: CoreService,
    private activeRoute: ActivatedRoute,
    private _patientService:PatientService,
    private http:HttpClient,
    private loader: NgxUiLoaderService,
    private stripeService: StripeService) {

    this.stripeTest = this.fb.group({
      name: ['Angular v12', [Validators.required]],
      amount: [1109, [Validators.required, Validators.pattern(/\d+/)]],
      email: ['', [Validators.email]]
    });
    this.localStorageUserData = this._coreService.getLocalStorage('loginData');
    this.localStorageAdminData = this._coreService.getLocalStorage('profileData');
    this.currentId = this.activeRoute.snapshot.params['id'];

    this.stripeTest.patchValue({
      name: this.localStorageAdminData.full_name ? this.localStorageAdminData.full_name : 'dsdsds',
      email: this.localStorageUserData.email,
      country: this.localStorageAdminData?.locationinfos[0].country
 
    })
 

  }

  ngOnInit(): void {


    const paramData = {
      id: this.currentId
    }

    this._patientService.getPatientSubscriptionPlanDetails(paramData).subscribe({
      next: (res) => {
        let paymentReq = {};
        let result = this._coreService.decryptObjectData({data:res});

        this.planName = result?.body?.plan_name;
        this.planCost = result?.body?.plan_price;
        this.planDuration = result?.body?.plan_duration?.name;

     paymentReq = {
          payment_method_types:'card',
          description: 'Patient Plan Subscription',
          plan_name: this.planName,
          services:result?.body?.services,
          plan_price: Number(this.planCost),
          plan_type: result.body.plan_duration.value,
          for_user: this.localStorageUserData._id,
          subscriber_name: (this.localStorageAdminData.full_name)?this.localStorageAdminData.full_name:'test name',
          subscriber_postal_code: (this.localStorageAdminData?.locationinfos[0]?.pincode)?this.localStorageAdminData?.locationinfos[0]?.pincode:'440030',
          subscriber_city: (this.localStorageAdminData?.locationinfos[0]?.city)?this.localStorageAdminData?.locationinfos[0]?.city:'test city',
          subscriber_state: (this.localStorageAdminData?.locationinfos[0]?.province)?this.localStorageAdminData?.locationinfos[0]?.province:'test city',
          // subscriber_country: 'IN',
          subscriber_country: this.localStorageAdminData?.locationinfos[0]?.country?.country_iso_code?this.localStorageAdminData?.locationinfos[0]?.country?.country_iso_code:'BF',
          subscriber_address: (this.localStorageAdminData?.locationinfos[0]?.address)?this.localStorageAdminData?.locationinfos[0]?.address:'test address',
          payment_mode: 'Stripe',
          payment_type: 'Card',
          order_type: 'subscription'
        }

        this.createPaymentIntent(paymentReq)
          .subscribe(res => {
            let pi = this._coreService.decryptObjectData({data:res});

            if(pi.status){
              this.elementsOptions.clientSecret = pi.body.client_secret;
            }

          });

      },
      error: (error) => {
        console.log('error', error);

      },
      complete: () => {

      }
    });

  }

  getHeader(token: any,deviceId:any='') {
    
    const httpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      "role": "patient",
      "Authorization": `Bearer ${token}`,
      "uuid":deviceId
    });
    return httpHeaders;
  }

  private createPaymentIntent(reqData: any): Observable<PaymentIntent> {

    return this.http.post<PaymentIntent>(
      environment.apiUrl+`/patient-service/payment/create-payment-intent`,
       reqData,{
        headers: this.getHeader(localStorage.getItem('token')) 
      }
    );
  }

  pay() {
    if (this.stripeTest.valid) {
      this.loader.start();
      this.paying = true;
      this.stripeService.confirmPayment({
        elements: this.paymentElement.elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: this.stripeTest.get('name').value,
              email:this.stripeTest.get('email').value,
              address: {
                city: this.localStorageAdminData?.locationinfos[0]?.city,
                country: this.localStorageAdminData?.locationinfos[0]?.country?.countryname,
                line1: this.localStorageAdminData?.locationinfos[0]?.neighborhood,
                line2: '',
                postal_code: this.localStorageAdminData?.locationinfos[0]?.pincode,
                state: this.localStorageAdminData?.locationinfos[0]?.province
              }
            }
          }
        },
        redirect: 'if_required'
      }).subscribe(result => {
        this.paying = false;
        if (result.error) {
          this.loader.stop();
          // Show error to your customer (e.g., insufficient funds)
          this._coreService.showError(result.error.message,"")
          // alert({ success: false, error: result.error.message });
        } else {
          // The payment has been processed!
          if (result.paymentIntent.status === 'succeeded') {
            this.loader.stop();
            // Show a success message to your customer
            // alert({ success: true });
            this.openVerticallyCenteredpaymentcontent(this.paymentcontent);
          }
        }
      });
    } else {
      this.loader.stop();
    }
  }

  //  Edit category service modal
  openVerticallyCenteredpaymentcontent(paymentcontent: any) {
    this.modalService.open(paymentcontent, { centered: true,size: 'sm',windowClass : "payment_successfull" });
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
