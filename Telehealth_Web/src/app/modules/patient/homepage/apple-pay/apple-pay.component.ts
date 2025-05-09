import { Component, OnInit, AfterViewInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from "@angular/router";
 
declare let ApplePaySession: any;
 
@Component({
  selector: 'app-apple-pay',
  templateUrl: './apple-pay.component.html',
  styleUrls: ['./apple-pay.component.scss']
})
export class ApplePayComponent implements OnInit, AfterViewInit {
  baseUrl = environment.apiUrl;
  subscriptionPlanId: any = "";
  forUser: any = "";
  planPrice: any = "";
  discountedAmount: any = "";
  vatCharges: any = "";
  planDuration: any = "";
  discountCoupon: any = "";
  email: any = "";
  amount: any = "";

  constructor(
    private readonly activatedRoute: ActivatedRoute,
  ) {
    this.activatedRoute.queryParams.subscribe((values: any) => {
      this.subscriptionPlanId = values?.subscriptionPlanId;
      this.forUser = values?.forUser;
      this.planPrice = values?.planPrice;
      this.discountedAmount = values?.discountedAmount;
      this.vatCharges = values?.vatCharges;
      this.planDuration = values?.planDuration;
      this.discountCoupon = values?.discountCoupon;
      this.email = values?.email;
      this.amount = values?.amount;
    });
  }

  ngOnInit(): void {
    if (typeof ApplePaySession !== 'undefined' && ApplePaySession.canMakePayments()) {
      console.log('Apple Pay is available on this device/browser.');
    } else {
      console.warn('Apple Pay is not available on this device/browser.');
    }
  }
 
  ngAfterViewInit(): void {
    const applePayBtn = document.getElementById('apple-pay-button');
    if (applePayBtn) {
      const appleBtn = document.createElement('apple-pay-button');
      appleBtn.setAttribute('buttonstyle', 'black');
      appleBtn.setAttribute('type', 'buy');
      appleBtn.setAttribute('locale', 'en-US');
      applePayBtn.appendChild(appleBtn);
      appleBtn.addEventListener('click', () => this.beginApplePaySession());
    }
  }
 
  beginApplePaySession(): void {
    const paymentRequest = {
      countryCode: 'SA',
      currencyCode: 'SAR',
      supportedNetworks: ['visa', 'mada', 'masterCard'],
      merchantCapabilities: ['supports3DS'],
      total: {
        label: 'test_p Store',
        amount:  this.amount,
      }
    };
 
    const session = new ApplePaySession(3, paymentRequest);
 
    session.onvalidatemerchant = async (event: any) => {
      try {
        const merchantSession = await this.validateMerchant(event.validationURL);
        console.log('Merchant validated:');
        session.completeMerchantValidation(merchantSession);
      } catch (error) {
        console.error('Merchant validation failed:', error);
        session.abort();
      }
    };
 
    session.onpaymentauthorized = async (event: any) => {
      const payment = event.payment; 
      try {
        const result = await this.processApplePayPayment(payment.token);
 
        const response = result || {};
        const responseMsg = response?.response_message;
        const tokenName = response?.token_name;
        const agreementId = response?.agreement_id;
 
        if (responseMsg === 'Success') {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
 
          document.getElementById('paymentDiv')?.style.setProperty('display', 'none');
          document.getElementById('resultDiv')?.style.setProperty('display', 'block');
          document.getElementById('resultDiv2')?.style.setProperty('display', 'block');
          document.getElementById('resultDiv3')?.style.setProperty('display', 'block');
 
          if (tokenName) {
            document.getElementById('resultDiv2')!.innerText = 'Token is: ' + tokenName;
          }
          if (agreementId) {
            document.getElementById('resultDiv3')!.innerText = 'Agreement is: ' + agreementId;
          }
        } else {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          document.getElementById('resultDivFail')?.style.setProperty('display', 'block');
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        document.getElementById('resultDivFail')?.style.setProperty('display', 'block');
      }
 
    };
 
 
    session.begin();
  }
 
  async validateMerchant(validationURL: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/patient-service/payment/validate-merchant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validationURL }),
    });
 
    if (!response) {
      throw new Error('Merchant validation failed.');
    }
 
    const data = await response.json();
 
    return data.body;
  }
 
  async processApplePayPayment(token: object): Promise<any> {
    const response = await fetch(`${this.baseUrl}/patient-service/payment/process-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        subscriptionPlanId: this.subscriptionPlanId,
        forUser: this.forUser,
        planPrice: this.planPrice,
        discountedAmount: this.discountedAmount,
        vatCharges: this.vatCharges,
        planDuration: this.planDuration,
        discountCoupon: this.discountCoupon,
        email: this.email,
        amount: this.amount
      })
    });
 
    if (!response) {
      throw new Error(`Payment process failed`);
    }
 
    const data = await response.json();
 
    return data.body;
  }
}
 