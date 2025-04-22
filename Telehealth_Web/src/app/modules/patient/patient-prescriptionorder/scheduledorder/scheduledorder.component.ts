
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
import { IDocumentMetaDataResponse, IMedicineConfirmResponse, IMedicineUpdateResponse, IOrderCancelResponse, IOrderConfimRequest, IOrderDetailsRequest, IOrderDetailsResponse, IOrderUpdateRequest, ISignedUrlRequest } from '../neworder/neworder.type';

@Component({
  selector: 'app-scheduledorder',
  templateUrl: './scheduledorder.component.html',
  styleUrls: ['./scheduledorder.component.scss'],
  encapsulation:ViewEncapsulation.None
})

export class ScheduledorderComponent implements OnInit {
  @ViewChild("approved") approved: any;

  order_id: string = "";
  pharmacy_id: string = "";
  patient_details: any;
  health_plan_details: any;
  orderDetails: IOrderDetailsResponse = null;
  insuranceDetails: any;
  selectedPaymentMode: string = "pre";
  displayedColumns: string[] = ['medicinename', 'packorunit', 'frequency', 'duration','medicineunitcost','totalcost','available'];
  dataSource: MatTableDataSource<AbstractControl>;
  public orderMedicine = {
    medicine_details: [],
    total_cost: "",
    copay: "",
    insurance_paid: "",
  };
  prescriptionUrl: string = "";
  prescriptionSignedUrl: string = "";
  isPrePayment: Boolean = true;
  availableMedicineList: string[] = [];
  @ViewChild("paymentdetailscontent") paymentdetailscontent: any;
  subscriberdetails: any;
  pharmacyProfile: any;
  profileData: any;
  subscriber_id: any;
  ConfirmOrder: any;

  constructor(
    private modalService: NgbModal,
    private patientService: PatientService,
    private pharmacyService: PharmacyService,
    private coreService: CoreService,
    private router: Router,
    private route: ActivatedRoute
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
      this.pharmacy_id = params["pharmacyId"];
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
    const orderDetailRequest: IOrderDetailsRequest = {
      for_portal_user: this.pharmacy_id,
      for_order_id: this.order_id,
    };
    this.patientService.getOrderDetails(orderDetailRequest).subscribe({
      next: (result1: IResponse<IOrderDetailsResponse>) => {
        let encryptedData = { data: result1 };
        let result = this.coreService.decryptObjectData(encryptedData);
        if (result.status === true) {
          this.orderDetails = result.data;
          this.profileData=result?.data?.pharmacyDetails
          this.pharmacyProfile=result?.data
          this.getPatientDetails()
          this.subscriber_id = result?.data?.orderData?.subscriber_id
this.ConfirmOrder=result?.data?.orderData?.order_schedule_confirm
          if (this.orderDetails.medicineBill.prescription_url) {
            // this.documentMetaDataURL();
            this.prescriptionSignedUrl=this.orderDetails.medicineBill.prescription_url;

          }
          result.data.medicineDetails.forEach((element) => {
            
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
            this.availableMedicineList.push(available);
            this.orderMedicine.medicine_details.push(
              newRow
            );
          });
          this.orderMedicine
            ["total_cost"]
             = (result.data.medicineBill.total_medicine_cost || "");
          this.orderMedicine
            ["copay"]
             = (result.data.medicineBill.co_pay || "");
          this.orderMedicine
            ["insurance_paid"]
            = (result.data.medicineBill.insurance_paid || "");
          this.dataSource = new MatTableDataSource(
            this.orderMedicine["medicine_details"]
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

  medicineAvailabilityChange(e: { value: string }, i: number) {
    this.availableMedicineList[i] = e.value;
  }

  documentMetaDataURL(): void {
    const docRequest: IUniqueId = {
      id: this.orderDetails.medicineBill.prescription_url,
    };
    this.patientService.getDocumentMetadata(docRequest).subscribe({
      next: (result: IResponse<IDocumentMetaDataResponse>) => {
        // this.coreService.showSuccess("", "Fetched order details successfully");
        if (result.status === true) {
          this.prescriptionUrl = result.data.url;
          this.generateSignedUrl();
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

  generateSignedUrl() {
    const docRequest: ISignedUrlRequest = {
      url: this.prescriptionUrl,
    };
    this.patientService.signedUrl(docRequest).subscribe({
      next: (result: IResponse<string>) => {
        // this.coreService.showSuccess("", "Fetched order details successfully");
        if (result.status === true) {
          this.prescriptionSignedUrl = result.data;
        }
      },
      error: (err: ErrorEvent) => {
        // this.coreService.showError("", err.message);
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
    });
  }

  patientOrderConfirm() {
    const orderRequest: IOrderConfimRequest = {
      _id: this.orderDetails.orderData._id,
      patient_details: {
        ...this.orderDetails.orderData.patient_details,
        order_confirmation: true
      },
      payment_type: this.selectedPaymentMode,
      for_portal_user: this.pharmacy_id
    };
    if (this.selectedPaymentMode === 'post') {
      this.patientService.confirmOrderDetails(orderRequest).subscribe({
        next: (result1: IResponse<IMedicineConfirmResponse>) => {
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
      this.router.navigate(['/patient/presciptionorder/payment']);
    }
  }

  gotoOrderList() {
    this.modalService.dismissAll();
  
  }

  cancelOrder() {
    const orderRequest: IOrderConfimRequest = {
      _id: this.orderDetails.orderData._id,
      status: "cancelled",
      cancelled_by: "patient",
      for_portal_user: this.pharmacy_id
    };
    this.patientService.cancelOrderDetails(orderRequest).subscribe({
      next: (result: IResponse<IOrderCancelResponse>) => {
        // this.coreService.showSuccess("", "order details confirmed successfully");
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
    _id:this.order_id
  }
    this.pharmacyService.updateConfirmSchedule(reqData)
    .subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);
      if (response.status == true) {
        // this.getOrderDetails()
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
