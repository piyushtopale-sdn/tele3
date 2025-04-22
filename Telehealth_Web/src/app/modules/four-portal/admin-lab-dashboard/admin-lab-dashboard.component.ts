import { DatePipe } from '@angular/common';
import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as XLSX from "xlsx";
import { DateAdapter } from '@angular/material/core';
import { CoreService } from 'src/app/shared/core.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SuperAdminService } from '../../super-admin/super-admin.service';
import { LabimagingdentalopticalService } from '../../super-admin/labimagingdentaloptical.service';
import { MatPaginator } from '@angular/material/paginator';
encapsulation: ViewEncapsulation.None

@Component({
  selector: 'app-admin-lab-dashboard',
  templateUrl: './admin-lab-dashboard.component.html',
  styleUrls: ['./admin-lab-dashboard.component.scss']
})
export class AdminLabDashboardComponent {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  
  displayedColumns: string[] = [
    "createdAt",
    "couponCode",
    "testName",
    "centreName",
    "patientName",
    "mrnNumber"
  ];
  dataSource:any[]=[];
  dateRangeForm: FormGroup;
  fromDate: string = '';
  toDate: string = '';
  totalNew: any;
  totalCompletedOrder: any;
  totalIncompletedOrder: any;
  listData: any[] = []
  userList: any[] = [];
  pageSize: number = 10;
  totalLength: number = 0;
  page: number = 1;
  selecteduser: string | null = null;
  selectedStatus: any = 'ALL';
  portalType: any;
  lab_radioCouponList:any [] = [];
  selectedcouponCodeId: any = '';
  overlay:false;
  exportedListData:any[] =[];
  invoiceCancellationCount: any = 0;
  exportCancellationRecords:any[]=[];

  constructor(
    private service: SuperAdminService,
    private datepipe: DatePipe,
    private dateAdapter: DateAdapter<Date>,
    private fb: FormBuilder,
    private _coreService: CoreService,
    private labimagingdentaloptical: LabimagingdentalopticalService,
    private loader: NgxUiLoaderService,


  ) {
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy
    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });
    let userType = this._coreService.getLocalStorage("loginData")
    if(userType){
      this.portalType = userType.type;
    }
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
    this.labDashboardCount();
    this.getInvoiceCancellationData();
    this.getLabRadioDiscountList();
    this.getLAbUserList();
    this.getCouponDetailsList();
    this.labRadioOrderList();
  }


  labDashboardCount() {
    let data = {}  
    if(this.portalType === 'Laboratory') {
      data ={
        fromDate: this.fromDate,
        toDate: this.toDate,
        type: 'lab' 
      }
    }else{
      data ={
        fromDate: this.fromDate,
        toDate: this.toDate,
        type: 'radiology' 
      }
    }
    if (this.selecteduser) {
      data['labRadioId'] = this.selecteduser;
    }
    this.service.dashboard_labRadioCount(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      
      if (response.status) {
        this.totalNew = response?.body?.totalNewOrder;
        this.totalCompletedOrder = response?.body?.totalCompletedOrder;
        this.totalIncompletedOrder = response?.body?.totalIncompletedOrder;
      }
    })
  }


  labRadioOrderList() {
    let type_ = '';
    if(this.portalType === 'Laboratory') {
      type_ = 'lab';
    }else{
      type_ = 'radiology'
    }
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      type: type_,
      page: 1,
      limit: 0,
      status: ''
    }
    if (this.selecteduser) {
      data['labRadioId'] = this.selecteduser;
    }
    this.service.dashboard_labRadioList(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);  
      if (response.status) {
        this.listData = response?.data?.data;
      }
    }
    )
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getCouponDetailsList();
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

    this.labDashboardCount();
    this.getInvoiceCancellationData();
    this.getCouponDetailsList(this.selectedcouponCodeId);
    this.labRadioOrderList();

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
    this.labDashboardCount();
    // this.labList();
  }

  onSelect2Change(event: any): void {
    this.selecteduser = event.value;
    this.labDashboardCount();
    this.labRadioOrderList();
  }


  getLAbUserList(): void {
    let reqData = {     
      type: this.portalType
    };
    this.labimagingdentaloptical.getLAbRadioUserList(reqData).subscribe(async (res) => {
      let response = await this._coreService.decryptObjectData({ data: res });

      if (response.status) {
        this.userList = []; 
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
      type: 'lab',
      page: this.page,
      limit: this.pageSize,
      status: this.selectedStatus
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

  getLabRadioDiscountList() {
    let reqData ={
      page:  1,
      limit: 0,
      searchText: '',
      status: '',
    }
    this.service.getDiscountLab(reqData).subscribe((res) => {
        let response = this._coreService.decryptObjectData({ data: res });        
        if (response.status) {
          let allDisscountPlans = response?.body?.result;
          this.lab_radioCouponList = [];
          allDisscountPlans.map((curentval: any) => {
            this.lab_radioCouponList.push({
              label: curentval?.couponCode,
              value: curentval?._id,
            });
          });
        }
    });
  }
  onCouponChange(event: any) {
    if (!event?.value || event.value.trim() === '') {
      return; 
    }  
    this.selectedcouponCodeId = event.value.trim();
    this.getCouponDetailsList(this.selectedcouponCodeId);    
  }

  clearSelect() {    
   this.selectedcouponCodeId = "";
   this.getCouponDetailsList(); 
  }

  getCouponDetailsList(id:any ='') {
    let reqData ={
      page:  this.page,
      limit: this.pageSize,
      discountCouponId:id,
      fromDate: this.fromDate,
      toDate: this.toDate,    
    }
    this.service.getLabRadioDiscountCoupon(reqData).subscribe((res) => {      
      let response = this._coreService.decryptObjectData({ data: res });   
         if (response.status) {
         this.dataSource = response?.body?.result;
         this.totalLength = response?.body?.totalRecords;
         this.exportedListData = response?.body?.exportedListData;
        }
    });
  }

    exportToExcel() {
      const formattedData = this.exportedListData.map(item => ({
        'Applied Date':this.formatDate__(item.createdAt),
        'Coupon Code':item.discountCoupon ?? "",
        'Discount(%)':item.percentOff ?? "",
        'Test Name':item.testName ?? "",
        'Test Price(SAR)':item.testPrice ?? "", 
        'Lonic Code':item?.loincCode ?? "",
        'Centre Name':item.center_name ?? "",
        'Centre Mobile':item.center_mobile ?? "",
        'Centre Email':item.center_email ?? "",
        "Patient Name":item.patientName ?? "",
        "MRN Number":item.mrnNumber ?? "",        
      }));
  
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    
      ws['!cols'] = [
        { wch: 20 }, // Full Name
        { wch: 25 }, // Full Name Arabic
        { wch: 30 }, // Email
        { wch: 15 }, // Country Code
        { wch: 15 }  // Mobile
      ];
    
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      const fileName = `LabradioTest_CouponList.xlsx`;
    
      XLSX.utils.book_append_sheet(wb, ws, 'Discount Coupons');
    
      XLSX.writeFile(wb, fileName);
    }

    formatDate__(date: Date): string {
      return this.datepipe.transform(date, 'dd-MM-yyyy | hh:mm') || '';
    }

  getInvoiceCancellationData() {
    let reqData ={      
      fromDate: this.fromDate,
      toDate: this.toDate,    
    }
    this.service.getLabRadioTestInvoiceCancellation(reqData).subscribe((res) => {      
      let response = this._coreService.decryptObjectData({ data: res });   
      if (response.status) {
        this.invoiceCancellationCount = response?.body?.totalRecords;
        this.exportCancellationRecords = response?.body?.exportedListData;
      }
    });
  }

  exportCancellationData(){
    const formattedData = this.exportCancellationRecords.map(item => ({
      'Order Date':this.formatDate__(item?.createdAt),
      "Patient Name":item.patientName ?? "",
      "MRN Number":item.mrnNumber ?? "",   
      "Patient Mobile":item?.patientMobile ?? "",  
      'Doctor Name':item.doctorName ?? "",     
      'Test Name':item.testName ?? "",
      'Test Price(SAR)':item.testPrice ?? "", 
      'Lonic Code':item?.loincCode ?? "",
      'Centre Name':item.center_name ?? "",
      'Centre Mobile':item.center_mobile ?? "",
      'Centre Email':item.center_email ?? "",
      'Cancellation Date':this.formatDate__(item?.cancellation_date)         
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
  
    ws['!cols'] = [
      { wch: 20 }, // Full Name
      { wch: 25 }, // Full Name Arabic
      { wch: 30 }, // Email
      { wch: 15 }, // Country Code
      { wch: 15 }  // Mobile
    ];
  
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Invoice-Cancellation-List.xlsx`;
  
    XLSX.utils.book_append_sheet(wb, ws, 'Discount Coupons');
  
    XLSX.writeFile(wb, fileName);
  }

  exportOrderListDataAsPerStatus(status:any){
    const filteredData = this.listData.filter((ele: any) => status.includes(ele.status));    
    if(filteredData.length > 0){
    const formattedData = filteredData.map(data => ({
      'Order Date': this.formatDate__(data?.createdAt),
      'Patient Name': data?.patientName ?? "",
      'PrescribeBy': data?.doctorName ?? "",
      'Order ID': data?.appointmentId ?? "",
      'Center Name':data?.centreName ?? "",
      'Center Location': data?.centreLocation ?? "",
      "Tests Name": Array.isArray(data?.labTestName) && data.labTestName.length > 0
      ? data.labTestName.join(", "): Array.isArray(data?.radiologyTestName) ? data.radiologyTestName.join(", ") : data.radiologyTestName ?? "",
      'Order Date/Time': data?.consultationDate + "|" + data?.consultationTime,
      'Status': data?.status ?? ""        
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
  
    ws['!cols'] = [
      { wch: 20 }, // Full Name
      { wch: 25 }, // Full Name Arabic
      { wch: 30 }, // Email
      { wch: 15 }, // Country Code
      { wch: 15 }  // Mobile
    ];
  
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `${this.portalType}-${status}-OrderList.xlsx`;
  
    XLSX.utils.book_append_sheet(wb, ws, 'OrderList');
  
    XLSX.writeFile(wb, fileName);
  }
  }
}

