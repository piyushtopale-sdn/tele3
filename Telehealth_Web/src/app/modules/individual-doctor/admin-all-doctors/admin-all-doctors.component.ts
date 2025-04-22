import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { Router } from "@angular/router";
import { MatTabGroup } from "@angular/material/tabs";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { SuperAdminIndividualdoctorService } from "../../super-admin/super-admin-individualdoctor.service";

export type IVerifyStatus = "APPROVED" | "PENDING" | "DECLINED";
// Pending request table
export interface PendingPeriodicElement {
  doctorname: string;
  licenceid: number;
  specialty: string;
  licencevalidity: string;
  email: string;
  phonenumber: string;
  province: string;
  // department: string;
  // service: string;
  // unit: string;
  experience: string;
}

const PENDING_ELEMENT_DATA: PendingPeriodicElement[] = [];




@Component({
  selector: 'app-admin-all-doctors',
  templateUrl: './admin-all-doctors.component.html',
  styleUrls: ['./admin-all-doctors.component.scss'],
  encapsulation: ViewEncapsulation.None,

})
export class AdminAllDoctorsComponent {
  // Pending request table
  pendingdisplayedColumns: string[] = [
    // "doctorname",
    // "licenceid",
    // "specialty",
    // "licencevalidity",
    "email",
    "phonenumber",
    // "province",
    // "department",
    // "service",
    // "unit",
    // "experience",
    // "lockuser",
    // "action",
  ]; 
  pendingdataSource = new MatTableDataSource<PendingPeriodicElement>(
    PENDING_ELEMENT_DATA
  );

  @ViewChild(MatPaginator) paginator: MatPaginator;
  tabNumber: number;
  ngAfterViewInit() {
    this.pendingdataSource.paginator = this.paginator;

  }
  superAdminId: any;
  doctorId: any = "";
  abc: any = "Lock";
  def: any = "Active";


  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;
  isSubmitted: boolean = false;
  verifyStatus: IVerifyStatus = "PENDING";
  statusList: IVerifyStatus[] = ["PENDING", "APPROVED", "DECLINED"];
  public selectedTabIndex = 0;

  searchText = "";

  startDate: string = null;
  endDate: string = null;
  displayedColumns: string[];
  insuranceDoctordisplayedColumns: string[];



  // sortColumn: string = 'full_name';
  sortColumn: string = 'for_portal_user.createdAt';

  // sortOrder: 1 | -1 = 1;
  sortOrder: 1 | -1 = -1;

  sortIconClass: string = 'arrow_upward';
  innerMenuPremission: any = [];
  loginrole: any;
  isEmailValid = false;
  @ViewChild("lockOrUnloackmodal") lockOrUnloackmodal: TemplateRef<any>;
  @ViewChild("activeOrInactivemodal") activeOrInactivemodal: TemplateRef<any>;
  @ViewChild("statusTab", { static: false }) tab: MatTabGroup;
  constructor(
    private modalService: NgbModal,
    private doctorService: SuperAdminIndividualdoctorService,
    private coreService: CoreService,
    private toastr: ToastrService,
    private route: Router,
    private loader: NgxUiLoaderService
  ) {
    this.loginrole = this.coreService.getLocalStorage("adminData").role;   
  }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.getDoctorsList(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    let adminData = JSON.parse(localStorage.getItem("loginData"));
    this.superAdminId = adminData?._id;
    this.resetDate();
    // this.getDoctorsList(`${this.sortColumn}:${this.sortOrder}`);
    this.getDoctorsList(`${this.sortColumn}:${this.sortOrder}`);


    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 300);
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission() {
    let userPermission = this.coreService.getLocalStorage("adminData").permissions;
    if (userPermission) {

      let menuID = sessionStorage.getItem("currentPageMenuID");
      let checkData = this.findObjectByKey(userPermission, "parent_id", menuID)
      if (checkData) {
        if (checkData.isChildKey == true) {
          var checkSubmenu = checkData.submenu;
          if (checkSubmenu.hasOwnProperty("pharmacy")) {
            this.innerMenuPremission = checkSubmenu['pharmacy'].inner_menu;
          } 
        } else {
          var checkSubmenu = checkData.submenu;
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
    if (this.loginrole === 'STAFF_USER') {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    } else {
      return true;
    }
  }


  private getDoctorsList(sort: any = ''): void {
    this.pushColumns();
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      status: "APPROVED",
      searchText: this.searchText,
      from_date: this.startDate,
      to_date: this.endDate,
      sort: sort,
      docRole: ''
    };
    this.doctorService.doctorsList(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      this.totalLength = await response?.data?.totalCount;

      this.pendingdataSource = new MatTableDataSource<PendingPeriodicElement>(
        response?.data?.data
      );
    });
  }

  private lastYearDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString();
  }

  public onEndDateChange(data: MatDatepickerInputEvent<Date>): void {
    this.endDate = (data.value).toISOString();
    this.getDoctorsList()
  }

  public onStartDateChange(data: MatDatepickerInputEvent<Date>): void {
    this.startDate = (data.value).toISOString();
    this.getDoctorsList()
  }

  private resetDate(): void {
    this.startDate = this.lastYearDate();
    this.endDate = new Date().toISOString();
  }

  approveOrRejectDoctor(action: any) {
    let reqData = {
      verify_status: action,
      approved_or_rejected_by: this.superAdminId,
      doctor_portal_id: this.doctorId,
    };
    this.loader.start();

    this.doctorService.approveOrRejectDoctor(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.loader.stop();
          this.toastr.success(response.message);
          this.closePopup();
          this.getDoctorsList();
          if (action === "APPROVED") {
            this.route.navigate([
              "/super-admin/doctor/permission",
              this.doctorId,
            ]);
          }
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.loader.stop();
        this.toastr.error(errResponse.message);
      }
    );
  }

  activeLockDeleteDoctor(action: string, value: boolean) {
    let reqData = {
      doctor_portal_id: this.doctorId,
      action_name: action,
      action_value: value,
    };
    this.loader.start();

    this.doctorService.activeLockDeleteDoctor(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.loader.stop();
          this.toastr.success(response.message);
          this.closePopup();
          this.getDoctorsList();
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.loader.stop();
        this.toastr.error(errResponse.message);
      }
    );
  }

  handleToggleChange(event: any, id: any) {
    this.doctorId = id;
    if (event.checked === false) {
      this.abc = "Unlock";
    } else {
      this.abc = "Lock";
    }
    this.modalService.open(this.lockOrUnloackmodal);
  }

  public onChangestatus(event: any, id: any) {
    this.doctorId = id;
    if (event.checked === false) {
      this.def = "InActive";
    } else {
      this.def = "Active";
    }
    this.modalService.open(this.activeOrInactivemodal);
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.getDoctorsList();
  }

  handleSearchFilter(text: any) {
    this.searchText = text.trim();
    this.getDoctorsList()
  }



  clearFilter() {
    this.searchText = "";
    this.resetDate();
    this.getDoctorsList();
  }

  public onTabChanged(data: { index: number }): void {
    this.tabNumber = data.index

   
      this.resetPagination();
      this.verifyStatus = this.statusList[this.tabNumber];
      this.getDoctorsList();
    
  }

  private resetPagination(): void {
    this.page = 1;
    this.pageSize = 5;
    this.totalLength = 0;
  }

  //  Approved modal
  openVerticallyCenteredapproved(approved: any, id: any) {
    this.doctorId = id;
    this.modalService.open(approved, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
      keyboard: false,
      backdrop: false,
    });
  }

  //  Reject modal
  openVerticallyCenteredreject(reject: any, id: any) {
    this.doctorId = id;
    this.modalService.open(reject, {
      centered: true,
      size: "md",
      windowClass: "reject_data",
      keyboard: false,
      backdrop: false,
    });
  }

  //  Delete modal
  openVerticallyCentereddetale(deletemodal: any, id: any) {
    this.doctorId = id;
    this.modalService.open(deletemodal, { centered: true, size: "md" });
  }

  public handlePageEvent(data: { pageIndex: number; pageSize: number }): void {

    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.verifyStatus = this.statusList[this.selectedTabIndex];
    this.getDoctorsList();
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  pushColumns() {
    if (this.verifyStatus === 'PENDING') {
      this.displayedColumns = ['doctorname', ...this.pendingdisplayedColumns, 'action'];
    }   
  }


}
