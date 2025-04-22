import { Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/shared/core.service';
import { PharmacyService } from '../pharmacy.service';


export interface InsuranceElement {
  personname: string;
  logindatetime: string;
  logouttime: string;
  address:string;
  ipaddress:string;

}

const INSURANCE_DATA: InsuranceElement[] = []


@Component({
  selector: 'app-pharmacy-logs',
  templateUrl: './pharmacy-logs.component.html',
  styleUrls: ['./pharmacy-logs.component.scss']
})
export class PharmacyLogsComponent implements OnInit {
  displayedColumnss: string[] =   [];
  dataSources = INSURANCE_DATA;
  userId: any;
  page: any = 1;
  pageSize: number = 5;
  totalLength: number = 0;

  sortColumn: string = 'userName';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';
  userRole: any;

  constructor( private service: PharmacyService,private _coreService: CoreService,) {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    
    this.userId = loginData?._id;
    this.userRole  = loginData?.role;
    if(this.userRole === 'PHARMACY_ADMIN'){
      this.displayedColumnss = ['personname',  'logindatetime', 'logouttime','address','ipaddress']
    }else{
      this.displayedColumnss =['personname', 'adminname', 'logindatetime', 'logouttime','address','ipaddress']
    }
   }

   onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.getAllLogs(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    this.getAllLogs(`${this.sortColumn}:${this.sortOrder}`);
  }
  getAllLogs(sort: any = ''){
    let reqData ={
      userId :  this.userId,
      limit: this.pageSize,
      page: this.page,
      sort: sort
    }
    this.service.getUserLogs(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if(response.status == true){
        this.dataSources = response?.body?.userData;
        this.totalLength = response?.body?.count;
      }else{
        this._coreService.showError("", response.message)
      }
     
    })
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllLogs();
  }
}
