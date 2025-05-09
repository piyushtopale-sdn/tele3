import {
  ChangeDetectorRef,
  Component
} from "@angular/core";
import {
  Chart,
  ChartOptions,
  registerables,
} from "chart.js";
import { CoreService } from "src/app/shared/core.service";
import { Router } from "@angular/router";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
export interface PeriodicElement {
  patientname: string;
  dateandtime: string;
  consultationtype: string;
}
import { IndiviualDoctorService } from "../../individual-doctor/indiviual-doctor.service";
import { DatePipe } from "@angular/common";
import { DateAdapter } from "@angular/material/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { FourPortalService } from "../../four-portal/four-portal.service";
import { SuperAdminService } from "../../super-admin/super-admin.service";

@Component({
  selector: "app-admin-dashboard",
  templateUrl: "./admin-dashboard.component.html",
  styleUrls: ["./admin-dashboard.component.scss"],
})
export class AdminDashboardComponent {
  displayedLabColumns: string[] = [
    "orderid",
    "patientname",
    "mrn_number",
    "testname",
    "centrename",
  ];
  dataLabSource: any[] = [];
  medicationdisplayedColumns: string[] = [
    "orderid",
    "patientname",
    "mrn_number",
    "medicinename",
    "dose",
    "doseunit",
    "routeofadminst",
    "quantity",
    "fequency",
    "takefor",
  ];
  medicationdataSource: any[] = [];
  displayedRadioColumns: string[] = [
    "orderid",
    "patientname",
    "mrn_number",
    "testname",
    "centrename",
  ];
  displayedColumns: string[] = [
    "patientname",
    "prescribeBy",
    "tests",
    "appointmenId",
    "dateandtime",
    "status",
    // "approval",
    // "action",
  ];
  dataRadioSource: any[] = [];
  dateRangeForm: FormGroup;
  fromDate: string = "";
  toDate: string = "";
  totalAppointments: any;
  totalLabOrders: any;
  totalRadiologyOrders: any;
  totalUnbookedLabOrders: any;
  totalUnbookedMedicineOrders: any;
  totalUnbookedRadiologyOrders: any;
  totalLastLoginByDoctors: any;
  patientLeftDoc: any;
  patientcurrentAssgin: any;
  patientLeftDocArray: any[] = [];
  ExportpatientAssginData: any[] = [];
  selectedStatus: any = "ALL";

  dataSource: any[] = [];
  startgraphDate: string;
  endgraphDate: string;
  graphyear: number;

  months: string[] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  selectedMonth: string = this.months[new Date().getMonth()]; // Default to current month

  years: number[] = [];
  lineChartData: any;
  selectedYear: number = new Date().getFullYear();
  lineChartOptions: ChartOptions<"line">;
  page: any = 1;
  pageSize: number = 5;
  totalLength: number = 0;


  pageLab: any = 1;
  pageSizeLab: number = 5;
  totalLabLength: number = 0;

  pageRadio: any = 1;
  pageSizeRadio: number = 5;
  totalRadioLength: number = 0;


  pageMed: any = 1;
  pageSizeMed: number = 5;
  totalMedLength: number = 0;
  tabLabel: any = "total_unbooked_lab_orders";
  serviceType: string;

  loadingExport: boolean = false;

  constructor(
    private readonly _coreService: CoreService,
    private readonly service: IndiviualDoctorService,
    private readonly route: Router,
    private readonly _superAdminService: SuperAdminService,
    private readonly fourPortalService: FourPortalService,
    private readonly datepipe: DatePipe,
    private readonly dateAdapter: DateAdapter<Date>,
    private readonly fb: FormBuilder,
  ) {
    this.dateAdapter.setLocale("en-GB"); //dd/MM/yyyy
    Chart.register(...registerables);
    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null],
    });
    this.yeardropdown();
  }

  yeardropdown() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 4; i--) {
      this.years.push(i);
    }

    this.selectedYear = currentYear;
  }

  ngOnInit(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.dateRangeForm.patchValue({
      fromDate: firstDay,
      toDate: lastDay,
    });

    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(lastDay);

    // this.initializeChartData();
    // this.initializeChartOptions();
    // this.getgraphYear(this.years[0])
    this.testsCount();
    if (this.tabLabel === 'total_unbooked_lab_orders') {
      this.labtestPrescribe();
    }

    this.getPatientsLeftDocData();
    this.getPatientsCurrentAssignedDocData();
    this.exportToExcelUnbookedLab();
    this.exportToExcelUnbookedRadio();
    this.exportToExcelUnbookedMedicine();
  }

  getgraphYear(year) {
    const today = new Date();

    const startDate = new Date(year, today.getMonth(), 1);
    const endDate = new Date(year, today.getMonth() + 1, 0);

    this.startgraphDate = this.formatDateNew(startDate.toISOString());
    this.endgraphDate = this.formatDateNew(endDate.toISOString());
    this.dashboardGraph();
  }

  onMonthChange(month: string) {
    this.selectedMonth = month;
    this.updateGraphDate(this.selectedYear, month);
  }

  updateGraphDate(year: number, month: string) {
    const monthIndex = this.months.indexOf(month) + 1; // Convert month name to index (1-12)
    const monthStr = monthIndex.toString().padStart(2, "0"); // Format as "01", "02", etc.

    // Calculate start date for the first day of the month
    const startDate = `${year}-${monthStr}-01T00:00:00.000Z`;

    // Get the last day of the month (dynamically calculated)
    const endDate = new Date(year, monthIndex, 0); // Using Date(year, monthIndex, 0) gives the last day of the previous month
    const endDateStr = `${year}-${monthStr}-${endDate
      .getDate()
      .toString()
      .padStart(2, "0")}T23:59:59.000Z`;

    // Format both start and end dates
    this.startgraphDate = this.formatDateNew(startDate);
    this.endgraphDate = this.formatDateNew(endDateStr);
    this.dashboardGraph();
  }

  formatDateNew(dateStr: string): string {
    const date = new Date(dateStr);
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0"); // getUTCMonth() returns 0-11
    const day = date.getUTCDate().toString().padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${year}-${month}-${day}`;
  }

  testsCount() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
    this.service.doctoradminDashboard(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.totalAppointments = response?.body?.totalAppointment;
        this.totalLabOrders = response?.body?.totalLabOrders;
        this.totalRadiologyOrders = response?.body?.totalRadiologyOrders;
        this.totalLastLoginByDoctors = response?.body?.totalLastLoginByDoctors;
      }
    });
  }

  myFilter = (d: Date | null): boolean => {
    return true;
  };

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

    this.testsCount();
    this.labtestPrescribe();
    this.radiotestPrescribe();
    this.getPatientsLeftDocData();
    this.getPatientsCurrentAssignedDocData();
    this.exportToExcelUnbookedMedicine();
    this.exportToExcelUnbookedLab();
    this.exportToExcelUnbookedRadio();
    this.exportLabOrderList();
    this.exportRadioOrderList();
    this.exportTotalAppointmentList();

  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, "MM-dd-yyyy") || "";
  }

  initializeChartData(
    completedCounts: any = "",
    cancelledCounts: any = "",
    underProcessedCounts: any = "",
    labels: any = ""
  ) {
    this.lineChartData = {
      labels: labels,
      datasets: [
        {
          label: "Completed",
          data: completedCounts,
          borderColor: "green",
          backgroundColor: "rgba(0, 128, 0, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Cancelled",
          data: cancelledCounts,
          borderColor: "orange",
          backgroundColor: "rgba(255, 165, 0, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Under-Process",
          data: underProcessedCounts,
          borderColor: "yellow",
          backgroundColor: "rgba(255, 255, 0, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }

  initializeChartOptions(dynamicMax: any = "") {
    this.lineChartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: dynamicMax,
        },
      },
    };
  }

  dashboardGraph() {
    let data = {
      fromDate: this.startgraphDate,
      toDate: this.endgraphDate,
      type: "radiology",
    };
    this.fourPortalService.dashboardGraph(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        const completedData = response.body.COMPLETED || [];
        const cancelledData = response.body.CANCELLED || [];
        const underProcessedData = response.body.UNDER_PROCESSED || [];

        const labels = completedData.map((item) => {
          const date = new Date(item.date); // Create a Date object from the date string
          const day = date.getUTCDate().toString().padStart(2, "0"); // Get the day and format with leading zero if needed
          const month = (date.getUTCMonth() + 1).toString().padStart(2, "0"); // Get the month and format it (months are 0-based)
          return `${day}/${month}`; // Return the formatted date in day/month format
        });
        const completedCounts = completedData.map((item) => item.count);
        const cancelledCounts = cancelledData.map((item) => item.count);
        const underProcessedCounts = underProcessedData.map(
          (item) => item.count
        );
        this.initializeChartData(
          completedCounts,
          cancelledCounts,
          underProcessedCounts,
          labels
        );
        const allCounts = [
          ...completedCounts,
          ...cancelledCounts,
          ...underProcessedCounts,
        ];

        const maxCount = Math.max(...allCounts);

        // You can optionally add some margin, such as 10% more than the max value
        const dynamicMax = Math.ceil(maxCount * 1.1);

        this.initializeChartOptions(dynamicMax);
      }
    });
  }

  onTabClick(tab: any) {
    this.tabLabel = tab;
    if (tab === "total_unbooked_lab_orders") {
      this.labtestPrescribe();
    }
    if (tab === "total_unbooked_medicine_orders") {
      this.medicinePrescribe();
    }
    if (tab === "total_unbooked_radiology_orders") {
      this.radiotestPrescribe();
    }
    if (tab === "total_radio_request") {
      this.serviceType = "radiology";
      this.getAppointmentlist();
    }
    if (tab === "total_lab_request") {
      this.serviceType = "lab";
      this.getAppointmentlist();
    }
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAppointmentlist();
  }

  handlePageMedEvent(data: any) {
    this.pageMed = data.pageIndex + 1;
    this.pageSizeMed = data.pageSize;
    this.medicinePrescribe();
  }

  handlePageEventLab(data: any) {
    this.pageLab = data.pageIndex + 1;
    this.pageSizeLab = data.pageSize;
    this.labtestPrescribe();
  }

  medicinePrescribe() {
    let reqData = {
      limit: this.pageSizeMed,
      page: this.pageMed,
      status: "PENDING",
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
    this.service.getAllEprescriptionTests(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.medicationdataSource = response?.body?.result;
        this.totalMedLength = response?.body?.totalRecords;
      }
    });
  }

  labtestPrescribe() {
    let reqData = {
      limit: this.pageSizeLab,
      page: this.pageLab,
      status: "PENDING",
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
    this.service.getUnBookedPrescribedLabTest(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.dataLabSource = response?.body?.result;
        this.totalLabLength = response?.body?.totalRecords;
      }
    });
  }

  handlePageEventRadio(data: any) {
    this.pageRadio = data.pageIndex + 1;
    this.pageSizeRadio = data.pageSize;
    this.radiotestPrescribe();
  }

  radiotestPrescribe() {
    let reqData = {
      limit: this.pageSizeRadio,
      page: this.pageRadio,
      status: "PENDING",
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
    this.service.getUnBookedPrescribedRadiologyTest(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.dataRadioSource = response?.body?.result;
        this.totalRadioLength = response?.body?.totalRecords;
      }
    });
  }

  routeToViewResult(appId: any, testid: any, testName: any, patientId: any) {
    this.route.navigate(
      [`/individual-doctor/patientmanagement/view-lab-results`],
      {
        queryParams: {
          appointmentId: appId,
          testID: testid,
          patientID: patientId,
          testName: testName,
        },
      }
    );
  }

  downloadTestResult(id: any) {
    let reqData = {
      id: id,
    };
    this.fourPortalService.getLabTestResultById(reqData).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          let resData = response?.data;
          const uploadResult = resData?.uploadResultData[0];
          const signedUrl = uploadResult?.signedUrl;

          if (signedUrl) {
            this.triggerFileDownload(signedUrl, uploadResult?.key);
          } else {
            console.error("No signedUrl found in the response");
          }
        } else {
          console.error("Failed to fetch test result:", response.message);
        }
      },
      (error) => {
        console.error("Error fetching test result:", error);
      }
    );
  }

  triggerFileDownload(url: string, filename: string) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.download = filename || "download.pdf";
    anchor.click();
  }
  handleSelectFliterList(event: any) {
    this.selectedStatus = event.value;
    this.getAppointmentlist();
  }

  formatDateALLR(date: any): string {
    return this.datepipe.transform(date, 'yyyy-MM-dd') || '';
  }
  async getAppointmentlist(sort: any = "") {
    let reqData = {
      limit: this.pageSize,
      page: this.page,
      status: this.selectedStatus,
      serviceType: this.serviceType,
      labRadiologyId: "",
      fromDate: this.formatDateALLR(this.fromDate),
      toDate: this.formatDateALLR(this.toDate),
    };

    this.fourPortalService
      .fourPortal_appointment_list(reqData)
      .subscribe((res) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);

        if (response.status) {
          this.dataSource = response?.data?.data;
          this.totalLength = response?.data?.totalRecords;
        }
      });
  }


  exportLastLoginData() {
    this.loadingExport = true; // Start loading

    // Pass global this.fromDate and this.toDate
    this.service.getExportAllDoctorLastLogin(this.fromDate, this.toDate).subscribe(
      (res: any) => {
        this.loadingExport = false; // Stop loading
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);

        if (response.status) {
          // Export to Excel
          const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
            response.body
          );
          const workbook: XLSX.WorkBook = {
            Sheets: { DoctorLogs: worksheet },
            SheetNames: ["DoctorLogs"],
          };
          const excelBuffer: any = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
          });

          // Save Excel file
          const blob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
          });

          // Include fromDate and toDate in the file name
          const fromDate = this.fromDate
          const toDate = this.toDate
          const fileName = `LastLogin_${fromDate}_to_${toDate}.xlsx`;

          saveAs(blob, fileName);

        } else {
          console.error("Export failed:", response.message);
        }
      },
      (error) => {
        this.loadingExport = false; // Stop loading on error
        console.error("API error:", error);
      }
    );
  }


  getPatientsLeftDocData() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
    };

    this.service.getPatientsWithPreviousDoctors(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      
      if (response.status) {
        this.patientLeftDoc = response?.data?.totalLeftDoctorCount;
        this.patientLeftDocArray = response?.data?.patientData;


        this.patientLeftDocArray.forEach((patient: any) => {
          if (patient.patient_full_name_arabic === "undefined undefined") {
            patient.patient_full_name_arabic = " ";
          }
        });
      }
    });
  }
  
  getPatientsCurrentAssignedDocData() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
    };

    this.service.getPatientsWithCurrentAssignedDoctors(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.patientcurrentAssgin = response?.data?.countOfPatientsWithCurrentAssignedDoctor;
        this.ExportpatientAssginData = response?.data?.patientData;

        this.ExportpatientAssginData.forEach((patient: any) => {
          if (patient.patient_full_name_arabic === "undefined undefined") {
            patient.patient_full_name_arabic = " ";
          }
        });
      }
    });
  }


  exportPatientLeftDocData() {
    if (!this.patientLeftDocArray || this.patientLeftDocArray.length === 0) {
      console.error("No data available for export");
      return;
    }
    

 
    const formattedData = this.patientLeftDocArray.map((data) => {
      const assignedDate = data?.doctor?.assignedDate ?? null;
      const leftDate = data?.doctor?.leftDoctorDate ?? null;
      const formattedDateTime = assignedDate 
        ? this.datepipe.transform(assignedDate, 'dd/MM/yyyy HH:mm') 
        : '';
        const formattedDateTime1 = leftDate 
        ? this.datepipe.transform(leftDate, 'dd/MM/yyyy HH:mm') 
        : '';
      return {
        'Patient Full Name': data?.patient_full_name ?? '',
        'Patient Full Name Arabic': data?.patient_full_name_arabic ?? '',
        'Gender': data?.gender ?? '',
        'MRN Number': data?.mrn_number ?? '',
        'Mobile': data?.mobile ?? '',        
        'Doctor Full Name': data?.doctor?.Doctor_full_name ?? '',
        'Doctor Full Name Arabic': data?.doctor?.Doctor_full_name_arabic ?? '',
        'Doctor Mobile': data?.doctor?.Doctor_mobile ?? '',
        'Doctor Email': data?.doctor?.Doctor_email ?? '',
        'Assign Doctor Date': formattedDateTime, 
        'Left Doctor Date' :formattedDateTime1,       
        'Previous Left Doctor Count': data?.previousAssignedDoctorCount ?? 0,
        'Current Assign Doctor': data?.currentAssignedDoctor ?? ''
      };
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    ws['!cols'] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 30 },
      { wch: 20 },
      { wch: 30 },
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Patient_Left_Doctor.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, 'Patient Data');
    XLSX.writeFile(wb, fileName);
  };


  exportPatientAssignDoctorData = () => {
    if (!this.ExportpatientAssginData || this.ExportpatientAssginData.length === 0) {
      console.error("No data available for export");
      return;
    }
     
    const formattedData = this.ExportpatientAssginData.map((data) => {
      const assignedDate = data?.doctor?.assignedDate ?? null;
      const formattedDateTime = assignedDate 
        ? this.datepipe.transform(assignedDate, 'dd/MM/yyyy HH:mm') 
        : '';

      return {
        'Patient Full Name': data?.patient_full_name ?? '',
        'Patient Full Name Arabic': data?.patient_full_name_arabic ?? '',
        'Gender': data?.gender ?? '',
        'MRN Number': data?.mrn_number ?? '',
        'Mobile': data?.mobile ?? '',
        'Assign Doctor Date': formattedDateTime,
        'Doctor Full Name': data?.doctor?.Doctor_full_name ?? '',
        'Doctor Full Name Arabic': data?.doctor?.Doctor_full_name_arabic ?? '',
        'Doctor Mobile': data?.doctor?.Doctor_mobile ?? '',
        'Doctor Email': data?.doctor?.Doctor_email ?? '',
      };
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    ws['!cols'] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 30 },
      { wch: 20 },
      { wch: 30 },
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Current_Assigned_Doctor.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, 'Assigned Patient Data');
    XLSX.writeFile(wb, fileName);
  };



  exportToExcelUnbookedMedicine(type: any = '') {
    let reqData = {
      limit: 0,
      page: 1,
      status: "PENDING",
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
    this.service.getAllEprescriptionTests(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      let medicationdataSource = [];
      if (response.status) {
        medicationdataSource = response?.body?.result;
        this.totalUnbookedMedicineOrders = medicationdataSource.reduce((acc, data) => acc + (data.dosageData?.length || 0), 0);
        if (medicationdataSource.length === 0) {
          return;
        }
      
        if (type === 'click') {
          const formattedData = medicationdataSource.flatMap((data) => {
            return data.dosageData.map((med) => ({
              "Order Date": this.formatDate__(data?.createdAt),
              "Prescribed By": data?.doctorName ?? "",
              "Patient Name": data?.patientName ?? "",
              "Appointment ID": data?.appointment_id ?? "",
              "Consultation Date": data?.consultationDate ?? "",
              "Consultation Time": data?.consultationTime ?? "",
              // "Appointment Status": data?.appointmentStatus ?? "",
              "Medicine Name": med?.medicineName ?? "",
              "Dose": med?.dose ?? "",
              "Dose Unit": med?.doseUnit ?? "",
              "Route of Administration": med?.routeOfAdministration ?? "",
              "Quantity": med?.quantity ?? "",
              "Frequency Morning": med?.frequency?.morning ?? "",
              "Frequency Afternoon": med?.frequency?.midday ?? "",
              "Frequency Evening": med?.frequency?.evening ?? "",
              "Frequency Night": med?.frequency?.night ?? "",
              "Take For": (med?.takeFor?.quantity ?? "") + " " + (med?.takeFor?.type ?? ""),
            }));
          });
      
          const ws = XLSX.utils.json_to_sheet(formattedData);
      
          // Set column widths
          ws["!cols"] = [
            { wch: 20 }, 
            { wch: 20 }, 
            { wch: 20 }, 
            { wch: 25 }, 
            { wch: 20 }, 
            { wch: 20 }, 
            { wch: 25 }, 
            { wch: 25 }, 
            { wch: 15 }, 
            { wch: 15 }, 
            { wch: 25 },  
            { wch: 15 }, 
            { wch: 15 }, 
            { wch: 15 }, 
            { wch: 15 }, 
            { wch: 15 },
            { wch: 20 }, 
          ];
      
          // Create the workbook
          const wb = XLSX.utils.book_new();
          const fileName = `Unbooked_Medicine_list.xlsx`;
          XLSX.utils.book_append_sheet(wb, ws, "Unbooked_Medicine_list");
          XLSX.writeFile(wb, fileName);
        }
      }
    });
  }


  formatDate__(date: Date): string {
    return this.datepipe.transform(date, "dd/MM/yyyy") || "";
  }
  exportToExcelUnbookedLab(type: any = '') {
    let reqData = {
      limit: 0,
      page: 1,
      status: "PENDING",
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
  
    this.service.getUnBookedPrescribedLabTest(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      let labTestData = [];
      
      if (response.status) {
        labTestData = response?.body?.result;
        this.totalUnbookedLabOrders = labTestData.reduce((acc, data) => acc + (data.labTest?.length || 0), 0);
        if (type === 'click') {
          if (labTestData.length === 0) {
            return;
          }
  
          const formattedData = labTestData.flatMap((data) => {
            return data.labTest.map((test) => ({
              "Order Date": this.formatDate__(data?.createdAt),
              "Prescribed By": data?.doctorName ?? "",
              "Patient Name": data?.patientName ?? "",
              "Appointment ID": data?.appointment_id ?? "",
              "Consultation Date": data?.consultationDate ?? "",
              "Consultation Time": data?.consultationTime ?? "",
              // "Appointment Status": data?.appointmentStatus ?? "",
              "Lab Test Name": test?.labtestName ?? "",
              "Lab Centre Name": test?.labCenterName ?? ""
            }));
          });
  
          const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
  
          // Set column widths
          ws["!cols"] = [
            { wch: 20 }, // Order Date
            { wch: 20 }, // Prescribed By
            { wch: 20 }, // Patient Name
            { wch: 25 }, // Appointment ID
            { wch: 20 }, // Consultation Date
            { wch: 20 }, // Consultation Time
            { wch: 25 }, // Appointment Status
            { wch: 25 }, // Lab Test Name
            { wch: 20 }, // Lab Centre Name
          ];
  
          // Create the workbook
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          const fileName = `Unbooked_lab_test_list.xlsx`;
          XLSX.utils.book_append_sheet(wb, ws, "Unbooked_lab_test_list");
          XLSX.writeFile(wb, fileName);
        }
      }
    });
  }
  

  exportToExcelUnbookedRadio(type: any = '') {
    let reqData = {
      limit: 0,
      page: 1,
      status: "PENDING",
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
    this.service.getUnBookedPrescribedRadiologyTest(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      let radioTestData = [];
      if (response.status) {
        radioTestData = response?.body?.result;
        this.totalUnbookedRadiologyOrders = radioTestData.reduce((acc, data) => acc + (data.radiologyTest?.length || 0), 0);
        if (type === 'click') {
          if (radioTestData.length === 0) {
            return;
          }

          const formattedData = radioTestData.flatMap((data) => {
            return data.radiologyTest.map((test) => ({
              "Order Date": this.formatDate__(data?.createdAt),
              "Prescribed By": data?.doctorName ?? "",
              "Patient Name": data?.patientName ?? "",
              "Appointment ID": data?.appointment_id ?? "",
              "Consultation Date": data?.consultationDate ?? "",
              "Consultation Time": data?.consultationTime ?? "",
              // "Appointment Status": data?.appointmentStatus ?? "",
              "Radiology Test Name": test?.radiologyTestName ?? "",
              "Radiology Centre Name": test?.radiologyCenterName ?? ""
            }));
          });

          const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
          ws["!cols"] = [
            { wch: 20 }, // Order Date
            { wch: 20 }, // Prescribed By
            { wch: 20 }, // Patient Name
            { wch: 25 }, // Appointment ID
            { wch: 20 }, // Consultation Date
            { wch: 20 }, // Consultation Time
            { wch: 25 }, // Appointment Status
            { wch: 25 }, // Lab Test Name
            { wch: 20 }, // Lab Centre Name
          ];
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          const fileName = `Unbooked_radio_test_list.xlsx`;
          XLSX.utils.book_append_sheet(wb, ws, "Unbooked_radio_test_list");
          XLSX.writeFile(wb, fileName);
        }

      }
    });
  }

  exportLabOrderList(check: any = "") {
    let reqData = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      type: 'lab'
    };

    this.service.labradioOrderListExport(reqData)
      .subscribe((res) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);

        if (response.status) {
          let labOrderData = response?.body;
          if (check === 'click') {
            if (labOrderData.length === 0) {
              return;
            }
            const formattedData = labOrderData.map((data, index) => ({
              "Order Id": data?.appointment_id,
              "Order Date": data?.consultationDate ?? "",
              "Order Time": data?.consultationTime ?? "",
              "Prescribed By": data?.doctorName ?? "",
              "Patient Name": data?.patientName ?? "",
              "Centre Name": data?.centreName ?? "",
              "Order Status": data?.status ?? ""
            }));
            const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
            ws["!cols"] = [
              { wch: 20 },
              { wch: 20 },
              { wch: 20 },
              { wch: 25 },
              { wch: 25 },
              { wch: 20 },
            ];
            const wb: XLSX.WorkBook = XLSX.utils.book_new();
            const fileName = `Total_lab_order_list.xlsx`;
            XLSX.utils.book_append_sheet(wb, ws, "Total_lab_order_list");
            XLSX.writeFile(wb, fileName);
          }
        }
      });
  }

  exportRadioOrderList(check: any = "") {
    let reqData = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      type: 'radiology'
    };

    this.service.labradioOrderListExport(reqData)
      .subscribe((res) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (response.status) {
          let radioOrderData = response?.body;;
          if (check === 'click') {
            if (radioOrderData.length === 0) {
              return;
            }
            const formattedData = radioOrderData.map((data, index) => ({
              "Order Id": data?.appointment_id,
              "Order Date": data?.consultationDate ?? "",
              "Order Time": data?.consultationTime ?? "",
              "Prescribed By": data?.doctorName ?? "",
              "Patient Name": data?.patientName ?? "",
              "Centre Name": data?.centreName ?? "",
              "Order Status": data?.status ?? ""
            }));
            const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
            ws["!cols"] = [
              { wch: 20 },
              { wch: 20 },
              { wch: 20 },
              { wch: 25 },
              { wch: 25 },
              { wch: 20 },
            ];
            const wb: XLSX.WorkBook = XLSX.utils.book_new();
            const fileName = `Total_radio_order_list.xlsx`;
            XLSX.utils.book_append_sheet(wb, ws, "Total_radio_order_list");
            XLSX.writeFile(wb, fileName);
          }
        }
      });
  }



  exportTotalAppointmentList(check: any = '') {
    let data = {
      startDate: this.fromDate,
      endDate: this.toDate,
    }
    this._superAdminService.getDoctorConsultationDetails(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        let appointmentDataList = response?.data;
        if (check === 'click') {
          if (appointmentDataList.length === 0) {
            return;
          }
          const formattedData = appointmentDataList.map((data) => ({
            'Appointment Id': data?.appointment_id,
            'Doctor Name': data?.doctorName ?? "",
            'Doctor Arabic Name': data?.doctorArabicName ?? "",
            'Doctor Id': data?.doctorId ?? "",
            'Patient Name': data?.patientName ?? "",
            'Patient Gender': data?.patientGender ?? "",
            'MRN Number': data?.mrnNuber ?? "",
            'Consultation Date': data?.consultationDate ?? "",
            'Consultation Time': data?.consultationTime ?? "",
          }));

          const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

          ws['!cols'] = [
            { wch: 30 },
            { wch: 30 },
            { wch: 20 },
            { wch: 30 },
          ];

          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          const fileName = `Total_Appointment_List.xlsx`;

          XLSX.utils.book_append_sheet(wb, ws, 'Total Appointment List');

          XLSX.writeFile(wb, fileName);
        }
      }
    })
  }
}
