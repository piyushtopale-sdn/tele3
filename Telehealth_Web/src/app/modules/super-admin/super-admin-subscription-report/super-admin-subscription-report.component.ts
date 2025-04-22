import { DatePipe } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as XLSX from "xlsx";
import { DateAdapter } from '@angular/material/core';
import { SuperAdminService } from '../super-admin.service';
import { CoreService } from 'src/app/shared/core.service';
import { LabimagingdentalopticalService } from '../labimagingdentaloptical.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { IndiviualDoctorService } from '../../individual-doctor/indiviual-doctor.service';
import { PatientService } from '../../patient/patient.service';

@Component({
  selector: 'app-super-admin-subscription-report',
  templateUrl: './super-admin-subscription-report.component.html',
  styleUrls: ['./super-admin-subscription-report.component.scss'],
  encapsulation: ViewEncapsulation.None

})
export class SuperAdminSubscriptionReportComponent {
  displayedColumns: string[] = [
    "patientname",
    "centreName",
    "location",
    "status",
    "orderDateandTime",
    "prescribeBy",
    "orderName",
    "completedDateandTime"
  ];
  dateRangeForm: FormGroup;
  fromDate: string = '';
  toDate: string = '';
  listData: any[] = []
  pageSize: number = 5;
  totalLength: number = 0;
  page: number = 1;
  userList: any[] = [];
  selecteduser: string | null = null;
  selectedStatus: any = 'ALL';
  totalActiveSubscription: any;
  totalCancelSubscription: any;
  totalRevenueWithCurrency: any;
  private _allPatientDetails: any = [];
  matched_patientDetails: any;
  activeSubcriptionData: any;
  upcoimgPlanData: any;


  constructor(
    private service: PatientService,
    private datepipe: DatePipe,
    private dateAdapter: DateAdapter<Date>,
    private fb: FormBuilder,
    private _coreService: CoreService,
    private patientService: IndiviualDoctorService,
    private loader: NgxUiLoaderService,
    private sadminService: SuperAdminService,


  ) {
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy
    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });
  }

  ngOnInit() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.dateRangeForm.patchValue({
      fromDate: firstDay,
      toDate: lastDay
    });

    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(lastDay);
    this.allCount();
    this.getAllPatientList();
  }


  allCount() {
    this.sadminService.revenueCount().subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.totalRevenueWithCurrency = response?.data?.totalRevenueWithCurrency;
        this.totalCancelSubscription = response?.data?.totalCancelSubscription;
        this.totalActiveSubscription = response?.data?.totalActiveSubscription;
        this._allPatientDetails = response?.data?.getAllPatient;
      }
    })
  }


  onDateChange(type: string, event: Date): void {
    if (type === 'from') {
      this.dateRangeForm.get('fromDate')?.setValue(event);
    } else if (type === 'to') {
      this.dateRangeForm.get('toDate')?.setValue(event);
    }

    const fromDate = this.dateRangeForm.get('fromDate')?.value;
    const toDate = this.dateRangeForm.get('toDate')?.value;

    this.fromDate = this.formatDate(fromDate);
    this.toDate = this.formatDate(toDate);

    this.allCount();
    // this.radioTestList();

  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'MM-dd-yyyy') || '';
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  clearSelect2() {
    this.selecteduser = null;
    this.getAllPatientList();
    this.activeSubcriptionData = ''
  }
  onSelect2Change(event: any): void {
    this.selecteduser = event.value;

    if (this.selecteduser) {
      this.getAllDetails(this.selecteduser);
    }
  }

  handleSelectFliterList(event: any) {
    this.selectedStatus = event.value;

  }
  getAllPatientList(): void {
    let reqData = {
      page: 1,
      limit: 0
    };
    this.patientService.getAllPatientForSuperAdmin(reqData).subscribe(async (res) => {
      let response = await this._coreService.decryptObjectData({ data: res });
      if (response.status) {
        const arr = response?.body?.data;
        arr.map((curentval: any) => {
          this.userList.push({
            label: curentval?.full_name,
            value: curentval?.portalUserId,
          });
        });
      }
    });
  }

  exportList() {
    var data: any = [];
    this.pageSize = 0;

    let reqData = {
      romDate: this.fromDate,
      toDate: this.toDate,
      type: 'radiology',
      page: this.page,
      limit: this.pageSize,
      status: this.selectedStatus
    }
    this.sadminService.export_labbRadioList(reqData)
      .subscribe((res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        if (result.status) {
          this.loader.stop();
          var array = [
            "Patient Name",
            "Centre Name",
            "Location",
            "Status",
            "Order Date&Time",
            "Prescribed By",
            "Appointment ID",
            "Completed Date&Time",
          ];
          data = result.data.array
          data.unshift(array);
          var fileName = 'OrderList.xlsx';
          const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
          /* generate workbook and add the worksheet */
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          /* save to file */
          XLSX.writeFile(wb, fileName);
        }
      });

  }

  getAllDetails(id) {
    this.loader.start();
    let params = {
      patient_id: id,
      doctor_id: "",
    };
    this.service.profileDetails(params).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        this.loader.stop();
        if (response.status) {
          this.activeSubcriptionData = response?.body?.subscriptionDetails;
          let upcomingPlan = response?.body?.subscriptionDetails?.nextBillingPlanId;
          if (upcomingPlan) {
            this.getUpcomingPlan(upcomingPlan);
          }
        };
      }

    )
  }

  getUpcomingPlan(id: any) {
    let params = {
      id: id
    };
    this.loader.start();
    this.sadminService.getPlanDetails(params).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        this.loader.stop();

        if (response.status) {
          this.upcoimgPlanData = response?.body;
        }
      },
      (err) => {
        let errResponse = this._coreService.decryptObjectData({
          data: err.error,
        }); 
        this.loader.stop();

      }
    );
  }

}
