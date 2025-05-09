import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from "@angular/forms";
import { DatePipe } from "@angular/common";
import * as XLSX from "xlsx";
import { FourPortalService } from "../../four-portal.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { IndiviualDoctorService } from "src/app/modules/individual-doctor/indiviual-doctor.service";
import { DateAdapter, ThemePalette } from "@angular/material/core";

export interface PeriodicElement {
  dateofcreations: string;
  patientname: string;
  assigndoctorname: string;
  orderid: string;
  dateandtime: string;
  location: string;
  appointmentstype: string;
  reasonforappt: string;
  fee: string;
  status: string;
}
const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: 'app-appopintment-list',
  templateUrl: './appopintment-list.component.html',
  styleUrls: ['./appopintment-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppopintmentListComponent implements OnInit {
  showscheduler: any = false;

  appointments = new FormControl("");
  appointmentList: string[] = ["ONLINE", "FACE_TO_FACE", "HOME_VISIT"];

  displayedColumns: string[] = [
    "patientname",
    "patientmrn",
    "prescribeBy",
    "tests",
    "appointmenId",
    "dateandtime",
    "status",
    // "approval",
    "action",
  ];
  dataSource: any[] = [];
  isSubmitted: boolean = false;
  appointmentId: any = "";
  page: any = 1;
  pageSize: number = 10;
  totalLength: number = 0;
  searchText: any = "";
  selectedStatus: any = "ALL";
  dateFilter: any = "";
  Fromdate: any;
  ToDate: any;
  sortColumn: string = 'createdAt';
  sortOrder: 1 | -1 = -1;
  sortIconClass: string = 'arrow_upward';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  @ViewChild("canceldaterangeappointment")
  canceldaterangeappointment: ElementRef;
  @ViewChild("rejectappointment") rejectappointment: ElementRef;

  @ViewChild("picker") picker: any;
  public date: moment.Moment;
  public disabled = false;
  public showSpinners = true;
  public showSeconds = false;
  public touchUi = false;
  public enableMeridian = false;
  public minDate = new Date();
  public maxDate = new Date();
  public stepHour = 1;
  public stepMinute = 1;
  public stepSecond = 1;
  public color: ThemePalette = "primary";
  public formGroup = new FormGroup({
    date: new FormControl(null, [Validators.required]),
    date2: new FormControl(null, [Validators.required]),
  });
  public dateControl = new FormControl();
  public dateControlMinMax = new FormControl(new Date());

  public options = [
    { value: true, label: "True" },
    { value: false, label: "False" },
  ];

  public listColors = ["primary", "accent", "warn"];

  public stepHours = [];
  public stepMinutes = [];
  public stepSeconds = [];

  timeHourValue: any = [
    { name: "0 Hour", value: 0 },
    { name: "1  Hour", value: 1 },
    { name: "2  Hour", value: 2 },
    { name: "3  Hour", value: 3 },
    { name: "4  Hour", value: 4 },
    { name: "5  Hour", value: 5 },
    { name: "6  Hour", value: 6 },
    { name: "7  Hour", value: 7 },
    { name: "8  Hour", value: 8 },
    { name: "9  Hour", value: 9 },
    { name: "10 Hour", value: 10 },
    { name: "11 Hour", value: 11 },
    { name: "12 Hour", value: 12 },
    { name: "13 Hour", value: 13 },
    { name: "14 Hour", value: 14 },
    { name: "15 Hour", value: 15 },
    { name: "16 Hour", value: 16 },
    { name: "17 Hour", value: 17 },
    { name: "18 Hour", value: 18 },
    { name: "19 Hour", value: 19 },
    { name: "20 Hour", value: 20 },
    { name: "21 Hour", value: 21 },
    { name: "22 Hour", value: 22 },
    { name: "23 Hour", value: 23 },
  ];
  timeMinuteValue: any = [
    { name: "0  Minute", value: 0 },
    { name: "5  Minute", value: 5 },
    { name: "10  Minute", value: 10 },
    { name: "15  Minute", value: 15 },
    { name: "20  Minute", value: 20 },
    { name: "25  Minute", value: 25 },
    { name: "30  Minute", value: 30 },
    { name: "35  Minute", value: 35 },
    { name: "40  Minute", value: 40 },
    { name: "45  Minute", value: 45 },
    { name: "50  Minute", value: 50 },
    { name: "55  Minute", value: 55 },
    { name: "59  Minute", value: 59 }
  ];
  listData: any;
  user_id: any;
  currentDate: any = new Date();
  doctor_staff: any;
  userType: any;
  speciality: any;
  serviceType: string;
  userRole: any;
  dateRangeForm: FormGroup;
  fromDate: string = '';
  toDate: string = ''

  userID: any = "";
  choose_slot: any;
  value = new Date();
  innerMenuPremission: any = [];
  currentUrl:any=[]
  constructor(
    private readonly modalService: NgbModal,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly coreService: CoreService,
    private readonly toastr: ToastrService,
    private readonly router: Router,
    private readonly loader: NgxUiLoaderService,
    private readonly datePipe: DatePipe,
    private readonly fourPortalService: FourPortalService,
    private readonly service: IndiviualDoctorService,
    private readonly dateAdapter: DateAdapter<Date>    ,


  ) {
    this.dateAdapter.setLocale('en-GB');

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });
    
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.user_id = loginData?._id
    let type = localStorage.getItem("type");

    this.userType = type;

    if (type === 'Laboratory') {
      this.serviceType = 'lab';
    } else if (type === 'Radiology') {
      this.serviceType = 'radiology';

    }
    this.userRole = loginData?.role;


  }

  ngAfterViewChecked() {
    this.cdr.detectChanges(); // This forces Angular to re-run change detection.
  }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.getAppointmentlist(`${column}:${this.sortOrder}`);
    this.paginator.firstPage();

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

    const dateObject1 = new Date(this.currentDate);
    dateObject1.setHours(0, 0, 0, 0);

    this.currentDate = dateObject1;
    this.getAppointmentlist(`${this.sortColumn}:${this.sortOrder}`);
    setTimeout(() => {
      this.checkInnerPermission();
    }, 2000);
    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl);
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission() {

    let userPermission = this.coreService.getLocalStorage("loginData").permissions;

    if (userPermission) {
      let menuID = sessionStorage.getItem("currentPageMenuID");
      let checkData = this.findObjectByKey(userPermission, "parent_id", menuID)
      let checkSubmenu;
      if (checkData) {
        if (checkData.isChildKey) {

          checkSubmenu = checkData.submenu;

          if (checkSubmenu.hasOwnProperty("claim-process")) {
            this.innerMenuPremission = checkSubmenu['claim-process'].inner_menu;

          }

        } else {
          checkSubmenu = checkData.submenu;

          let innerMenu = [];

          for (let key in checkSubmenu) {

            innerMenu.push({ name: checkSubmenu[key].name, slug: key, status: true });
          }

          this.innerMenuPremission = innerMenu;

        }
      }
    }


  }
  giveInnerPermission(value) {
    if (this.userRole === "STAFF") {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    } else {
      return true;
    }

  }
  async getAppointmentlist(sort: any = '') {                                    //Fixed Pagination KAN-417
    let reqData = {
      limit: this.pageSize,
      page: this.page,
      status: this.selectedStatus,
      serviceType: this.serviceType,
      searchText: this.searchText,
      fromDate: this.fromDate,
      toDate: this.toDate,
      sort: sort,
    };    
    this.fourPortalService.fourPortal_appointment_list(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);      
      if (response.status) {
        this.dataSource = response?.data?.data;
        this.totalLength = response?.data?.totalRecords;
      }
    });
  }

  approveOrRejectedAppointment(status: any, reason: any) {

    let reqData = {
      appointmentId: this.appointmentId,
      cancelReason: reason,
      status: status,
      cancelledOrAcceptedBy: this.user_id,
      cancel_by: this.serviceType
    };
    this.loader.start();
    this.fourPortalService.fourPortal_cancel_approved_appointment(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.loader.stop();
          this.closePopup();
          this.toastr.success(response.message);
          this.getAppointmentlist();
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.loader.stop();
        this.closePopup();
        this.toastr.error(errResponse.message);
      }
    );
  }

  handleSelectFliterList(event: any) {
    this.selectedStatus = event.value;
    this.page = 1;
    this.paginator.firstPage();
    this.getAppointmentlist();
  }


  handleSelectDateFilter(event: any) {
    let date = this.datePipe.transform(event.value, "YYYY-MM-dd");
    this.dateFilter = date;
    this.getAppointmentlist();
  }

  clearDateFilter() {
    this.dateFilter = "";
    this.getAppointmentlist();
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1 ;
    this.pageSize = data.pageSize;
    this.getAppointmentlist();
  }
  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted = false;
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }



  dateRangeModal: any;

  // Date Range modal modal
  openVerticallyCenteredselectdaterange(select_daterangecontent: any) {
    this.dateRangeModal = this.modalService.open(select_daterangecontent, {
      centered: true,
      size: "md",
      windowClass: "date_range",
    });
  }


  //  Cancel Appoinment modal
  openVerticallyCenteredcancelappointment(cancelappintmentcontent: any) {


    this.modalService.open(cancelappintmentcontent, {
      centered: true,
      size: "lg",
      windowClass: "cancel_appointment",
    });
  }

  //  Approved modal
  openVerticallyCenteredapproved(approved: any, appointmentId: any, portalId: any) {
    this.appointmentId = appointmentId;
    this.modalService.open(approved, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
    });
  }

  showDateModal: any;
  //  cancel date range appointment modal
  openVerticallyCenteredcancelDateRange(canceldaterangeappointment: any) {
    this.showDateModal = this.modalService.open(canceldaterangeappointment, {
      centered: true,
      size: "md",
      windowClass: "canceldaterangeappointment",
    });
  }

  rejectModal: any;

  //  Reject Appointment modal
  openVerticallyCenteredrejectappointment(
    rejectappointment: any,
    appointment_id: any,
    portalId: any
  ) {
    this.appointmentId = appointment_id;

    this.rejectModal = this.modalService.open(rejectappointment, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }
  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  //-------Form Array Handling--------------->


  navigateToAppointmentDetails(appointmentId: any) {
    const navigationExtras = {
      queryParams: {
        type: 'consultationModal',
      },
    };


    this.router.navigate([`/portals/appointment/${this.userType}/appointment-details/${appointmentId}`], navigationExtras);

  }

  goTo_details(id: any) {
    if (this.userType === "Radiology") {

      this.router.navigate([`/portals/manage-result/${this.userType}/radio-details/${id}`]);
    }

    if (this.userType === "Laboratory") {
      this.router.navigate([`/portals/manage-result/${this.userType}/lab-details/${id}`]);

    }

  }


  exportManageTest() {
    let data: any = [];

    let reqData = {
      limit: 0,
      page: 1,
      status: this.selectedStatus,
      fromDate: this.fromDate,
      toDate: this.toDate,
      searchText: this.searchText,
      serviceType: this.serviceType
    }    
    this.fourPortalService.export_appointment_list(reqData)
      .subscribe((res) => {
        let result = this.coreService.decryptObjectData({ data: res });    
        if (result.status) {
          this.loader.stop();
          let array = [
            "Patient Name",
            "Patient MRN",
            "Prescribed By",
            "Order ID",
            "Order Date & Time",
            "Status",
            "Tests",
          ];
          data = result.data.array
          data.unshift(array);
          let fileName = 'OrderList.xlsx';
          const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          XLSX.writeFile(wb, fileName);
        }
      });

  }
  onNavigate(url: any): void {
    const menuitems = JSON.parse(localStorage.getItem("activeMenu"));
    this.currentUrl = url;

    const matchedMenu = menuitems.find(
      (menu) => menu.route_path === this.currentUrl,
    );
    this.router.navigate([url]).then(() => {
      this.service.setActiveMenu(matchedMenu.name);
    });
  }

  handleSearch(event: any) {
    this.searchText = event.target.value.trim();
    this.page = 1;
    this.getAppointmentlist();    
    this.paginator.firstPage();
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

    this.getAppointmentlist();

  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

}
