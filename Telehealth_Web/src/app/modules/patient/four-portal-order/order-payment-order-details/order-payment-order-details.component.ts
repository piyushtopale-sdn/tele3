import { Component, OnInit,ViewEncapsulation, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StripeService, StripePaymentElementComponent } from 'ngx-stripe';
import { StripeElementsOptions, PaymentIntent } from '@stripe/stripe-js';
import { environment } from 'src/environments/environment';
import { CoreService } from 'src/app/shared/core.service';
import { PatientService } from '../../patient.service';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FourPortalService } from 'src/app/modules/four-portal/four-portal.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-order-payment-order-details',
  templateUrl: './order-payment-order-details.component.html',
  styleUrls: ['./order-payment-order-details.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OrderPaymentOrderDetailsComponent implements OnInit {
  profileData: any
  loginData: any
  orderDetails: any = {}
  totalAmount: any = 0
  orderNo: any = ''
  stripeTest: FormGroup;
  paying = false;
  elementsOptions: StripeElementsOptions = {
    locale: 'en'
  };

  @ViewChild(StripePaymentElementComponent)
  paymentElement: StripePaymentElementComponent;
  @ViewChild('paymentcontent', { static: false }) paymentcontent: any
  portal_type: any;

  constructor(
    private modalService: NgbModal,
    private coreService: CoreService,
    private stripeService: StripeService,
    private patientService: PatientService,
    private http: HttpClient,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private fourPortalService: FourPortalService,
    private route: ActivatedRoute,
    private router: Router


  ) { 
    this.stripeTest = this.fb.group({
      name: ['Angular v12', [Validators.required]],
      amount: [1109, [Validators.required, Validators.pattern(/\d+/)]],
      email:['',[Validators.email]]
    });

    this.orderDetails = this.coreService.getSessionStorage('OrderDetails');
    this.profileData = this.coreService.getLocalStorage('profileData');
    this.loginData = this.coreService.getLocalStorage('loginData');
    this.stripeTest.controls['name'].setValue(this.profileData.full_name)
    this.stripeTest.controls['email'].setValue(this.loginData.email)
  }

  // payment successfull modal
  openVerticallyCenteredpaymentcontent(paymentcontent: any) {
    this.modalService.open(paymentcontent, { centered: true, size: 'sm', windowClass: "payment_successfull" });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {      
      this.portal_type = params["portal_type"]
      this.getOrderDetails();
    });
  }

  private getPaymentIntent() {
    const paymentReq = {
      payment_method_types:'card',
      description: 'Test Order Payment',
      plan_name: `Test Order - ${this.orderNo}`,
      plan_price: Number(this.totalAmount),
      plan_type: 1,
      for_user: this.loginData._id,
      order_type: 'test_order',
      order_id: this.orderDetails._id,
      patient_name: (this.profileData.full_name)?this.profileData.full_name:'test name',
      patient_postal_code: (this.profileData?.in_location?.pincode)?this.profileData?.in_location?.pincode:'440030',
      patient_city: (this.profileData?.in_location?.city)?this.profileData?.in_location?.city:'test city',
      patient_state: (this.profileData?.in_location?.province)?this.profileData?.in_location?.province:'test city',
      patient_country: 'US',
      patient_address: (this.profileData?.in_location?.neighborhood)?this.profileData?.in_location?.neighborhood:'test address',
      payment_mode: 'Stripe',
      payment_type: 'Card',
      portal_type:this.portal_type
    }


    this.createPaymentIntent(paymentReq)
      .subscribe(res => {
        let pi = this.coreService.decryptContext(res);
        if(pi.status){
          this.elementsOptions.clientSecret = pi.body.client_secret;
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
      environment.apiUrl+``, //{}-labimagingdentaloptical/payment/create-payment-intent
       reqData,{
        headers: this.getHeader(localStorage.getItem('token')) 
      }
    );
  }

  public getOrderDetails(): void {
    const orderDetailRequest = {
      for_portal_user: this.orderDetails.for_portal_user,
      for_order_id: this.orderDetails._id,
      portal_type:this.portal_type
    };
    
    this.patientService.fetchOrderDetailsallPortal(orderDetailRequest).subscribe({
      next: (result1) => {
        
        let encryptedData = { data: result1 };
        let result = this.coreService.decryptObjectData(encryptedData);
        // this.coreService.showSuccess("", "Fetched order details successfully");
        if (result.status === true) {
          this.totalAmount = result.data.testBill.co_pay
          this.orderNo = result.data.orderData.order_id
          this.stripeTest.controls['amount'].setValue(result.data.testBill.co_pay)
          this.getPaymentIntent()
        }
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
    });
  }

  //Handle payment when clicking on pay now button
  pay() {
    if (this.stripeTest.valid) {
      this.paying = true;
      this.stripeService.confirmPayment({
        elements: this.paymentElement.elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: this.stripeTest.get('name').value,
              email:'',
              address: {
                city: this.profileData?.in_location?.city,
                country: this.profileData?.in_location?.country,
                line1: this.profileData?.in_location?.neighborhood,
                line2: '',
                postal_code: this.profileData?.in_location?.pincode,
                state: this.profileData?.in_location?.province
              }
            }
          }
        },
        redirect: 'if_required'
      }).subscribe(result => {
        this.paying = false;
        if (result.error) {
          this.toastr.error("Fill required fields")
        } else {
          if (result.paymentIntent.status === 'succeeded') {
            this.fourPortalService.confirmOrderFourPortal(this.orderDetails).subscribe({
              next: (result1) => {
                let encryptedData = { data: result1 };
                let result = this.coreService.decryptObjectData(encryptedData);
                if (result.status === true) {
                  this.openVerticallyCenteredpaymentcontent(this.paymentcontent);
                }
              },
              error: (err: ErrorEvent) => {
                this.coreService.showError("", err.message);
              },
            });
          }
        }
      });
    } else {
    }
  }

  gotoOrderList() {
    this.modalService.dismissAll();

    if (this.portal_type === "Paramedical-Professions") {
      this.router.navigate(['/patient/paramedical-profession-order-request']);
    } else if (this.portal_type === "Dental") {
      this.router.navigate(['/patient/dental-order-request']);
    } else if (this.portal_type === "Optical") {
      this.router.navigate(['/patient/optical-order-request']);
    } else if (this.portal_type === "Laboratory-Imaging") {
      this.router.navigate(['/patient/imaging-order-request']);
    }
  }
}
