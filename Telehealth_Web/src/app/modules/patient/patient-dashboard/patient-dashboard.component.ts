import { Component, OnInit, ViewEncapsulation, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { Router } from "@angular/router";
import { ChartConfiguration, ChartOptions, ChartType } from "chart.js";
import { PatientService } from "../patient.service";
import { CoreService } from "src/app/shared/core.service";
import * as moment from "moment";

export interface PeriodicElement {
  patientname: string;
  doctorname: string;
  appointmentstype: string;
  datetime: string;
  symptomorailment: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    patientname: "Myself",
    doctorname: "Cameron Williamson",
    appointmentstype: "Online",
    datetime: "08-21-2022 | 03:50Pm",
    symptomorailment: "Having stress",
  },
  {
    patientname: "Myself",
    doctorname: "Cameron Williamson",
    appointmentstype: "Online",
    datetime: "08-21-2022 | 03:50Pm",
    symptomorailment: "Having stress",
  },
  {
    patientname: "Myself",
    doctorname: "Cameron Williamson",
    appointmentstype: "Online",
    datetime: "08-21-2022 | 03:50Pm",
    symptomorailment: "Having stress",
  },
  {
    patientname: "Myself",
    doctorname: "Cameron Williamson",
    appointmentstype: "Online",
    datetime: "08-21-2022 | 03:50Pm",
    symptomorailment: "Having stress",
  },
  {
    patientname: "Myself",
    doctorname: "Cameron Williamson",
    appointmentstype: "Online",
    datetime: "08-21-2022 | 03:50Pm",
    symptomorailment: "Having stress",
  },
  {
    patientname: "Myself",
    doctorname: "Cameron Williamson",
    appointmentstype: "Online",
    datetime: "08-21-2022 | 03:50Pm",
    symptomorailment: "Having stress",
  },
];

@Component({
  selector: "app-patient-dashboard",
  templateUrl: "./patient-dashboard.component.html",
  styleUrls: ["./patient-dashboard.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PatientDashboardComponent implements OnInit {
  displayedColumns: string[] = [
    "patientname",
    "doctorname",
    "appointmentstype",
    "datetime",
    "symptomorailment",
    "action",
  ];
  dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  //  Line chart
  // public lineChartData: ChartConfiguration<"line">["data"] = {
  //   labels: [
  //     "10/15/2022",
  //     "10/18/2022",
  //     "10/20/2022",
  //     "10/26/2022",
  //     "10/26/2022",
  //     "10/26/2022",
  //   ],
  //   datasets: [
  //     {
  //       data: [0, 200, 150, 170, 300, 350],
  //       label: "Series A",
  //       fill: false,
  //       tension: 0.4,
  //       borderWidth: 1,
  //       borderColor: "#1EA7FF",
  //       pointBackgroundColor: "#1EA7FF",
  //       pointHoverBorderColor: "#1EA7FF",
  //     },
  //   ],
  // };
  // public lineChartOptions: ChartOptions<"line"> = {
  //   responsive: true,
  // };
  // public lineChartLegend = false;

  dates: any;
  averagePulse: any;

  // Line chart
  public lineChartData: ChartConfiguration<"line">["data"];
  public lineChartOptions: ChartOptions<"line"> = {
    responsive: true,
  };
  public lineChartLegend = false;
  userID: any = "";
  height: any;
  weight: any;
  blood_group: any;
  bmi: any;
  pulse: any;
  bp: any;
  resp: any;
  temp: any;
  h_rate: any;
  allAppointmentList: any[] = [];
  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;

  countUpcomingAppointment: any;
  todaysCountAppointment: any;

  public date: moment.Moment;


  startDate: any = "";
  consulation_filter: any = "";
  appointment_filter: any = "TODAY";


  totalMontlypayment: any;
  allTotalPayment: any = 0;

  constructor(private route: Router, private service: PatientService, private _coreService: CoreService) {
    const userData = this._coreService.getLocalStorage("loginData");
    this.userID = userData._id;
    // this.checkForPlan();
  }

  ngOnInit(): void {
    // this.getAllVitals();
    // this.appointmentList();
    // this.upcomingAppointmentCount();
    // this.todaysAppointmentCount();
    // this.getallplanPriceforMonthly();
    // this.getTotalPayment();
  }

  async checkForPlan() {
    let isPurchased = await this.service.isPlanPurchesdByPatient(
      this.userID
    ); //check fot purchased plan

    if (!isPurchased) {
      this._coreService.showError('No plan purchsed! Please purches new plan', '')
      this.route.navigate(["/patient/subscriptionplan"]);
      return;
    }
  }

  getAllVitals() {
    const params = {
      patientId: this.userID
    }

    this.service.getPatientVitals(params).subscribe((res: any) => {
      const decryptedData = this._coreService.decryptObjectData({ data: res });
      let bodyData = decryptedData?.data[0];
      this.height = bodyData?.height ? bodyData?.height : 0;
      this.weight = bodyData?.weight ? bodyData?.weight : 0;
      this.h_rate = bodyData?.h_rate ? bodyData?.h_rate : 0;
      this.bmi = bodyData?.bmi ? bodyData?.bmi : 0;
      this.bp = bodyData?.bp ? bodyData?.bp : 0;
      this.pulse = bodyData?.pulse ? bodyData?.pulse : 0;
      this.resp = bodyData?.resp ? bodyData?.resp : 0;
      this.temp = bodyData?.temp ? bodyData?.temp : 0;

      // Chart functionality
      const pulseData = decryptedData?.data.map((entry) => ({
        date: new Date(entry.createdAt),
        pulse: parseInt(entry.pulse),
        height: parseInt(entry.height),
        weight: parseInt(entry.weight),
        h_rate: parseInt(entry.h_rate),
        bp: parseInt(entry.bp)
      }));
      // Calculate average pulse values for each unique date
      const averageData = {};
      pulseData.forEach(entry => {
        const dateString = entry.date.toISOString().split('T')[0]; // Extract date part only
        if (!averageData[dateString]) {
          averageData[dateString] = { pulseSum: 0, heightSum: 0, weightSum:0,h_rateSum:0,bpSum:0, count: 0 };
        }
        averageData[dateString].pulseSum += entry.pulse;
        averageData[dateString].heightSum += entry.height;
        averageData[dateString].weightSum += entry.weight;
        averageData[dateString].h_rateSum += entry.h_rate;
        averageData[dateString].bpSum += entry.bp;
        averageData[dateString].count++;
      });

      // Calculate average and create data for line chart
      const labels = [];
      const pulseChartdata = [];
      const heightChartData = [];
      const weightChartData = [];
      const heartChartData = [];
      const bpChartData = [];
      for (const date in averageData) {
        if (averageData.hasOwnProperty(date)) {
          labels.push(date);
          const averagePulse = averageData[date].pulseSum / averageData[date].count;
          const averageHeight = averageData[date].heightSum / averageData[date].count;
          const averageWeight = averageData[date].weightSum / averageData[date].count;
          const averageHeartrate = averageData[date].h_rateSum / averageData[date].count;
          const averageBp = averageData[date].bpSum / averageData[date].count;
          pulseChartdata.push(averagePulse);
          heightChartData.push(averageHeight);
          weightChartData.push(averageWeight);
          heartChartData.push(averageHeartrate);
          bpChartData.push(averageBp);
        }
      }

      // Update lineChartData with labels and data
      this.lineChartData = {
        labels: labels,
        datasets: [
          {
            data: pulseChartdata,
            label: "Pulses",
            fill: false,
            tension: 0.4,
            borderWidth: 1,
            borderColor: "#1EA7FF",
            pointBackgroundColor: "#1EA7FF",
            pointHoverBorderColor: "#1EA7FF",
          },
          {
            data: heightChartData,
            label: "Height",
            fill: false,
            tension: 0.4,
            borderWidth: 1,
            borderColor: "#dc3545",
            pointBackgroundColor: "#dc3545",
            pointHoverBorderColor: "#dc3545",
          },
          {
            data: weightChartData,
            label: "Weight",
            fill: false,
            tension: 0.4,
            borderWidth: 1,
            borderColor: "#198754",
            pointBackgroundColor: "#198754",
            pointHoverBorderColor: "#198754",
          },
          {
            data: heartChartData,
            label: "Heart Rate",
            fill: false,
            tension: 0.4,
            borderWidth: 1,
            borderColor: "#6610f2",
            pointBackgroundColor: "#6610f2",
            pointHoverBorderColor: "#6610f2",
          },
          {
            data: bpChartData,
            label: "BP",
            fill: false,
            tension: 0.4,
            borderWidth: 1,
            borderColor: "#fd7e14",
            pointBackgroundColor: "#fd7e14",
            pointHoverBorderColor: "#fd7e14",
          }
      ],
      };

    })
  }

  appointmentList() {
    let data = {
      patient_portal_id: this.userID,
      status: this.appointment_filter,
      // status: "UPCOMING",
      consultation_type: this.consulation_filter,
      date: this.startDate,
      page: this.page,
      limit: this.pageSize
    };
    this.service.patientAppointmentList(data).subscribe((res: any) => {
      let data = this._coreService.decryptObjectData({ data: res });
      this.totalLength = data?.data?.totalCount;
      this.dataSource = data?.data?.data.slice(0, 5);
      this.allAppointmentList = data?.data?.data;
    });
  }

  handleAppointmentType(event: any) {
    let obj = {
      0: "TODAY",
      1: "UPCOMING",
      2: "PAST",
      3: "REJECTED"
    }
    this.appointment_filter = obj[event.index];
    this.appointmentList();
  }

  upcomingAppointmentCount() {
    let data = {
      patient_portal_id: this.userID,
      // status: this.appointment_filter,
      status: "UPCOMING",
      consultation_type: this.consulation_filter,
      date: this.startDate
    };

    this.service.getPatientAppointmentss(data).subscribe((res: any) => {
      let data = this._coreService.decryptObjectData({ data: res });
      this.countUpcomingAppointment = data?.data?.totalCount;
    });
  }

  todaysAppointmentCount() {
    let data = {
      patient_portal_id: this.userID,
      status: "TODAY",
      consultation_type: this.consulation_filter,
      date: this.startDate
    };

    this.service.getPatientAppointmentss(data).subscribe((res: any) => {
      let data = this._coreService.decryptObjectData({ data: res });
      this.todaysCountAppointment = data?.data?.totalCount;
    });
  }

  getallplanPriceforMonthly() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1; // Adding 1 since getMonth() returns zero-based index

    var startDate = new Date(year, month - 1, 1).toISOString();
    var endDate = new Date(year, month, 0).toISOString();

    let myJson = {
      patientId: this.userID,
      createdDate: startDate,
      updatedDate: endDate,
      order_type: ""
    }
    this.service.getallplanPriceforPatient(myJson).subscribe(async (res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      let mydata = await response.body;
      this.totalMontlypayment = response?.body?.totalPlanPrice ? response?.body?.totalPlanPrice : 0;
    });
  }

  getTotalPayment() {

    let myJson = {
      patientId: this.userID,
      createdDate: "",
      updatedDate: "",
      order_type: ""
    };

    this.service.getallplanPriceforPatient(myJson).subscribe(async (res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      let mydata = await response.body;
      this.allTotalPayment = response?.body?.totalPlanPrice ? response?.body?.totalPlanPrice : 0;
    });


  }
}
