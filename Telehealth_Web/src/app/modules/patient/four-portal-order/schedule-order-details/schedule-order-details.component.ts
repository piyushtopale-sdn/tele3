import { Component, OnInit,ViewChild,ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { IUniqueId } from 'src/app/modules/patient/homepage/retailpharmacy/retailpharmacy.type';
import { PharmacyService } from 'src/app/modules/pharmacy/pharmacy.service';
import { IResponse } from 'src/app/shared/classes/api-response';
import { CoreService } from 'src/app/shared/core.service';
import { PatientService } from '../../patient.service';
import { FourPortalService } from 'src/app/modules/four-portal/four-portal.service';

@Component({
  selector: 'app-schedule-order-details',
  templateUrl: './schedule-order-details.component.html',
  styleUrls: ['./schedule-order-details.component.scss'],
  encapsulation:ViewEncapsulation.None
})

export class ScheduleOrderDetailsComponent implements OnInit {
  @ViewChild("approved") approved: any;

  order_id: string = "";
  patient_details: any;
  health_plan_details: any;
  orderDetails = null;
  insuranceDetails: any;
  selectedPaymentMode: string = "pre";
  displayedColumns: string[] = ['medicinename', 'packorunit', 'frequency', 'duration','medicineunitcost','totalcost','available'];
  dataSource: MatTableDataSource<AbstractControl>;
  public orderTest = {
    test_details: [],
    total_cost: "",
    copay: "",
    insurance_paid: "",
  };
  prescriptionUrl: string = "";
  prescriptionSignedUrl: string = "";
  isPrePayment: Boolean = true;
  availableTestList: string[] = [];
  @ViewChild("paymentdetailscontent") paymentdetailscontent: any;
  subscriberdetails: any;
  profileData: any;
  subscriber_id: any;
  ConfirmOrder: any;
  portal_id: any;
  portal_type: any;
  portal_Profile: any;

  constructor(
    private modalService: NgbModal,
    private patientService: PatientService,
    private pharmacyService: PharmacyService,
    private coreService: CoreService,
    private router: Router,
    private route: ActivatedRoute,
    private fourPortalService: FourPortalService
  ) {}

  //  Payment details modal
  openVerticallyCenteredpaymentdetails(paymentdetailscontent: any) {
    this.modalService.open(paymentdetailscontent, { centered: true,size: 'md' ,windowClass : "payment_details" });
  }

  handlePaymentType(value: any) {
    if(value === 'pre') this.isPrePayment = true
    if(value === 'post') this.isPrePayment = false
    
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.order_id = params["orderId"];
      this.portal_id = params["portal_id"];
      this.portal_type = params["portal_type"]
      this.getOrderDetails();
    });
  }

  getPatientDetails() {
    const insuranceNo = this.orderDetails.orderData.insurance_no
    const patientID = this.orderDetails.orderData.patient_details.user_id
    const subscriber_id = this.orderDetails.orderData.subscriber_id

    this.pharmacyService.patientProfile(patientID, insuranceNo,subscriber_id).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.patient_details = response?.body.profileData;
        this.health_plan_details = response?.body.health_plan_details;
        this.subscriberdetails = response?.body.health_plan_details?.resultData;
        this.checkInsuranceExpiry()
      }
    });
  }

  checkInsuranceExpiry() {
    let reqData = {
      insurance_id:
        this.patient_details?.in_insurance?.primary_insured?.insurance_id,
      policy_id: this.patient_details?.in_insurance?.primary_insured?.policy_id,
      card_id: this.patient_details?.in_insurance?.primary_insured?.card_id,
      employee_id:
        this.patient_details?.in_insurance?.primary_insured?.employee_id,
        subscriber_id:
        this.orderDetails?.orderData?.subscriber_id
    };
    this.pharmacyService.checkSubscriptionExpiry(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.insuranceDetails = response.body;
    });
  }


  public getOrderDetails(): void {
    const orderDetailRequest = {
      for_portal_user: this.portal_id,
      for_order_id: this.order_id,
      portal_type:this.portal_type
    };
    this.patientService.fetchOrderDetailsallPortal(orderDetailRequest).subscribe({
      next: (result1) => {
        let encryptedData = { data: result1 };
        let result = this.coreService.decryptObjectData(encryptedData);
        if (result.status === true) {
          this.orderDetails = result.data;
          this.profileData = result?.data?.portal_Details
          this.portal_Profile = result?.data?.portal_Profile
          this.getPatientDetails()
          this.subscriber_id = result?.data?.orderData?.subscriber_id
          this.ConfirmOrder=result?.data?.orderData?.order_schedule_confirm
          if (this.orderDetails.testBill.prescription_url) {
            this.prescriptionSignedUrl=this.orderDetails.testBill.prescription_url;
          }
          result.data.testDetails.forEach((element) => {
            
            const available = element.available ? "yes" : "no";
            const newRow = {
              name: element.name,
              prescribed: element.quantity_data.prescribed,
              frequency: element.frequency,
              duration: element.duration,
              priceperunit: element.price_per_unit || "",
              totalcost: element.total_cost || "",
              available
            };
            this.availableTestList.push(available);
            this.orderTest.test_details.push(
              newRow
            );
          });
          this.orderTest
            ["total_cost"]
             = (result.data.testBill.total_test_cost || "");
          this.orderTest
            ["copay"]
             = (result.data.testBill.co_pay || "");
          this.orderTest
            ["insurance_paid"]
            = (result.data.testBill.insurance_paid || "");
          this.dataSource = new MatTableDataSource(
            this.orderTest["test_details"]
          );
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

  testAvailabilityChange(e: { value: string }, i: number) {
    this.availableTestList[i] = e.value;
  }
 

  patientOrderConfirm() {
    const orderRequest = {
      _id: this.orderDetails.orderData._id,
      patient_details: {
        ...this.orderDetails.orderData.patient_details,
        order_confirmation: true
      },
      payment_type: this.selectedPaymentMode,
      for_portal_user: this.portal_id,
      portal_type:this.portal_type
    };
    if (this.selectedPaymentMode === 'post') {
      this.fourPortalService.confirmOrderFourPortal(orderRequest).subscribe({
        next: (result1) => {
          let encryptedData = { data: result1 };
        let result = this.coreService.decryptObjectData(encryptedData);
          if (result.status === true) {
            this.gotoOrderList();
          }
        },
        error: (err: ErrorEvent) => {
          this.coreService.showError("", err.message);
        },
      });
    } else {
      this.modalService.dismissAll();
      this.coreService.setSessionStorage(orderRequest, 'OrderDetails')
      this.router.navigate(['/patient/order-payment-order-request'],{
        queryParams: { portal_type: this.portal_type },
      });
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

  cancelOrder() {
    const orderRequest = {
      _id: this.orderDetails.orderData._id,
      status: "cancelled",
      cancelled_by: "patient",
      for_portal_user: this.portal_id,
      portal_type:this.portal_type
    };
    this.fourPortalService.cancelOrderFourPortal(orderRequest).subscribe({
      next: (result1) => {
        let result = this.coreService.decryptObjectData({ data: result1 });

        if (result.status === true) {
          this.gotoOrderList();
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





  patientScheduleConfirm(){
  let reqData={
    _id:this.order_id,
    portal_type:this.portal_type
  }
    this.fourPortalService.scheduleConfirmOrderFourPortal(reqData)
    .subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);
      
      if (response.status == true) {
        this.openVerticallyCenteredapproved(this.approved);

      } else {
      }
    });
}
openVerticallyCenteredapproved(approved: any) {
  this.modalService.open(approved, {
    centered: true,
    size: "md",
    windowClass: "approved_data",
  });
}
}
