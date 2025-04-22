import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  TemplateRef,
} from "@angular/core";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { MatTabGroup } from "@angular/material/tabs";
import { Router } from "@angular/router";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  fromEvent,
  tap,
} from "rxjs";
import { IResponse } from "src/app/shared/classes/api-response";
import { CoreService } from "src/app/shared/core.service";
import { SuperAdminPharmacyService } from "../../super-admin-pharmacy.service";
import {
  IPharmacyDetails,
  IPharmacyListRequest,
  IPharmacyListResponse,
  IVerifyStatus,
  IPharmacyData,
  IPharmacyApproveRequest,
  IPharmacyApproveResponse,
  IPharmacyLockRequest,
} from "./pharmacylist.type";
import { InsuranceManagementService } from "../../super-admin-insurance.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { PharmacyService } from "src/app/modules/pharmacy/pharmacy.service";
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";


@Component({
  selector: "app-pharmacylist",
  templateUrl: "./pharmacylist.component.html",
  styleUrls: ["./pharmacylist.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PharmacylistComponent implements OnInit {
  // Pending request table
  pendingdisplayedColumns: string[] = [
    // "joined_date",
    "pharmacy_name",
    "licence_id",
    // "email",
    "phone_number",
    "address",
    "lock_user",
    "action",
  ];
  pendingdataSource: MatTableDataSource<IPharmacyData> = null;
  @ViewChild("lockOrUnloackmodal") lockOrUnloackmodal: TemplateRef<any>;

  isSubmitted: boolean = false;

  pageSize: number = 10;
  totalLength: number = 0;
  page: number = 1;
  verifyStatus: IVerifyStatus = "PENDING";
  statusList: IVerifyStatus[] = ["PENDING", "APPROVED", "DECLINED"];
  startDate: string = null;
  endDate: string = null;
  pharmacyList: any[] = []
  newPharmacy_form : FormGroup;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("statusTab", { static: false }) tab: MatTabGroup;
  @ViewChild("searchName", { static: true }) input: ElementRef;
  public selectedTabIndex = 0;
  public searchText = "";
  public indexId: number;
  userID: any = "";

  sortColumn: string = 'createdAt';
  // sortOrder: 1 | -1 = 1;
  sortOrder: 1 | -1 = -1;
  sortIconClass: string = 'arrow_upward';
  innerMenuPremission:any=[];
  loginrole: any;
  tabNumber: any;
  pharmacyId: any;
  isEmailValid = false;
  lock_status :any = "Lock";
  pharmId: any;
  ngAfterViewInit() {
    // server-side search
    fromEvent(this.input.nativeElement, "keyup")
      .pipe(
        filter(Boolean),
        debounceTime(180),
        distinctUntilChanged(),
        tap((text) => {
          this.searchText = this.input.nativeElement.value;
        })
      )
      .subscribe({
        next: (event: { target: { value: string } }) => {
          this.searchText = event.target.value;
          this.resetPagination();
          this.getPharmacyList();
        },
      });
  }

  constructor(
    private pharmacyService: SuperAdminPharmacyService,
    private service : PharmacyService,
    private coreService: CoreService,
    private _route: Router,
    private modalService: NgbModal,
    private superAdminService: InsuranceManagementService,
    private loader: NgxUiLoaderService,
    private _formBuilder: FormBuilder,

  ) {
    const userData = this.coreService.getLocalStorage("loginData");
    this.userID = userData._id;
    this.loginrole = this.coreService.getLocalStorage("adminData").role;
   
  }


  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1? -1 : 1;
    this.sortIconClass = this.sortOrder === 1? 'arrow_upward' : 'arrow_downward';
    this.getPharmacyList(`${column}:${this.sortOrder}`);

  }

  ngOnInit(): void {
    this.resetDate();
    this.clearSearch();
    // this.recentPharmacyList();
    this.getPharmacyList(`${this.sortColumn}:${this.sortOrder}`);

    if (this.pendingdisplayedColumns.indexOf("action") == -1) {

      this.pendingdisplayedColumns.splice(6, 0, "action")
    }
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 300);
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission(){
    let userPermission = this.coreService.getLocalStorage("adminData").permissions;
    if(userPermission){    
    let menuID = sessionStorage.getItem("currentPageMenuID");
    let checkData = this.findObjectByKey(userPermission, "parent_id",menuID)
    if(checkData){
      if(checkData.isChildKey == true){
        var checkSubmenu = checkData.submenu;      
        if (checkSubmenu.hasOwnProperty("pharmacy")) {
          this.innerMenuPremission = checkSubmenu['pharmacy'].inner_menu;

        } else {
        }
      }else{
        var checkSubmenu = checkData.submenu;
        let innerMenu = [];
        for (let key in checkSubmenu) {
          innerMenu.push({name: checkSubmenu[key].name, slug: key, status: true});
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
    }else {
      return true;
    }
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };
  private recentPharmacyList(): void {
    this.resetPagination();
    this.getPharmacyList();
  }

  public onTabChanged(data: { index: number }): void {
    this.tabNumber = data.index  
    this.pendingdisplayedColumns = [
      "joined_date",
      "pharmacy_name",
      "licence_id",
      "email",
      "phone_number",
      "address",
      // "lock_user",
      // "action",
    ];
    this.verifyStatus = this.statusList[this.tabNumber];

    if (this.tabNumber == 1) {
      if (this.pendingdisplayedColumns.indexOf("status") == -1) {

        this.pendingdisplayedColumns.splice(6, 0, "status")
      }
      if (this.pendingdisplayedColumns.indexOf("lock_user") == -1) {

        this.pendingdisplayedColumns.splice(7, 0, "lock_user")
      }
      if (this.pendingdisplayedColumns.indexOf("action") == -1) {

        this.pendingdisplayedColumns.splice(8, 0, "action")
      }

    }
    if (this.tabNumber == 0) {
      if (this.pendingdisplayedColumns.indexOf("action") == -1) {

        this.pendingdisplayedColumns.splice(6, 0, "action")
      }

    }
    if (this.tabNumber == 2) {
      if (this.pendingdisplayedColumns.indexOf("action") == -1) {

        this.pendingdisplayedColumns.splice(6, 0, "action")
      }

    }
    this.recentPharmacyList();
  
  }

  public onEndDateChange(data: MatDatepickerInputEvent<Date>): void {
    this.recentPharmacyList();
  }

  public onStartDateChange(data: MatDatepickerInputEvent<Date>): void {
    this.recentPharmacyList();
  }

  public handlePageEvent(data: { pageIndex: number; pageSize: number }): void {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.verifyStatus = this.statusList[this.selectedTabIndex];
    this.getPharmacyList();
  }

  public handlePageEvent1(data: { pageIndex: number; pageSize: number }): void {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
  }

  private resetPagination(): void {
    this.page = 1;
    // this.paginator.pageIndex=;
    this.paginator.firstPage()
    this.totalLength = 0;
  }

  private resetDate(): void {
    this.startDate = this.lastYearDate();
    this.endDate = new Date().toISOString();
  }

  private clearSearch(): void {
    this.searchText = "";
    this.input.nativeElement.value = "";
  }

  public clearAll(): void {
    this.resetDate();
    this.clearSearch();
    this.recentPharmacyList();
  }

  public onChangeLockUser(event: any, id: any) {
    this.pharmId = id
    if (event.checked === false) {
      this.lock_status = "Unlock";
    } else {
      this.lock_status = "Lock";
    }

    this.modalService.open(this.lockOrUnloackmodal);
  }
  private lastYearDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString();
  }

  private getPharmacyList(sort:any =''): void {
    const listRequest: IPharmacyListRequest = {
      page: this.page,
      limit: this.pageSize,
      name: this.searchText,
      status: "APPROVED",     
      sort:sort
    };
    this.pharmacyService.listPharmacyAdmin(listRequest).subscribe({
      next: (res) => {
        let pharmacyList: IPharmacyData[] = [];
        let encryptedData = { data: res };
        let result = this.coreService.decryptObjectData(encryptedData);
        this.pharmacyList = result.data.data.map((data: IPharmacyDetails) => ({
          pharmacy_name: data.pharmacy_name,
          licence_id: data?.licence_details?.id_number || "",
          email: data?.for_portal_user?.email,
          phone_number: data?.for_portal_user?.phone_number,
          address: data.address,
          lock_user: data?.for_portal_user?.lock_user,
          isActive: data?.for_portal_user?.isActive,
          createdAt: data?.for_portal_user?.createdAt,
          id: data?._id,
          portal_user_id: data?.for_portal_user?._id
        }));
        this.pendingdataSource = new MatTableDataSource<IPharmacyData>(
          this.pharmacyList
        );
        this.totalLength = result.data.totalCount;
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
      },
    });
  }

  public pharmacyAction(index: number, verify_status: IVerifyStatus): void {
    const actionRequest: IPharmacyApproveRequest = {
      // approved_or_rejected_by: "63763d9eda5f0a2708aff9fe",
      approved_or_rejected_by: this.userID,
      id: this.pendingdataSource.data[index].id,
      verify_status
    };
    this.loader.start();
    this.pharmacyService.approvePharmacy(actionRequest).subscribe({
      next: (res: IResponse<IPharmacyApproveResponse>) => {
        let encryptedData = { data: res };
        let result = this.coreService.decryptObjectData(encryptedData);
        this.loader.stop();
        this.coreService.showSuccess("", verify_status + " Profile Successfully");

        // this.superAdminService.addAssociationData(data).subscribe(
        //   (res: any) => {
        //     const decryptedData = this._coreService.decryptObjectData(res);
        //     this._coreService.showSuccess(decryptedData.message, "Success");
        //     // this.route.navigate(['/super-admin/insurance']);

        //     this.saveSubMenusInfo(completeSubmenuData);
        //     this._route.navigate(["/hospital/managedoctor"]);
        //   },
        //   (err) => {
        //   }
        // );
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
        this.loader.stop();
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
      complete: () => {
        this.getPharmacyList();
      }
    });
  }

  updatePharmacyLock(data:any) {
    const actionRequest: IPharmacyLockRequest = {
      id: this.pharmId,
      lock_user:data
    };
    this.pharmacyService.lockPharmacy(actionRequest).subscribe({
      next: (res: IResponse<IPharmacyApproveResponse>) => {
        let encryptedData = { data: res };
        let result = this.coreService.decryptObjectData(encryptedData);
        if(result.status){
          this.coreService.showSuccess("", "Updated Profile Successfully");
          this.closePopup();
        }
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
        if (err.message === "INTERNAL_SERVER_ERROR") {
          this.coreService.showError("", err.message);
        }
      },
      // complete: () => {
      //   this.getPharmacyList();
      // }
    });
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.getPharmacyList();
  }

  private updatePharmacystatus(index: number, status: boolean): void {
    const actionRequest: any = {
      id: this.pendingdataSource.data[index].portal_user_id,
      action_name: 'active',
      action_value: status
    };
    this.loader.start();
    this.pharmacyService.activedeletePharmacy(actionRequest).subscribe({
      next: (res: any) => {
        let encryptedData = { data: res };
        let result = this.coreService.decryptObjectData(encryptedData);
        if(result.status){
          this.coreService.showSuccess("", result.message);
        }else{
          this.coreService.showError("", result.message);
        }
        
      },
      error: (err: ErrorEvent) => {

        this.coreService.showError("", err.message);
        this.loader.stop();
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
      complete: () => {
        this.getPharmacyList();
      }
    });
  }

  DeletePharmacy(): void {

    const actionRequest: any = {
      id: this.pendingdataSource.data[this.indexId].portal_user_id,
      action_name: 'delete',
      action_value: true
    };
    this.loader.start();
    this.pharmacyService.activedeletePharmacy(actionRequest).subscribe({
      next: (res: any) => {
        let encryptedData = { data: res };
        let result = this.coreService.decryptObjectData(encryptedData);
        this.loader.stop();
        this.closePopUp();
        this.coreService.showSuccess("", "Profile Status has been Successfully deleted");
      },
      error: (err: ErrorEvent) => {
        this.loader.stop();
        this.coreService.showError("", err.message);
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
      complete: () => {
        this.getPharmacyList();
      }
    });
  }
  //  Delete modal
  openVerticallyCentereddetale(deletemodal: any, id: any) {
    this.indexId = id;
    this.modalService.open(deletemodal, { centered: true, size: "md" });
  }
  public individualPharmacyDetails(index: number) {
    let id = this.pendingdataSource.data[index].id
    this._route.navigate(['/super-admin/pharmacy/details/', id, this.selectedTabIndex])

  }

  openVerticallyCenteredreject(reject: any, i: number) {
    this.indexId = i;
    this.modalService.open(reject, { centered: true, size: 'md', windowClass: "reject_data" });
  }

  openVerticallyCenteredapproved(approved: any, i: number) {
    this.indexId = i;
    this.modalService.open(approved, {
      centered: true,
      size: 'md',
      windowClass: "approved_data",
      keyboard: false,
      backdrop: false
    });
  }

  approveRejectPharmacy(verify_status: IVerifyStatus) {
    this.pharmacyAction(this.indexId, verify_status);
    this.closePopUp();
    if (verify_status === 'APPROVED') {
      this._route.navigate([`/super-admin/pharmacy/permission/${this.pendingdataSource.data[this.indexId].portal_user_id}`])
    } else {
      this._route.navigate(['/super-admin/pharmacy'])
    }
  }

  closePopUp() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);

  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

}
