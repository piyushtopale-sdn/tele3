import { Component, OnInit,ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { IUniqueId } from 'src/app/modules/patient/homepage/retailpharmacy/retailpharmacy.type';
import { PharmacyService } from 'src/app/modules/pharmacy/pharmacy.service';
import { IResponse } from 'src/app/shared/classes/api-response';
import { CoreService } from 'src/app/shared/core.service';
import { PatientService } from '../../patient.service';
import { IDocumentMetaDataResponse, IMedicineUpdateResponse, IOrderDetailsRequest, IOrderDetailsResponse, IOrderUpdateRequest, ISignedUrlRequest } from '../neworder/neworder.type';

@Component({
  selector: 'app-cancelledorder',
  templateUrl: './cancelledorder.component.html',
  styleUrls: ['./cancelledorder.component.scss']
})
export class CancelledorderComponent implements OnInit {
  pharmacy_id: string = "";
  order_id: string = "";
  patient_details: any;
  insuranceDetails: any
  health_plan_details: any;
  orderDetails: IOrderDetailsResponse = null;
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
  availableMedicineList: string[] = [];
  subscriberdetails: any;
  pharmacyProfile: any;
  subscriber_id: any;
  profileData: any;

  constructor(
    private modalService: NgbModal,
    private patientService: PatientService,
    private pharmacyService: PharmacyService,
    private coreService: CoreService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.order_id = params["orderId"];
      this.pharmacy_id = params["pharmacyId"];
      this.getOrderDetails();
    });
  }

  getPatientDetails(patient_id: string) {
    const insuranceNo = this.orderDetails.orderData.insurance_no
    const subscriber_id = this.orderDetails.orderData.subscriber_id

    this.pharmacyService.patientProfile(patient_id, insuranceNo,subscriber_id).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.patient_details = response?.body.profileData;
        this.health_plan_details = response?.body.health_plan_details;
        this.subscriberdetails = response?.body.health_plan_details?.resultData;
        // this.setData()
        this.checkInsuranceExpiry();
        // this.getPortalTypeAndInsuranceId();

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
        let result = this.coreService.decryptObjectData({ data: result1 });
        // this.coreService.showSuccess("", "Fetched order details successfully");
        if (result.status === true) {
          this.orderDetails = result.data;
          this.getPatientDetails(result.data.orderData.patient_details.user_id)
          this.profileData=result?.data?.pharmacyDetails
          this.pharmacyProfile=result?.data
          
                    this.subscriber_id = result?.data?.orderData?.subscriber_id

          if (this.orderDetails.medicineBill.prescription_url) {
            this.prescriptionSignedUrl=this.orderDetails.medicineBill.prescription_url;

          }
          result.data.medicineDetails.forEach((element) => {
            const available = element.available ? "yes" : "no";
            const newRow = {
              name: element.name,
              prescribed: element.quantity_data.prescribed,
              delivered: 
                element.quantity_data.delivered || "",
              frequency: element.frequency,
              duration: element.duration,
              priceperunit: element.price_per_unit || "",
              totalcost: element.total_cost || "",
              available
            };
            this.availableMedicineList.push(available);
            (this.orderMedicine.medicine_details).push(
              newRow
            );
          });
          this.orderMedicine["total_cost"] = result.data.medicineBill.total_medicine_cost || "";
          this.orderMedicine["copay"] = result.data.medicineBill.co_pay || "";
          this.orderMedicine["insurance_paid"] = result.data.medicineBill.insurance_paid || "";
          this.dataSource = new MatTableDataSource(
            (this.orderMedicine["medicine_details"])
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

  public updateOrderData(): void {
    const orderDetailRequest: IOrderUpdateRequest = {
      for_portal_user: this.pharmacy_id,
      for_order_id: this.order_id,
      in_medicine_bill: this.orderDetails.medicineBill._id,
      medicine_bill: {
        co_pay: this.orderMedicine["copay"],
        total_medicine_cost: this.orderMedicine["total_cost"],
        insurance_paid: this.orderMedicine["insurance_paid"],
      },
      medicine_details: this.orderMedicine["medicine_details"].map((data) => ({
        name: data.name,
        medicine_id: null,
        quantity_data: {
          prescribed: data.prescribed,
          delivered: data.delivered,
        },
        frequency: data.frequency,
        duration: data.duration,
        price_per_unit: data.priceperunit,
        total_cost: data.totalcost,
        available: data.available === "yes",
      })),
      request_type: this.orderDetails.orderData.request_type,
      status: "completed"
    };
    this.patientService.updateOrderDetails(orderDetailRequest).subscribe({
      next: (result1: IResponse<IMedicineUpdateResponse>) => {
        let result = this.coreService.decryptObjectData({ data: result1 });
        // this.coreService.showSuccess("", "Updated order details successfully");
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

  documentMetaDataURL(): void {
    const docRequest: IUniqueId = {
      id: this.orderDetails.medicineBill.prescription_url,
    };
    this.patientService.getDocumentMetadata(docRequest).subscribe({
      next: (result1: IResponse<IDocumentMetaDataResponse>) => {
        let result = this.coreService.decryptObjectData({ data: result1 });
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
      next: (result1: IResponse<string>) => {
        let result = this.coreService.decryptObjectData({ data: result1 });
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

  gotoOrderList() {
    this.router.navigate(['/patient/presciptionorder']);
  }
}
