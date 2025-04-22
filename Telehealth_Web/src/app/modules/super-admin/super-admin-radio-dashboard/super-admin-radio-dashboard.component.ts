import { DatePipe } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as XLSX from "xlsx";
import { DateAdapter } from '@angular/material/core';
import { SuperAdminService } from '../super-admin.service';
import { CoreService } from 'src/app/shared/core.service';
import { LabimagingdentalopticalService } from '../labimagingdentaloptical.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Router } from '@angular/router';

@Component({
  selector: 'app-super-admin-radio-dashboard',
  templateUrl: './super-admin-radio-dashboard.component.html',
  styleUrls: ['./super-admin-radio-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class SuperAdminRadioDashboardComponent {
  displayedColumns: string[] = [
    "patientname",
    "centreName",
    "location",
    "prescribeBy",
    "orderName",
    "orderDateandTime",
    "completedDateandTime",
    "status"
  ];
  dateRangeForm: FormGroup;
  fromDate: string = '';
  toDate: string = '';
  totalOrder: any;
  totalCompletedOrder: any;
  totalIncompletedOrder: any;
  listData: any[] = []
  pageSize: number = 5;
  totalLength: number = 0;
  page: number = 1;
  userList:any[] =[];
  selecteduser: string | null = null;
  selectedStatus: any = 'ALL';
  currentUrl:any = [];
  
  constructor(
    private service: SuperAdminService,
    private datepipe: DatePipe,
    private dateAdapter: DateAdapter<Date>,
    private fb: FormBuilder,
    private _coreService: CoreService,
    private labimagingdentaloptical :LabimagingdentalopticalService,
    private loader: NgxUiLoaderService,
    private router: Router,


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
    this.radioDashboardCount();
    this.radioTestList();
    this.getRadioList();

    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl);
  }


  radioDashboardCount() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      type: 'radiology',
    }
    if (this.selecteduser) {
      data['labRadioId'] = this.selecteduser;
    }
    this.service.dashboard_labRadioCount(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.totalOrder = response?.body?.totalOrder;
        this.totalCompletedOrder = response?.body?.totalCompletedOrder;
        this.totalIncompletedOrder = response?.body?.totalIncompletedOrder;
      }
    })
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.radioTestList();
  }

  radioTestList() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      type: 'radiology',     
      page: this.page,
      limit: this.pageSize,
      status: this.selectedStatus
    }
    if (this.selecteduser) {
      data['labRadioId'] = this.selecteduser;
    }
    this.service.dashboard_labRadioList(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.listData = response?.data?.data;
        this.totalLength = response?.data?.totalRecords
      }

    }
    )
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

    this.radioDashboardCount();
    this.radioTestList();

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
    this.radioDashboardCount();
    this.radioTestList();
  }

  onSelect2Change(event: any): void {    
    this.selecteduser = event.value;
    this.radioDashboardCount();
    this.radioTestList();
  }

  handleSelectFliterList(event: any) {
    this.selectedStatus = event.value;
    this.radioTestList();
  }
  getRadioList(): void {
    let reqData = { 
      type : "Radiology"
    };
    this.labimagingdentaloptical.getLAbRadioUserList(reqData).subscribe(async (res) => {
      let response = await this._coreService.decryptObjectData({ data: res });

      if(response.status){
        const arr = response?.body;          
          arr.map((curentval: any) => {
            this.userList.push({
              label: curentval?.centre_name,
              value: curentval?._id,
            });
          });
        
      }
     
    });
  }

  exportList() {
    var data: any = [];
    this.pageSize = 0;

    let reqData = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      type: 'radiology',     
      page: this.page,
      limit: this.pageSize,
      status: this.selectedStatus,
      labRadioId:this.selecteduser
    }
    this.service.export_labbRadioList(reqData)
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

  onNavigate(url: any): void {
    const menuitems = JSON.parse(localStorage.getItem("activeMenu"));
    this.currentUrl = url;
  
    const findMenuItem = (menuItems, url) => {
      for (const menu of menuItems) {
        if (menu.route_path === url) {
          return menu; 
        }
  
        if (menu.children && menu.children.length > 0) {
          const matchedChild = findMenuItem(menu.children, url);
          if (matchedChild) {
            return matchedChild;
          }
        }
      }
      return null; 
    };
  
    const matchedMenu = findMenuItem(menuitems, this.currentUrl);
  
    if (matchedMenu) {
      this.router.navigate([url]).then(() => {
        this.service.setActiveMenu(matchedMenu.name);
      });
    } else {
      console.error("No matching menu found for URL:", this.currentUrl);
    }
  }
}
