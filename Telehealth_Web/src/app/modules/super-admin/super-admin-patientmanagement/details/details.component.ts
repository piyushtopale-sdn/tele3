import { Component, OnInit } from '@angular/core';
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";
import { DatePipe } from "@angular/common";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Router } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import { PatientService } from 'src/app/modules/patient/patient.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent {
  displayedColumns: string[] = ['patientname','relationship', 'gender', 'dateofbirth','phonenumber', 'status'];
  dataSource :any[] =[];

  pageSize: number = 5;
  totalLength: number = 0;
  page: any = 1;
  id: any;
  insuranceDetails: any;
  profile: any;
  country: any = "";
  locationData: any;
  region: any;
  upcoimgPlanData: any;
  consultationOptions: { [key: string]: string } = {
    'Consultation': 'consultation',
    // 'Lab': 'labtest',
    // 'Radiology': 'radiologytest'
  };
  objectKeys(obj: { [key: string]: string }): string[] {
    return Object.keys(obj);
  }
  consultationCounts: number[] = [1,2,3,4,5,6,7,8,9];
  serviceType:any = ''
  serviceTypeCount:any = ''
  formSubmitted: boolean = false;
  assignedDoctorData:any;

  constructor(   private acctivatedRoute: ActivatedRoute,
    private _coreService: CoreService,
     private service: PatientService,
    private toastr: ToastrService,
    private datepipe: DatePipe,
    private adminService: SuperAdminService,
    private coreService: CoreService,
    private modalService: NgbModal,
    private route: Router,
    private activateRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.activateRoute.paramMap.subscribe(params => {
      this.id = params.get('id');
    });
    this.getAllDetails();
    this.getAssignedDoctorsData()
  }
  getAllDetails() {
    let params = {
      patient_id: this.id,
       doctor_id:"",
    };
    this.service.profileDetails(params).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });      
        if(response.status){
          this.profile = {
            ...response?.body?.personalDetails,
            ...response?.body?.portalUserDetails,
           ...response?.body?.familyDetails,
           ...response?.body?.subscriptionDetails
          }; 
          this.locationData = response?.body?.locationDetails;
        }
        this.dataSource = response?.body?.familyDetails
        let upcomingPlan  = response?.body?.subscriptionDetails?.nextBillingPlanId;
        if(upcomingPlan){
          this.getUpcomingPlan(upcomingPlan);
        }
       },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
  }
  
  getUpcomingPlan(id:any) {
    let params = {
       id: id      
    };
    this.adminService.getPlanDetails(params).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        
        if(response.status){          
         this.upcoimgPlanData = response?.body;
        }
       },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
  }

  calculateAge(dob: string): number {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  openAddConsultationCountPopup(addConsultationCount: any) {
    this.modalService.open(addConsultationCount, {
      centered: true,
      size: "lg",
      windowClass: "master_modal add_lab",
    });
  }

  AddConsultationCount(saveConfirmation:any){
    this.formSubmitted = true;
    if((this.serviceType !=='' && this.serviceTypeCount !=='') && this.formSubmitted){
      this.modalService.open(saveConfirmation, {
        centered: true,
        size: "sm",
        windowClass: "master_modal add_lab",
      });
    }
  }

  saveConsultationCount(){
    let data = {
      patient_id:this.id,
      serviceType:this.serviceType,
      count:this.serviceTypeCount,
      isAdd: true
    }
    this.adminService.addConsultationCount(data).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        this.toastr.success(response.message,"Success")
        this.modalService.dismissAll("close");
        this.serviceType = ''
        this.serviceTypeCount = ''
        this.formSubmitted = false
        this.getAllDetails()
       },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
  }

  closePopup() {
    this.serviceType = ''
    this.serviceTypeCount = ''
    this.formSubmitted = false
    this.modalService.dismissAll("close");
  }
  getAssignedDoctorsData() {
    let params = {
      id: this.id, 
    };
    this.service.getAssignedDoctors(params).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.assignedDoctorData = response.data;
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
  }
  
}

