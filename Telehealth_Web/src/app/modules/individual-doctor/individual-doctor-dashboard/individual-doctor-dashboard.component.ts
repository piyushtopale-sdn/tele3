import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ChartConfiguration, ChartOptions } from "chart.js";
import { IndiviualDoctorService } from "../indiviual-doctor.service";
import { CoreService } from "src/app/shared/core.service";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { DatePipe } from "@angular/common";
import { DateAdapter } from "@angular/material/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { SuperAdminService } from "../../super-admin/super-admin.service";
import * as XLSX from "xlsx";

@Component({
  selector: "app-individual-doctor-dashboard",
  templateUrl: "./individual-doctor-dashboard.component.html",
  styleUrls: ["./individual-doctor-dashboard.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class IndividualDoctorDashboardComponent implements OnInit {
  displayedColumns: string[] = [
    "patientname",
    "dateandtime",
    "appointmenID",
    "action",
  ];
  dataSource: any[] = [];

  prescribedlabtestColumns: string[] = [
    "appointmentId",
    "dateandtime",
    "patientName",
    "labName",
    "testName",
  ];
  prescribedlabtestdataSource: any[] = [];

  prescribedRadiotestColumns: string[] = [
    "appointmentId",
    "dateandtime",
    "patientName",
    "radioName",
    "testName",
  ];

  prescribedRadiodataSource: any[] = [];

  userRole: any = "";
  page: any = 1;
  pageSize: number = 5;
  pageRadio: any = 1;
  pageSizeRadio: number = 5;
  totalLength: number = 0;
  dateRangeForm: FormGroup;
  fromDate: string = "";
  toDate: string = "";
  totalConfirmedAppointment: any;
  totalConsultationDone: any;
  totalIncompleteOrders: any;
  totalPrescribedLabTest: any;
  totalPatient: any;
  totalPrescribedRadiologyTest: any;
  loginUserID: any = "";
  userMenu: any = [];
  param: any = "";
  currentUrl: any = [];
  exportPatientDetails: any;
  patientSubscriberCount: any = 0;
  doctorName: any;
  confirmedExportList: any = [];
  completeExportList: any = [];
  patientServed: any = [];
  labTotalCount: number = 0;
  showList: any = "appointment";
  radioTotalCount: number = 0;
  sortColumn: string = "createdAt";
  sortOrder: 1 | -1 = -1;
  sortIconClass: string = "arrow_upward";

  pendingLabTests: any = [];
  pendingRadioTests: any = [];
  totalPendingPrescribedLabTestCount: number = 0;
  totalPendingPrescribedRadioTestCount: number = 0;

  constructor(
    private _coreService: CoreService,
    private service: IndiviualDoctorService,
    private route: Router,
    private modalService: NgbModal,
    private datepipe: DatePipe,
    private dateAdapter: DateAdapter<Date>,
    private fb: FormBuilder,
    private sadminServce: SuperAdminService
  ) {
    this.dateAdapter.setLocale("en-GB");
    //dd/MM/yyyy
    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null],
    });
  }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass =
      this.sortOrder === 1 ? "arrow_upward" : "arrow_downward";
    this.prescribedradioTest(`${column}:${this.sortOrder}`);
  }
  onSortDataLab(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass =
      this.sortOrder === 1 ? "arrow_upward" : "arrow_downward";
    this.prescribedLabTest(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.userRole = loginData?.role;
    this.loginUserID = loginData?._id;
    this.doctorName = loginData?.fullName;

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.dateRangeForm.patchValue({
      fromDate: firstDay,
      toDate: lastDay,
    });

    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(lastDay);
    this.dashboardCount();
    this.getAppointmentlist();
    this.patientSubscriber();
    this.currentUrl = this.route.url;
    this.onNavigate(this.currentUrl);
    this.exportCompletedAppointment();
    this.exportConfirmedAppointment();
    this.exportPatientData();
    this.prescribedLabTest();
    this.prescribedradioTest();
    this.getPendingLabTests();
    this.getPendingRadiologyTests();
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  dashboardCount() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
    this.service.getDoctorDashboardApi(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.totalConfirmedAppointment =
          response?.body?.totalConfirmedAppointment;
        this.totalConsultationDone = response?.body?.totalConsultationDone;
        this.totalIncompleteOrders = response?.body?.totalIncompleteOrders;
        this.totalPatient = response?.body?.totalPatient;
        this.totalPrescribedLabTest = response?.body?.totalPrescribedLabTest;
        this.totalPrescribedRadiologyTest =
          response?.body?.totalPrescribedRadiologyTest;
      }
    });
  }

  onDateChange(type: string, event: Date): void {
    if (type === "from") {
      this.dateRangeForm.get("fromDate")?.setValue(event);
    } else if (type === "to") {
      this.dateRangeForm.get("toDate")?.setValue(event);
    }

    const fromDate = this.dateRangeForm.get("fromDate")?.value;
    const toDate = this.dateRangeForm.get("toDate")?.value;

    this.fromDate = this.formatDate(fromDate);
    this.toDate = this.formatDate(toDate);

    this.dashboardCount();
    this.exportCompletedAppointment();
    this.exportConfirmedAppointment();
    this.exportPatientData();
    this.prescribedLabTest();
    this.prescribedradioTest();
    this.getPendingLabTests() ;
    this.getPendingRadiologyTests();
  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, "MM-dd-yyyy") || "";
  }

  getAppointmentlist() {
    let reqData = {
      limit: this.pageSize,
      page: this.page,
      status: "APPROVED",
    };
    this.service.appoinmentListApi(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.dataSource = response?.data?.data;
        this.totalLength = response?.data?.totalRecords;
      }
    });
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAppointmentlist();
  }

  onNavigate(url: any): void {
    const menuitems = JSON.parse(localStorage.getItem("activeMenu"));
    if(menuitems){
      this.currentUrl = url;
  
      const matchedMenu = menuitems.find(
        (menu) => menu.route_path === this.currentUrl
      );
      this.route.navigate([url]).then(() => {
        this.service.setActiveMenu(matchedMenu?.name);
      });
    }
  }

  patientSubscriber() {
    let reqData = {
      doctorId: this.loginUserID,
    };
    this.service.patientSubscriberdashboard(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.patientSubscriberCount = response?.body?.totalCount;
        this.exportPatientDetails = response?.body?.array;
      }
    });
  }

  exportToExcelSubscribers() {
    if (this.exportPatientDetails.length === 0) {
      return;
    }
    const formattedData = this.exportPatientDetails.map((data, index) => ({
      "Full Name": data?.full_name ?? "",
      "Full Name Arabic": data?.full_name_arabic ?? "",
      Email: data?.email ?? "",
      "Mobile Number": data?.mobile ?? "",
      "Subscribed Plan Name": data?.subscriptionDetails?.planName ?? "",
      "Subscribed Plan Name Arabic":
        data?.subscriptionDetails?.planNameArabic ?? "",
      "Subscription Start Date":
        this.formatDate__(data?.subscriptionDetails?.startDate) ?? "",
      "Subscription End Date":
        this.formatDate__(data?.subscriptionDetails?.endDate) ?? "",
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    ws["!cols"] = [{ wch: 20 }, { wch: 20 }];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Subscribed Patient List-${this.doctorName}.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, "Subscribed Patient List");

    XLSX.writeFile(wb, fileName);
  }

  formatDate__(date: Date): string {
    return this.datepipe.transform(date, "dd-MM-yyyy") || "";
  }

  exportCompletedAppointment() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      status: "COMPLETED",
    };
    this.service.doctorDashboardExport(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.completeExportList = response?.body;
      }
    });
  }

  exportConfirmedAppointment() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
    this.service.doctorDashboardExport(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.confirmedExportList = response?.body;
      }
    });
  }

  exportToExcelComplete() {
    if (this.completeExportList.length === 0) {
      return;
    }
    const formattedData = this.completeExportList.map((data, index) => ({
      "Appointment Id": data?.appointment_id ?? "",
      "Consultation Date": data?.consultationDate ?? "",
      "Consultation Time": data?.consultationTime ?? "",
      "Appointment Status": data?.status ?? "",
      "Patient Full Name": data?.patient?.full_name ?? "",
      "Patient Full Name Arabic": data?.patient?.full_name_arabic ?? "",
      "Patient Mobile Number": data?.patient?.mobile ?? "",
      "Patient MRN Number": data?.patient?.mrn_number ?? "",
      "Doctor Full Name": data?.doctor_name ?? "",
      "Doctor Full Name Arabic": data?.doctor_name_arabic ?? "",
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    ws["!cols"] = [{ wch: 20 }, { wch: 20 }];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Completed Appointment List.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, "Completed Appointment List");

    XLSX.writeFile(wb, fileName);
  }

  exportToExcelConfirmed() {
    if (this.confirmedExportList.length === 0) {
      return;
    }
    const formattedData = this.confirmedExportList.map((data, index) => ({
      "Appointment Id": data?.appointment_id ?? "",
      "Consultation Date": data?.consultationDate ?? "",
      "Consultation Time": data?.consultationTime ?? "",
      "Appointment Status": data?.status ?? "",
      "Patient Full Name": data?.patient?.full_name ?? "",
      "Patient Full Name Arabic": data?.patient?.full_name_arabic ?? "",
      "Patient Mobile Number": data?.patient?.mobile ?? "",
      "Patient MRN Number": data?.patient?.mrn_number ?? "",
      "Doctor Full Name": data?.doctor_name ?? "",
      "Doctor Full Name Arabic": data?.doctor_name_arabic ?? "",
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    ws["!cols"] = [{ wch: 20 }, { wch: 20 }];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Confirmed Appointment List.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, "Confirmed Appointment List");

    XLSX.writeFile(wb, fileName);
  }

  exportPatientData() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
    this.service.patientDashboardExport(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.patientServed = response?.body;
      }
    });
  }

  exportToExcelPatientServed() {
    if (this.patientServed.length === 0) {
      return;
    }
    const formattedData = this.patientServed.map((data, index) => ({
      "Patient Full Name": data?.patient?.full_name ?? "",
      "Patient Full Name Arabic": data?.patient?.full_name_arabic ?? "",
      "Patient Mobile Number": data?.patient?.mobile ?? "",
      "Patient MRN Number": data?.patient?.mrn_number ?? "",
      "Doctor Full Name": data?.doctor_name ?? "",
      "Doctor Full Name Arabic": data?.doctor_name_arabic ?? "",
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    ws["!cols"] = [{ wch: 20 }, { wch: 20 }];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Patients Served List.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, "Patients Served List");

    XLSX.writeFile(wb, fileName);
  }

  handleLabPageEvent(data: any) {
    this.page = data.pageIndex + 1;  
    this.pageSize = data.pageSize;
    this.prescribedLabTest(`${this.sortColumn}:${this.sortOrder}`);
  }
  
  prescribedLabTest(sort: any = "") {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      limit: this.pageSize,
      page: this.page,
      sort: sort,
    };
    this.service.prescribedLabTestExport(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.prescribedlabtestdataSource = response?.body;
        this.labTotalCount = response?.totalRecords;
      }
    });
  }

  showSection(type: any) {
    if (type === "lab") {
      this.showList = "lab";
    } else if (type === "radio") {
      this.showList = "radio";
    } else {
      this.showList = "appointment";
    }
  }

  handleRadioPageEvent(data: any) {
    this.page = data.pageIndex + 1;  
    this.pageSize = data.pageSize;
    this.prescribedradioTest(`${this.sortColumn}:${this.sortOrder}`);
  }
  

  prescribedradioTest(sort: any = "") {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      limit: this.pageSize,
      page: this.page,
      sort: sort,
    };
    this.service.prescribedradioTestListExport(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.prescribedRadiodataSource = response?.body;
        this.radioTotalCount = response?.totalRecords;
      }
    });
  }

  

  goTOApp(id: any) {
    this.route.navigate([
      `/individual-doctor/appointment/appointmentdetails/${id}`,
    ]);
  }

  goTOEmr(id: any) {
    this.route.navigate([`individual-doctor/patientmanagement/details/${id}`]);
  }

  getPendingLabTests() {
    let doctorId = this.loginUserID;
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate
    };
  
    this.service.getPendingLabTests(doctorId, data).subscribe(
      (res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
  
        if (response.status) {
          this.totalPendingPrescribedLabTestCount =
            response?.totalPendingPrescribedLabTestCount || 0;
          this.pendingLabTests = response?.body || [];
        } else {
          this.totalPendingPrescribedLabTestCount = 0;
          this.pendingLabTests = [];
        }
      },
      (error) => {
        console.error('Error fetching pending lab tests:', error);
      }
    );
  }
  
  //getPendingRadiologyTests
  getPendingRadiologyTests() {
    let doctorId = this.loginUserID; 
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate
    };
    this.service.getPendingRadiologyTests(doctorId, data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        // ✅ Save the total count
        this.totalPendingPrescribedRadioTestCount =
          response?.totalPendingPrescribedRadioTestCount || 0;
        this.pendingRadioTests = response?.body || [];
      } else {
        this.totalPendingPrescribedRadioTestCount = 0;
        this.pendingRadioTests = [];
      }
    });
  }

  exportToExcelPendingLabTest() {
    if (this.pendingLabTests.length === 0) {
      return;
    }

    // ✅ Format the data
    const formattedData = this.pendingLabTests.map((data, index) => ({
      "Appointment ID": data?.appointmentId ?? "N/A",
      "Appointment Date": data?.consultationDate ?? "N/A",
      "Appointment Time": data?.consultationTime ?? "N/A",
      "Patient Name": data?.patientName ?? "N/A",
      "Patient Name Arabic": data?.patientNameArabic ?? "N/A",
      "Center Name": data?.labName ?? "N/A",
      "Test Name": data?.testName ?? "N/A",
      "Appointment Status": data?.appointmentStatus ?? "N/A",
    }));

    // ✅ Create worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    // ✅ Adjust column width
    ws["!cols"] = [
      { wch: 20 }, // Appointment ID
      { wch: 20 }, // Appointment Date & Time
      { wch: 20 }, // Appointment Time
      { wch: 25 }, // Patient Name
      { wch: 25 }, // Patient Name Arabic
      { wch: 20 }, // Center Name
      { wch: 20 }, // Test Name
      { wch: 20 }, // Appointment Status
    ];

    // ✅ Create workbook
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Incomplete Lab Tests-${this.doctorName}.xlsx`;

    // ✅ Append worksheet
    XLSX.utils.book_append_sheet(wb, ws, "Incomplete Lab Tests");

    // ✅ Write file
    XLSX.writeFile(wb, fileName);
  }

  exportToExcelPendingRadioTest() {
    if (this.pendingRadioTests.length === 0) {
      return;
    }

    // ✅ Format the data
    const formattedData = this.pendingRadioTests.map((data, index) => ({
      "Appointment ID": data?.appointmentId ?? "N/A",
      "Appointment Date": data?.consultationDate ?? "N/A", 
      "Appointment Time": data?.consultationTime ?? "N/A",
      "Patient Name": data?.patientName ?? "N/A",
      "Patient Name Arabic": data?.patientNameArabic ?? "N/A",
      "Center Name": data?.radioName ?? "N/A", 
      "Test Name": data?.testName ?? "N/A",
      "Appointment Status": data?.appointmentStatus ?? "N/A", 
    }));

    // ✅ Create worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    // ✅ Adjust column width
    ws["!cols"] = [
      { wch: 20 }, // Appointment ID
      { wch: 20 }, // Appointment Date
      { wch: 20 }, // Appointment Time
      { wch: 25 }, // Patient Name
      { wch: 25 }, // Patient Name Arabic
      { wch: 20 }, // Center Name
      { wch: 20 }, // Test Name
      { wch: 20 }, // Appointment Status
    ];

    // ✅ Create workbook
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Incomplete Radiology Tests-${this.doctorName}.xlsx`;

    // ✅ Append worksheet
    XLSX.utils.book_append_sheet(wb, ws, "Incomplete Radiology Tests");

    // ✅ Write file
    XLSX.writeFile(wb, fileName);
  }
}
