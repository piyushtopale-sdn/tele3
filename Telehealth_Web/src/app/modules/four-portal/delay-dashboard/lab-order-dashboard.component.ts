import { DatePipe } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as XLSX from 'xlsx';
import { DateAdapter } from '@angular/material/core';
import { CoreService } from 'src/app/shared/core.service';
import { FourPortalService } from '../four-portal.service';
import { Router } from '@angular/router';
import { IndiviualDoctorService } from '../../individual-doctor/indiviual-doctor.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({
  selector: 'app-lab-order-dashboard',
  templateUrl: './lab-order-dashboard.component.html',
  styleUrls: ['./lab-order-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None

})

export class LabOrderDashboardComponent {
  displayedColumns: string[] = [
    "patientname",
    "prescribeBy",
    "orderName",
    "orderDateandTime",
    "status",
    "action"
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
  userID: any;
  userType: string;
  countData: any;
  currentUrl:any=[]
  orderlistData:any []=[];
  constructor(
    private readonly service: FourPortalService,
    private readonly datepipe: DatePipe,
    private readonly dateAdapter: DateAdapter<Date>,
    private readonly fb: FormBuilder,
    private readonly _coreService: CoreService,
    private readonly router: Router,
    private readonly doctorservice: IndiviualDoctorService,
    private readonly loader: NgxUiLoaderService,


  ) {
    let loginUser = this._coreService.getLocalStorage('loginData')
    this.userID = loginUser?._id;
    let type = localStorage.getItem("type");
    this.userType = type;

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
    this.labList();
    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl);
  }


  labList() {
    let data = {
      // fromDate: this.fromDate,
      // toDate: this.toDate,
      serviceType: 'lab',
      page: this.page,
      limit: this.pageSize,
      status: "ALL"

    }

    this.service.delayDashboardList(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.listData = response?.data?.data;
        this.totalLength = response?.data?.totalRecords;
        this.countData = response?.data?.countRecords;
      }

    }
    )
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.labList();
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

    this.labList();

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

  goTo_details(id: any) {
    this.router.navigate([`/portals/manage-result/${this.userType}/lab-details/${id}`]);
  }
 
  onNavigate(url: any): void {
    const menuitems = JSON.parse(localStorage.getItem("activeMenu"));
    this.currentUrl = url;
  if(menuitems){
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
        this.doctorservice.setActiveMenu(matchedMenu.name);
      });
    } else {
      console.error("No matching menu found for URL:", this.currentUrl);
    }
  }
  }

  labOrderListForExport(status: any = '') {
    if (status === "") {
      return
    }
    let data = {
      limit: 0,
      page: 1,
      status: status,
      serviceType: 'lab'     
    }
    this.loader.start();
    this.service.fourPortal_appointment_list(data).subscribe((res) => {
  
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
  
        this.orderlistData = response?.data?.data;
        if (this.orderlistData.length === 0) {
          return;
        }
        const formattedData = this.orderlistData.map((data, index) => ({
  
          'Patient Name': data?.patientName ?? "",
          'PrescribeBy': data?.doctorName ?? "",
          'Order ID': data?.appointmentId ?? "",
          "Tests Name": Array.isArray(data?.labTestName) ? data.labTestName.join(", ") : data.labTestName ?? "",
          'Order Date/Time': data?.consultationDate + "|" + data?.consultationTime,
          'Status': data?.status ?? ""
  
        }));
  
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
  
        ws['!cols'] = [
          { wch: 20 },
          { wch: 20 },
        ];
  
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        const fileName = `${status}_Lab-Order_List.xlsx`;
  
        XLSX.utils.book_append_sheet(wb, ws, `${status} Lab-Order_List`);
  
        XLSX.writeFile(wb, fileName);
      } else {
  
        this.loader.stop();
      }
  
    }
    )
    this.loader.stop();
  
  }


  formatDate__(date: Date): string {
    return this.datepipe.transform(date, 'yyyy-MM-dd') || '';
  }

  exportDelayOrder() {
    if (this.listData.length === 0) {
      return;
    }
    const formattedData = this.listData.map((data, index) => ({  
      'Patient Name': data?.patientName ?? "",
      'PrescribeBy': data?.doctorName ?? "",
      'Order ID': data?.appointmentId ?? "",
      // "Tests Name": Array.isArray(data?.labTestName) ? data.labTestName.join(", ") : data.labTestName ?? "",
      'Order Date/Time': data?.consultationDate + "|" + data?.consultationTime,
      'Status': data?.status ?? ""

    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    ws['!cols'] = [
      { wch: 20 },
      { wch: 20 },
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Delay_Order_List.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, ` Delay_Order_List`);

    XLSX.writeFile(wb, fileName);
  }

  goTOorder(id)
  {
    this.router.navigate([`portals/manage-result/Laboratory/lab-details/${id}`])
  }
  
}

