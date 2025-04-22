import { Component, OnInit } from "@angular/core";
import { CoreService } from "src/app/shared/core.service";
import { PatientService } from "../../patient.service";
import { Router } from '@angular/router';

export interface PeriodicElement {
  patientname: string;
  orderid: string;
  doctorname: string;
  appointmentstype: string;
  datetime: string;
  reasonforappointment: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    patientname: "Myself",
    orderid: "#1515411215",
    doctorname: "Cameron Williamson",
    appointmentstype: "Online",
    datetime: "08-21-2022   |    03:50Pm",
    reasonforappointment: "Having stress",
  },

];

@Component({
  selector: "app-patient-upcommingappointment",
  templateUrl: "./patient-upcommingappointment.component.html",
  styleUrls: ["./patient-upcommingappointment.component.scss"],
})
export class PatientUpcommingappointmentComponent implements OnInit {
  displayedColumns: string[] = [
    "patientname",
    // "orderid",
    "doctorname",
    "appointmentstype",
    "datetime",
    "reasonforappointment",
    "action",
  ];
  dataSource :any=[]

  patient_id: any = "";

  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;

  sortColumn: string = 'patientDetails.patientFullName';
  sortOrder: 1 | -1 = 1;
  sortIconClass: string = 'arrow_upward';

  constructor(
    private patientService: PatientService,
    private coreService: CoreService,
    private router: Router
  ) {}


  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1? -1 : 1;
    this.sortIconClass = this.sortOrder === 1? 'arrow_upward' : 'arrow_downward';
    this.getUpcomingAppointments(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.patient_id = loginData._id;

    this.getUpcomingAppointments(`${this.sortColumn}:${this.sortOrder}`);
  }

  getUpcomingAppointments(sort:any='') {
    let reqData = {
      consultation_type: "",
      date: "",
      limit: this.pageSize,
      page: this.page,
      patient_portal_id: this.patient_id,
      status: "APPROVED",
      sort:sort
    };

    this.patientService.patientAppointmentList(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.dataSource = response?.data?.data
      this.totalLength=response?.data?.totalCount

    });
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getUpcomingAppointments()
  }
  routeToCalendar(id:any, portal_type:any){
    this.router.navigate([`/patient/waitingroom/calender`],{
      queryParams :{
        appointmentId :id,
        portal_type:portal_type
      }
    })
  }
}
