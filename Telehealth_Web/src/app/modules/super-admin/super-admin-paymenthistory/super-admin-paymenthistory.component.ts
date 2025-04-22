import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatOption } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { DateAdapter } from "@angular/material/core";
import { DatePipe } from "@angular/common";
import { CoreService } from 'src/app/shared/core.service';
import { SuperAdminService } from '../super-admin.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import html2pdf from 'html2pdf.js';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IndiviualDoctorService } from '../../individual-doctor/indiviual-doctor.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';


@Component({
  selector: 'app-super-admin-paymenthistory',
  templateUrl: './super-admin-paymenthistory.component.html',
  styleUrls: ['./super-admin-paymenthistory.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class SuperAdminPaymenthistoryComponent implements OnInit {
  startDateFilter: any = "";
  endDateFilter: any = "";
  searchText: any = '';
  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;
  overlay = false;
  displayedColumns: string[] = ['transactiondatetime', 'name', 'mrn_number','paymenttype', 'amount', 'paymentmode', 'status', 'action'];

  dataSource :any[] = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  totalAmount: any;
  paymentType: any = "all";
  paymentBy: any = "";
  userList: any[] = [];

  sortColumn: string = 'createdAt';
  sortOrder: 1 | -1 = -1;
  sortIconClass: string = 'arrow_upward';
  dateRangeForm: FormGroup;
  fromDate: string = "";
  toDate: string = "";
  selecteduser: any ='';
  purchaseDetails: any;
  vatAmount: any = 0;
  totalTestPrice:any =0;
  totalAddonAmount:any=0;
  planPriceAfterDiscount:any =0;
  testPriceAfterDiscount:any = 0;
  
  constructor(
    private patientService: IndiviualDoctorService,
    private superAdminService: SuperAdminService,
    private coreService: CoreService,
    private dateAdapter: DateAdapter<Date>,
    private datepipe: DatePipe,
    private fb: FormBuilder,
    private loader: NgxUiLoaderService,
    private modalService: NgbModal,

  ) {
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });
  }


  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.page = 1; // Reset to first page

    this.getallPaymentHistory(`${column}:${this.sortOrder}`);
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
    this.getallPaymentHistory(`${this.sortColumn}:${this.sortOrder}`)
    this.getAllPatientList();
  }

  getAllPatientList(): void {
    let reqData = {
      page: 1,
      limit: 0,
    };
    this.patientService.getAllPatientForSuperAdmin(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.userList = [];
        const arr = response?.body?.data;
        arr.map((curentval: any) => {
          this.userList.push({
            label: curentval?.full_name + (curentval?.mrn_number ? ` (${curentval.mrn_number})` : ''),
            value: curentval?.portalUserId,
          });
        });
      }
    });
  }

  onSelect2ChangePatient(event: any): void {
    this.selecteduser = event.value;
    this.page = 1;
    if (this.paginator) {
      this.paginator.firstPage();
  }

    if (this.selecteduser) {
      this.getallPaymentHistory();
    }
  }
  clearSelect2() {     
    this.selecteduser = '';
    this.getAllPatientList();
    this.getallPaymentHistory();
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

    this.getallPaymentHistory();

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

  handleSearchFilter(text: any) {
    this.searchText = text.trim();
    this.page = 1;
    this.getallPaymentHistory();
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    const sortString = `${this.sortColumn}:${this.sortOrder}`;
    this.getallPaymentHistory(sortString);
  }


  getallPaymentHistory(sort: any = '') {
    let reqData = {
      limit: this.pageSize,
      page: this.page,
      fromDate:this.fromDate,
      toDate:this.toDate,
      status: this.paymentType,
      patientId:  this.selecteduser ? this.selecteduser : "" ,
      searchText: this.searchText,
      sort: sort

    };
    this.loader.start();
    this.superAdminService.getallPaymentHistory(reqData).subscribe((res) => {
    let response = this.coreService.decryptObjectData({ data: res });      
      if(response.status){
      this.loader.stop();
        this.dataSource = response?.body?.result;
        this.totalLength = response?.body?.totalRecords;
        this.totalAmount = response?.body?.totalAmount;
      }
    });

  }

  handleFilter(value: any) {
    this.paymentType = value;
    this.page = 1;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.getallPaymentHistory();
  }


  openVerticallyCenteredviewInvoice(viewInvoice: any, transId:any) {   
    this.paymentDetails(transId);
    this.modalService.open(viewInvoice, {
      centered: true,
      size: "lg",
      windowClass: "master_modal viewInvoice",
    });

  }

  paymentDetails(id: any) {
    let reqData = {  id:id };
    this.loader.start();
    this.superAdminService.getPaymentDetails(reqData).subscribe((res) => {
    let response = this.coreService.decryptObjectData({ data: res });      
      this.loader.stop();
      if(response.status){
        this.purchaseDetails = response.body;
        if(this.purchaseDetails?.transactionType === 'subscription'){         
          this.planPriceAfterDiscount = this.purchaseDetails?.planPrice - this.purchaseDetails?.discountedAmount; 
          this.vatAmount = (this.planPriceAfterDiscount) * (this.purchaseDetails?.vatCharges) / 100;
        }
        
        if(this.purchaseDetails?.transactionType === 'addon'){
          this.totalAddonAmount = this.purchaseDetails?.addonIndividualPrice * this.purchaseDetails?.addonCount;          
          this.vatAmount = ( this.totalAddonAmount) * (this.purchaseDetails?.vatCharges) / 100;
        }

        if(this.purchaseDetails?.transactionType === 'labRadioTests'){
          this.totalTestPrice = this.purchaseDetails?.testInfo?.reduce((acc: any, ele: { testPrice: any; }) => {
            return acc + (ele?.testPrice || 0);
          }, 0);          
          this.testPriceAfterDiscount = this.totalTestPrice - (this.purchaseDetails?.discountedAmount || 0);          
          this.vatAmount = (this.testPriceAfterDiscount) * (this.purchaseDetails?.vatCharges || 0) / 100;          
        }
        
      }
    });

  }

  downloadPDF() {
    // Get the invoice content using its ID
    const invoiceElement = document.getElementById("invoiceContent");

    if (!invoiceElement) {
      console.error("Invoice content not found!");
      return;
    }

    const options = {
      margin: 10,
      filename: 'Invoice.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { format: 'a4', orientation: 'portrait' },
    };

    console.log("Downloading invoice...", invoiceElement);
    
    // Convert the invoice content to PDF
    html2pdf().from(invoiceElement).set(options).save();
  }
}
