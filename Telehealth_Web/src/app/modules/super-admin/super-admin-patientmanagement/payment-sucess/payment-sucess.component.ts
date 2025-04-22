import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-payment-sucess',
  templateUrl: './payment-sucess.component.html',
  styleUrls: ['./payment-sucess.component.scss']
})
export class PaymentSucessComponent {
  patientId: string;
  @ViewChild("paymentcontent") paymentcontent: TemplateRef<any>;
  status: any;
  amount: any;
  message: any;
  payment_id: any;


  constructor( private modalService: NgbModal, private route: Router,
    private activateRoute: ActivatedRoute) {

    this.activateRoute.paramMap.subscribe(params => {
      this.patientId = params.get('id');
    });
  }
  ngOnInit(): void{

    this.activateRoute.queryParams.subscribe(params => {
      this.payment_id = params['id'];
      this.status = params['status'];
      this.amount = params['amount'];
      this.message = params['message'];
    });
  }

  routeTodetails(){
    this.route.navigate([`/super-admin/patient/details/${this.patientId}` ]);
    this.modalService.dismissAll();
  }

}
