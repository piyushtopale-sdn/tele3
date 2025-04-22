import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from "src/environments/environment";

@Component({
  selector: 'app-moyasar-payment',
  templateUrl: './moyasar-payment.component.html',
  styleUrls: ['./moyasar-payment.component.scss']
})

export class MoyasarPaymentComponent {
  @ViewChild('paymentcontent', { static: false }) paymentcontent: any
  patientId: string;

  baseurl = environment.webUrl;
  constructor(private renderer: Renderer2, private host: ElementRef,private modalService: NgbModal,private route: Router,
    private activateRoute: ActivatedRoute) {
    this.activateRoute.paramMap.subscribe(params => {
      this.patientId = params.get('id');
    });

  }

  ngAfterViewInit(): void {
    const container = this.renderer.createElement('div');
    this.renderer.setAttribute(container, 'id', 'moyasar-payment');
    this.renderer.appendChild(this.host.nativeElement, container);

    if (window['Moyasar']) {
      this.initializeMoyasar();
    } else {
      console.error('Moyasar library is not loaded.');
    }
  
  }

  initializeMoyasar(): void {
    window['Moyasar'].init({
      element: '#moyasar-payment',
      amount: 100,
      currency: 'SAR',
      description: 'Trail Plan',
      publishable_api_key: '',
      methods: ['creditcard'],
      callback_url: `${this.baseurl}/super-admin/patient/payment-success/${this.patientId}`,

      on_complete: (payment: any) => {
        console.log('Payment successful:', payment);
      },
      on_failure: (error: any) => {
        console.error('Payment failed:', error);
      },
    });
  }

}
