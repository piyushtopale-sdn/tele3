import { Component, AfterViewInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

declare var ApplePaySession: any; // Declare Apple Pay API

@Component({
  selector: 'app-apple-pay',
  templateUrl: './apple-pay.component.html',
  styleUrls: ['./apple-pay.component.scss']
})
export class ApplePayComponent implements AfterViewInit {
  applePayAvailable: boolean = false;

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private translate: TranslateService
  ) {}


  ngAfterViewInit(): void {
    // this.loadApplePayScript();
  }

  loadApplePayScript(): void {
    const script = this.renderer.createElement('script');
    script.src = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
    script.onload = () => {
      console.log('Apple Pay SDK Loaded');
      alert('Apple Pay SDK has been successfully loaded!');
    };
    script.onerror = () => {
      console.error('Apple Pay SDK failed to load');
    };
    document.body.appendChild(script);
  }

  loadApplePayScript123() {
    const scriptUrl = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';

    if (!document.querySelector(`script[src="${scriptUrl}"]`)) {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => {
        console.log('✅ Apple Pay script loaded!');
        this.checkApplePayAvailability();
      };
      script.onerror = () => console.error('❌ Failed to load Apple Pay script.');
      document.body.appendChild(script);
    } else {
      console.log('ℹ️ Apple Pay script already loaded.');
      this.checkApplePayAvailability();
    }
  }

  // ✅ Check if Apple Pay is available
  checkApplePayAvailability() {
    if (window['ApplePaySession']) {
      this.applePayAvailable = true;
      console.log('✅ Apple Pay is available on this device!');
    } else {
      console.log('❌ Apple Pay is not available.');
    }
  }

  // ✅ Start Apple Pay Payment
  initiateApplePay() {
    if (window['ApplePaySession']) {
      alert('Apple Pay SDK has been successfully loaded!');
      return;
    }

    const paymentRequest = {
      countryCode: 'US',
      currencyCode: 'USD',
      supportedNetworks: ['visa', 'masterCard', 'amex'],
      merchantCapabilities: ['supports3DS'],
      total: {
        label: 'Your Store',
        amount: '10.00'
      }
    };

    const session = new ApplePaySession(3, paymentRequest);

    session.onvalidatemerchant = (event: any) => {
      console.log('🔍 Validate Merchant:', event);
      session.completeMerchantValidation({}); // Replace with real validation response
    };

    session.onpaymentauthorized = (event: any) => {
      console.log('💳 Payment Authorized:', event);
      session.completePayment({ status: 0 }); // Payment successful
    };

    session.begin();
  }

  // ✅ Navigate to Home Page
  goToHomePage() {
    const lang = this.translate.store.currentLang || 'en';
    this.router.navigate([`/test/home-${lang}`]);
  }
}
