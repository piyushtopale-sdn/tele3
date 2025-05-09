import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { MatTabGroup } from "@angular/material/tabs";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { LabimagingdentalopticalService } from "../../super-admin/labimagingdentaloptical.service";
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
  experience: string;
}
const PENDING_ELEMENT_DATA: PendingPeriodicElement[] = [];



@Component({
  selector: 'app-admin-all-lab-radio',
  templateUrl: './admin-all-lab-radio.component.html',
  styleUrls: ['./admin-all-lab-radio.component.scss'],
  encapsulation: ViewEncapsulation.None,

})
export class AdminAllLabRadioComponent {
// Pending request table
pendingdisplayedColumns: string[] = [
  // "doctorname",
  "licenceid",
  // "email",
  "phonenumber",
  "address",
  // "action",
];
pendingdataSource = new MatTableDataSource<PendingPeriodicElement>(
  PENDING_ELEMENT_DATA
);

@ViewChild(MatPaginator) paginator: MatPaginator;
portalId: any;
tabNumber: number;
  userType: any;
ngAfterViewInit() {
  this.pendingdataSource.paginator = this.paginator;
   
}

superAdminId: any;
labId: any = "";
abc: any = "Lock";
def:any = "Active";


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


// sortColumn: string = 'full_name';
// sortOrder: 1 | -1 = 1;
sortColumn: string = 'for_portal_user.createdAt';
sortOrder: 1 | -1 = -1;
sortIconClass: string = 'arrow_upward';
innerMenuPremission:any=[];
loginrole: any;
isEmailValid = false;
newPortal_form: FormGroup

@ViewChild("lockOrUnloackmodal") lockOrUnloackmodal: TemplateRef<any>;
@ViewChild("activeOrInactivemodal") activeOrInactivemodal: TemplateRef<any>;
@ViewChild("statusTab", { static: false }) tab: MatTabGroup;
constructor(
  private readonly modalService: NgbModal,
  private readonly coreService: CoreService,
  private readonly fb: FormBuilder,
  private readonly toastr: ToastrService,
  private readonly labimagingdentaloptical :LabimagingdentalopticalService,
  private readonly loader: NgxUiLoaderService
  
) {
  this.loginrole = this.coreService.getLocalStorage("adminData").role;
  let loginData = JSON.parse(localStorage.getItem("loginData"));
   
  this.userType = loginData?.type; 

  this.newPortal_form = this.fb.group({
    first_name: ["", [Validators.required]],
    middle_name: [""],
    last_name: ["", [Validators.required]],
    email: ["", [
      Validators.required,
      Validators.email,
      Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$"),
    ],]
  });
  this.newPortal_form.get('email').valueChanges.subscribe(value => {
    this.isEmailValid = this.newPortal_form.get('email').valid;
  });
}

onSortData(column:any) {
  this.sortColumn = column;
  this.sortOrder = this.sortOrder === 1? -1 : 1;
  this.sortIconClass = this.sortOrder === 1? 'arrow_upward' : 'arrow_downward';
  this.getLabList(`${column}:${this.sortOrder}`);
}

ngOnInit(): void {
  let adminData = JSON.parse(localStorage.getItem("loginData"));
  this.superAdminId = adminData?._id;
  this.resetDate();
  this.getLabList(`${this.sortColumn}:${this.sortOrder}`);
}


findObjectByKey(array, key, value) {
  return array.find(obj => obj[key] === value);
}

checkInnerPermission(){
  let userPermission = this.coreService.getLocalStorage("adminData").permissions;
  if(userPermission){

    let menuID = sessionStorage.getItem("currentPageMenuID");
    let checkData = this.findObjectByKey(userPermission, "parent_id",menuID)
    let checkSubmenu;
    if(checkData){
      if(checkData.isChildKey){
        checkSubmenu = checkData.submenu;      
        if (checkSubmenu.hasOwnProperty("pharmacy")) {
          this.innerMenuPremission = checkSubmenu['pharmacy'].inner_menu;

        }
      }else{
         checkSubmenu = checkData.submenu;
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

private   getLabList(sort:any=''): void {
  this.pushColumns();
  let reqData = {
    page: this.page,
    limit: this.pageSize,
    status: "APPROVED",
    searchText: this.searchText,     
    sort:sort,
    type :  this.userType
  };

  this.labimagingdentaloptical.laboratoryList(reqData).subscribe(async (res) => {
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
  this.endDate= (data.value).toISOString();
  this.getLabList()
}

public onStartDateChange(data: MatDatepickerInputEvent<Date>): void {
  this.startDate = (data.value).toISOString();
  this.getLabList()  
}

private resetDate(): void {
  this.startDate = this.lastYearDate();
  this.endDate = new Date().toISOString();
}

activeLockDeleteLab(action: string, value: boolean) {
  let reqData = {
    doctor_portal_id: this.labId,
    action_name: action,
    action_value: value,
    type: 'Laboratory'
  };
  this.loader.start();

  this.labimagingdentaloptical.activeLockDeleteLabimagingdentaloptical(reqData).subscribe(
    (res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.closePopup();
      
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
  this.labId = id;
  if (event.checked === false) {
    this.abc = "Unlock";
  } else {
    this.abc = "Lock";
  }
  this.modalService.open(this.lockOrUnloackmodal);
}

public onChangestatus(event: any, id: any) {
  this.labId = id;
  if (event.checked === false) {
    this.def = "InActive";
  } else {
    this.def = "Active";
  }
  this.modalService.open(this.activeOrInactivemodal);
}

closePopup() {
  this.modalService.dismissAll("close");
  this.getLabList();
}

handleSearchFilter(text: any) {
  this.page = 1;
  this.searchText = text.trim();
  this.getLabList()
}



clearFilter() {
  this.searchText = "";
  this.resetDate();
  this.getLabList();
}

public onTabChanged(data: { index: number }): void {
  this.tabNumber = data.index;
  this.resetPagination();
  this.verifyStatus = this.statusList[this.tabNumber];
  this.getLabList();  
}

private resetPagination(): void {
  this.page = 1;
  this.pageSize = 5;
  this.totalLength = 0;
}

//  Approved modal
openVerticallyCenteredapproved(approved: any, id: any) {
  this.labId = id;
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
  this.labId = id;
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
  this.labId = id;
  this.modalService.open(deletemodal, { centered: true, size: "md" });
}

public handlePageEvent(data: { pageIndex: number; pageSize: number }): void {
  
  this.page = data.pageIndex + 1;
  this.pageSize = data.pageSize;
  this.verifyStatus = this.statusList[this.selectedTabIndex];
  this.getLabList();

}

myFilter = (d: Date | null): boolean => {
  // const day = (d || new Date()).getDay();
  // Prevent Saturday and Sunday from being selected.
  // return day !== 0 && day !== 6;
  return true;
};

pushColumns() {

    this.displayedColumns = ['doctorname',...this.pendingdisplayedColumns,'action'];
  
}

}


