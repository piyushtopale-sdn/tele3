import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from "@angular/core";
import {
  Chart,
  ChartOptions,
  registerables,
} from "chart.js";
import { CoreService } from "src/app/shared/core.service";

export interface PeriodicElement {
  patientname: string;
  dateandtime: string;
  consultationtype: string;
}
import { ActivatedRoute, Router } from "@angular/router";
import { IndiviualDoctorService } from "../../individual-doctor/indiviual-doctor.service";
import { FourPortalService } from "../four-portal.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { DatePipe } from "@angular/common";
import { DateAdapter } from "@angular/material/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import * as XLSX from 'xlsx';
import { NgxUiLoaderService } from "ngx-ui-loader";

@Component({
  selector: "app-radio-dashboard",
  templateUrl: "./radio-dashboard.component.html",
  styleUrls: ["./radio-dashboard.component.scss"],
})
export class RadioDashboardComponent implements OnInit {
  dateRangeForm: FormGroup;
  fromDate: string = "";
  toDate: string = "";
  totalOrder: any;
  totalApprovedOrder: any;
  totalNewOrder: any;
  totalCompletedOrder: any;
  totalOrderUnderProcess: any;
  totalCancelledOrder: any;
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
  currentUrl: any = [];
  listData:any []=[];
  constructor(
    private _coreService: CoreService,
    private service: IndiviualDoctorService,
    private route: Router,
    private act_route: ActivatedRoute,
    private fourPortalService: FourPortalService,
    private loader: NgxUiLoaderService,
    private datepipe: DatePipe,
    private dateAdapter: DateAdapter<Date>,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
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

    this.initializeChartData();
    this.initializeChartOptions();
    this.getgraphYear(this.years[0]);

    this.testsCountOfAllApptypes();
    this.currentUrl = this.route.url;
    this.onNavigate(this.currentUrl);
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

  testsCountOfAllApptypes() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      type: "radiology",
    };
    this.fourPortalService.getTotalTests(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.totalOrder = response?.body?.totalAppointments;
        this.totalApprovedOrder = response?.body?.totalReportApproved;
        this.totalNewOrder = response?.body?.totalReportPending;
        this.totalCompletedOrder = response?.body?.totalReportCompleted;
        this.totalOrderUnderProcess = response?.body?.totalReportUnderProcess;
        this.totalCancelledOrder = response?.body?.totalReportCancelled;
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

    this.testsCountOfAllApptypes();
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
  onNavigate(url: any): void {
    const menuitems = JSON.parse(localStorage.getItem("activeMenu"));
    if(menuitems){
      this.currentUrl = url;
  
      const matchedMenu = menuitems.find(
        (menu) => menu.route_path === this.currentUrl
      );
      this.route.navigate([url]).then(() => {
        this.service.setActiveMenu(matchedMenu.name);
      });
    }
  }

  radioOrderListForExport(status: any = '') {
    let fromDate = this.formatDate__(new Date(this.fromDate)); // Ensure it's a Date object
    let toDate = this.formatDate__(new Date(this.toDate));
    if (status === "") {
      return
    }
    let data = {
      limit: 0,
      page: 1,
      status: status,
      serviceType: 'radiology',
      fromDate: fromDate,
      toDate: toDate
    }
    this.loader.start();
    this.fourPortalService.fourPortal_appointment_list(data).subscribe((res) => {
  
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
  
        this.listData = response?.data?.data;
        if (this.listData.length === 0) {
          return;
        }
        const formattedData = this.listData.map((data, index) => ({
  
          'Patient Name': data?.patientName ?? "",
          'PrescribeBy': data?.doctorName ?? "",
          'Order ID': data?.appointmentId ?? "",
          "Tests Name": Array.isArray(data?.radiologyTestName) ? data.radiologyTestName.join(", ") : data.radiologyTestName ?? "",
          'Order Date/Time': data?.consultationDate + "|" + data?.consultationTime,
          'Status': data?.status ?? ""
  
        }));
  
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
  
        ws['!cols'] = [
          { wch: 20 },
          { wch: 20 },
        ];
  
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        const fileName = `${status}_Radio-Order_List.xlsx`;
  
        XLSX.utils.book_append_sheet(wb, ws, `${status} Radio-Order_List`);
  
        XLSX.writeFile(wb, fileName);
      } else {
  
        this.loader.stop();
      }
  
    }
    )
  
  }


  formatDate__(date: Date): string {
    return this.datepipe.transform(date, 'yyyy-MM-dd') || '';
  }
}
