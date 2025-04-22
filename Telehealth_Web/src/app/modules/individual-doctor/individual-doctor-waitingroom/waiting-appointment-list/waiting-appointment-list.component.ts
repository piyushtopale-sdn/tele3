import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService } from 'src/app/modules/patient/patient.service';
import { CoreService } from 'src/app/shared/core.service';
import { IndiviualDoctorService } from '../../indiviual-doctor.service';

export interface PeriodicElement {
  patientname: string;
  appointmentId: string;
  datetime: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    patientname: "Myself",
    appointmentId: "#1515411215",    
    datetime: "08-21-2022   |    03:50Pm",    
  },

];

@Component({
  selector: 'app-waiting-appointment-list',
  templateUrl: './waiting-appointment-list.component.html',
  styleUrls: ['./waiting-appointment-list.component.scss']
})
export class WaitingAppointmentListComponent {
  displayedColumns: string[] = [
    "patientname",   
    "appointmentId",   
    "datetime",   
    "action"
  ];
  dataSource :any=[]

  doctor_id: any = "";

  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;

  sortColumn: string = 'patientDetails.patientFullName';
  sortOrder: 1 | -1 = 1;
  sortIconClass: string = 'arrow_upward';
  currentUrl : any = [];

  constructor(
    private doctorService: IndiviualDoctorService,
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
    this.doctor_id = loginData._id;

    this.getUpcomingAppointments(`${this.sortColumn}:${this.sortOrder}`);
    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl)
  }

  getUpcomingAppointments(sort:any='') {
    let reqData = {
      date: "",
      limit: this.pageSize,
      page: this.page,
      doctor_portal_id: this.doctor_id,
      status: "APPROVED",
      sort:''
    };


    this.doctorService.appoinmentListApi(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.dataSource = response?.data?.data
      this.totalLength=response?.data?.totalRecords

    });
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getUpcomingAppointments()
  }
  routeToCalendar(id:any){
    this.router.navigate([`/individual-doctor/waiting-room/calender`],{
      queryParams :{
        appointmentId :id,
        
      }
    })
  }
  onNavigate(url:any): void {
    const menuitems = JSON.parse(localStorage.getItem('activeMenu'))
     this.currentUrl = url
   
    const matchedMenu = menuitems.find(menu => menu.route_path === this.currentUrl);
    this.router.navigate([url]).then(() => {
      
      this.doctorService.setActiveMenu(matchedMenu?.name);
    });
   
  }
  
}
