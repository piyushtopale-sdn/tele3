import { Component, ChangeDetectorRef} from "@angular/core";
import {  Router } from "@angular/router";
import { CoreService } from "src/app/shared/core.service";
import { FormBuilder,FormGroup} from "@angular/forms";
import { DatePipe } from "@angular/common";
import { DateAdapter } from "@angular/material/core";
import { IndiviualDoctorService } from "../indiviual-doctor.service";

@Component({
  selector: 'app-admin-appointment',
  templateUrl: './admin-appointment.component.html',
  styleUrls: ['./admin-appointment.component.scss']
})
export class AdminAppointmentComponent {
  displayedColumns: string[] = [
    "patientname",
    "doctorName",
    "appointmentId",
    "appdateandtime",
    "status",
    "patientconfirmation",
    "action",
  ];
  dataSource: any[] = [];
  userList: any[] = [];
  page: any = 1;
  pageSize: number = 10;
  totalLength: number = 0;
  searchText: any = "";
  selectedStatus: any = "ALL";
  dateFilter: any = "";
  dateCancelAppointmentForm: any = FormGroup;
  userID: any;
  userName: any;
  sortColumn: string = 'createdAt';
  sortOrder: 1 | -1 = -1;
  sortIconClass: string = 'arrow_upward';
  selecteduser: any = 'all';
  dateRangeForm: FormGroup;
  fromDate: string = '';
  toDate: string = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly doctorService: IndiviualDoctorService,
    private readonly coreService: CoreService,
    private readonly dateAdapter: DateAdapter<Date>    ,
    private readonly router: Router,
    private readonly datePipe: DatePipe,
    private readonly cdr: ChangeDetectorRef,


  ) {
    this.dateAdapter.setLocale('en-GB');

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });

    const userData = this.coreService.getLocalStorage("loginData");
    this.userID = userData._id;
    this.userName = userData.fullName;
  

    
  }

  ngOnInit(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.dateRangeForm.patchValue({
      fromDate: firstDay,
      toDate: lastDay
    });

    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(lastDay);
    this.getDoctorUserList();
    this.getAppointmentlist(`${this.sortColumn}:${this.sortOrder}`);


  }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    if(this.selecteduser === undefined){
      this.selecteduser = 'all';
    }
    this.getAppointmentlist(`${column}:${this.sortOrder}`);
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
    if(this.selecteduser === undefined){
      this.selecteduser = 'all';
    }
    this.getAppointmentlist();

  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  async getAppointmentlist(sort: any = '') {
    if(this.selecteduser === undefined) {
      return;
    }
    let reqData = {
      doctorId: this.selecteduser,
      limit: this.pageSize,
      page: this.page,
      status: this.selectedStatus,
      date: this.dateFilter,
      sort: sort,
      fromDate: this.fromDate,
      toDate: this.toDate
    };

    this.doctorService.appoinmentListApi(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);
      
      if(response.status){      
        this.dataSource = response?.data?.data;  
        this.totalLength = response?.data?.totalRecords;
      }

    });
  }

  handleSelectFliterList(event: any) {
    this.selectedStatus = event.value;
    if(this.selecteduser === undefined){
      this.selecteduser = 'all';
    }
    this.getAppointmentlist();
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    if(this.selecteduser === undefined){
      this.selecteduser = 'all';
    }
    this.getAppointmentlist();
  }

  getDoctorUserList(): void {
    this.doctorService.getAllDoctor().subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });

      if (response.status) {
        this.userList = [];
        const arr = response?.body;
        arr.map((curentval: any) => {
          this.userList.push({
            label: curentval?.full_name,
            value: curentval?.for_portal_user,
          });
        });
      }

    });
  }

  onSelect2Change(event: any): void {
    this.selecteduser = event.value;
    this.getAppointmentlist();
  }
  route_to_details(id){
    this.router.navigate(['/individual-doctor/appointment/appointmentdetails', id],{
      queryParams :{
        type : 'doctor-admin'
      }
    });
  }

  goTOEmr(id){
    this.router.navigate([`/individual-doctor/patientmanagement/details/${id}`])
  }

  myFilter = (d: Date | null): boolean => {
    return true;
  };
  ngAfterViewChecked() {
    this.cdr.detectChanges(); // This forces Angular to re-run change detection.
  }


  clearSelect2() {
    this.selecteduser = 'all';  
    this.getAppointmentlist();
    this.getDoctorUserList();
  }
}
