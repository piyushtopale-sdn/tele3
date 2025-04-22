import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { MatStepper } from "@angular/material/stepper";
import {MatTableDataSource} from '@angular/material/table';
import { Router } from "@angular/router";
import { promises } from "dns";
import { DatePipe } from "@angular/common";
import { PatientService } from "./../patient.service";
export interface PeriodicElement {
  paymentdate: string;
  payment: string;
  doctorname: string;
  appointmentdatetime:string;
  paymentmode:string;
  transactionid:string;
  orderappointmentid:string
}

const ELEMENT_DATA: PeriodicElement[] =[]

@Component({
  selector: 'app-patient-paymenthistory',
  templateUrl: './patient-paymenthistory.component.html',
  styleUrls: ['./patient-paymenthistory.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class PatientPaymenthistoryComponent implements OnInit {
  displayedColumns: string[] = ['paymentdate', 'payment', 'orderappointmentid','paymentmode','transactionid','paymentType'];
  paymentType: any="";
  dataSource = ELEMENT_DATA;
  searchText:any='';
  count:number;
  startDateFilter: any="";
  endDateFilter: any="";
  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;
  totalAmount:number;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  loginUserID: any;

  sortColumn: string = 'createdAt';
  sortOrder: 1 | -1 = 1;
  sortIconClass: string = 'arrow_upward';

  constructor(private modalService: NgbModal,
    private service: PatientService,
    private _coreService: CoreService,
    private toastr: ToastrService,
    private route: Router,
    private datePipe: DatePipe,) {
    let userData = this._coreService.getLocalStorage("loginData");
    this.loginUserID = userData._id;
  
  }
 
  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1? -1 : 1;
    this.sortIconClass = this.sortOrder === 1? 'arrow_upward' : 'arrow_downward';
    this.getPaymentHistoryForPatient(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    this.getPaymentHistoryForPatient(`${this.sortColumn}:${this.sortOrder}`)
  }
  getPaymentHistoryForPatient(sort:any='') {
    let params = {
      searchText:this.searchText,
      order_type:this.paymentType,
      limit: this.pageSize,
      page: this.page,
      createdDate:this.startDateFilter,
      updatedDate:this.endDateFilter, 
      patient_id:this.loginUserID,
      sort:sort 
     
    };
    this.service.getPaymentHistoryForPatient(params).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
     this.dataSource = response?.body?.result.alltransactionlimit;
      this.totalLength = response.body.totalRecords;
      this.totalAmount= response.body.result.totalAmount;
    
    });
  }

  handleSelectStartDateFilter(event: any) {    
    const originalDate = new Date(event.value);
    this.extendDateFormat(originalDate)
    const formattedDate = originalDate.toISOString();
    this.startDateFilter = formattedDate
    const inputDate = new Date(formattedDate);
    const nextDate = inputDate.setHours(23,59,59,59)
    this.endDateFilter = new Date (nextDate).toISOString()
    this.getPaymentHistoryForPatient()
  }
  handleSelectEndDateFilter(event: any) {    
    const originalDate = new Date(event.value);
    this.extendDateFormat(originalDate)     
    const formattedDate = originalDate.toISOString();
    this.endDateFilter = formattedDate
   
  } 


  extendDateFormat(mydate){
    mydate.setHours(mydate.getHours() + 5); // Add 5 hours
    mydate.setMinutes(mydate.getMinutes() + 30);
    return mydate
  }
  myFilter = (d: Date | null): boolean => {
    return true;
  };


  handleFilter(value: any) {
    this.paymentType = value
    this.getPaymentHistoryForPatient();

  }
  clearAll(){
    this.startDateFilter ="";
    this.endDateFilter="";
    this.paymentType ="";
    this.searchText="";
    this.getPaymentHistoryForPatient();
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getPaymentHistoryForPatient();
  }
  handleSearchFilter(text: any) {
    this.searchText = text;
    this.getPaymentHistoryForPatient();
  }

}
