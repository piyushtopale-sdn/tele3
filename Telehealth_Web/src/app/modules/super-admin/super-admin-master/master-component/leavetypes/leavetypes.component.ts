import { Component, OnInit } from "@angular/core";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { SuperAdminService } from "../../../super-admin.service";
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { Router } from "@angular/router";
import * as XLSX from 'xlsx';
import { NgxUiLoaderService } from "ngx-ui-loader";
import { DateAdapter } from "@angular/material/core";
import { DatePipe } from "@angular/common";
@Component({
  selector: 'app-leavetypes',
  templateUrl: './leavetypes.component.html',
  styleUrls: ['./leavetypes.component.scss']
})
export class LeavetypesComponent {

  leavetypedisplayedColumns: string[] = [
    "createdAt",
    "leavetype",
    // "addedby",
    "status",
    "action",
  ];
  leavetypedataSource: any = [];
  leaveTypeForm!: FormGroup;
  isSubmitted: boolean = false;
  editLeaveTypeForm!: FormGroup;
  leaveTypesId: any;
  page: any = 1;
  pageSize: number = 10;
  totalLength: number = 0;
  searchText: any = "";
  userId: any = "";
  selectedFiles: any;

  sortColumn: string = "leave_type";
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';
  innerMenuPremission: any = [];
  loginrole: any;

  dateRangeForm: FormGroup;
  fromDate: string = "";
  toDate: string = "";

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private service: SuperAdminService,
    private _coreService: CoreService,
    private toastr: ToastrService,
    private loader: NgxUiLoaderService,
    private _superAdminService: SuperAdminService,
    private dateAdapter: DateAdapter<Date>,
    private datepipe: DatePipe,


  ) {
    this.leaveTypeForm = this.fb.group({
      leaveTypes: this.fb.array([]),
    });

    let userData = this._coreService.getLocalStorage("loginData");
    this.userId = userData._id;
    this.loginrole = this._coreService.getLocalStorage("adminData").role;
    this.editLeaveTypeForm = this.fb.group({
      leaveTypesId: ["", [Validators.required]],
      leave_type: ["", [Validators.required]],
      leave_type_arabic: ["", [Validators.required]],
      active_status: ["", [Validators.required]],
    });
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });
  }
  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.getAllLeaveTypeList(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    // const now = new Date();
    // const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    // const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // this.dateRangeForm.patchValue({
    //   fromDate: firstDay,
    //   toDate: lastDay
    // });

    // this.fromDate = this.formatDate(firstDay);
    // this.toDate = this.formatDate(lastDay);


    this.addnewLeaveType();
    this.getAllLeaveTypeList(`${this.sortColumn}:${this.sortOrder}`);
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 300);
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission() {
    let userPermission = this._coreService.getLocalStorage("adminData").permissions;
    let menuID = sessionStorage.getItem("currentPageMenuID");
    if (userPermission) {
      let checkData = this.findObjectByKey(userPermission, "parent_id", menuID)
      if (checkData) {
        if (checkData.isChildKey == true) {
          var checkSubmenu = checkData.submenu;
          if (checkSubmenu.hasOwnProperty("health_centre")) {
            this.innerMenuPremission = checkSubmenu['health_centre'].inner_menu;

          } else {
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

  teamExcelForm: FormGroup = new FormGroup({
    specialization_csv: new FormControl("", [Validators.required]),
  });

  getAllLeaveTypeList(sort: any = '') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      userId: this.userId,
      searchText: this.searchText,
      sort: sort,
      fromDate:this.fromDate,
      toDate:this.toDate
    };

    this._superAdminService.leave_type_list_api(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.totalLength = response?.body?.totalCount;
      this.leavetypedataSource = response?.body?.data;

    });
  }
  addLeaveTypes() {
    this.isSubmitted = true;
    if (this.leaveTypeForm.invalid) {
      this._coreService.showError("", "Please fill all the required fields.");
      return;
    }
    this.isSubmitted = false;
    this.loader.start();
    let reqData = {
      leaveTypesArray: this.leaveTypeForm.value.leaveTypes,
      added_by: this.userId,
    };
    this._superAdminService.add_leaveType_api(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };

      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.getAllLeaveTypeList();
        this.closePopup();
      } else if (response.status === false) {
        this.loader.stop();
        this._coreService.showError(response.message, "");
        this.modalService.dismissAll();
        this.closePopup();

      }
      this.loader.stop();
    });
  }
  updateLeaveTypes() {
    this.isSubmitted = true;
    if (this.editLeaveTypeForm.invalid) {
      this._coreService.showError("", "Please fill all the required fields.");
      return;
    }
    this.isSubmitted = false;
    this.loader.start();
    this._superAdminService
      .update_leave_type_api(this.editLeaveTypeForm.value)
      .subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);

        if (response.status) {
          this.loader.stop();
          this.getAllLeaveTypeList();
          this.toastr.success(response.message);
          this.closePopup();
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      });
  }
  selectedLeaveTypes: any = [];

  action_leaveTypes(isDeleteAll: any = "") {
    let reqData = {
      leaveTypesId: this.leaveTypesId,
      action_name: "delete",
      action_value: true,
    };
    this.loader.start();
    if (isDeleteAll === "all") {
      reqData.leaveTypesId = "";
    } else {
      reqData.leaveTypesId = this.selectedLeaveTypes;
    }

    this.service.delete_leave_type_api(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.getAllLeaveTypeList();
        this.toastr.success(response.message);
        this.closePopup();
        this.selectedLeaveTypes = [];
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  handletoggleChange(event: any, data: any) {
    this.loader.start();
    let reqData = {
      leaveTypesId: data?._id,
      action_name: "active",
      action_value: event.checked,
    };

    this.service.delete_leave_type_api(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.getAllLeaveTypeList();
        this.toastr.success(response.message);
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  exportSpeciality() {
    /* generate worksheet */
    this.loader.start();
    var data: any = [];
    this.pageSize = 0;
    this._superAdminService.allLeaveTypeListforexport(this.page, this.pageSize, this.searchText)
      .subscribe((res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        if(result.status == true){
          this.loader.stop();
          var array = [
            "Leave Types",
          ];
  
          data = result.data.array
  
          data.unshift(array);
  
          var fileName = 'Leave_Types.xlsx';
  
          const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
          /* generate workbook and add the worksheet */
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          /* save to file */
          XLSX.writeFile(wb, fileName);
        }
      });
  }

  handleSearch(event: any) {
    this.searchText = event.target.value.trim();
    this.getAllLeaveTypeList();
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllLeaveTypeList();
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted = false;
    this.leaveTypeForm.reset();
    this.leaveTypes.clear();
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.addnewLeaveType();
  }

  //-------Form Array Handling----------------
  newLeaveTypesForm(): FormGroup {
    return this.fb.group({
      leave_type: ["", [Validators.required]],
      leave_type_arabic: ["", [Validators.required]],
      active_status: [true, [Validators.required]],
      delete_status: [false, [Validators.required]],
    });
  }

  get leaveTypes(): FormArray {
    return this.leaveTypeForm.get("leaveTypes") as FormArray;
  }

  addnewLeaveType() {
    this.leaveTypes.push(this.newLeaveTypesForm());
  }

  removeLeaveType(i: number) {
    this.leaveTypes.removeAt(i);
  }
  //  Add speciality service modal
  openVerticallyCenteredAddservicecontent(
    addservicecontent: any
  ) {
    this.modalService.open(addservicecontent, {
      centered: true,
      size: "md",
      windowClass: "master_modal add",
    });
  }

  //  Edit speciality service modal
  openVerticallyCenterededitservice(
    editservicecontent: any,
    data: any
  ) {
    this.editLeaveTypeForm.patchValue({
      leaveTypesId: data._id,
      leave_type: data.leave_type,
      leave_type_arabic: data.leave_type_arabic,
      active_status: data.active_status,
    });
    this.modalService.open(editservicecontent, {
      centered: true,
      size: "md",
      windowClass: "edit_service",
    });
  }
  //delete popup
  openVerticallyCenteredsecond(deletePopup: any, leaveTypesId: any) {
    this.leaveTypesId = leaveTypesId;
    this.modalService.open(deletePopup, { centered: true, size: "sm" });
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

  makeSelectAll(event: any) {
    if (event.checked == true) {
      this.leavetypedataSource?.map((element) => {
        if (!this.selectedLeaveTypes.includes(element?._id)) {
          this.selectedLeaveTypes.push(element?._id);
        }
      });
    } else {
      this.selectedLeaveTypes = [];
    }
  }

  handleCheckBoxChange(event, typeId) {
    if (event.checked == true) {
      this.selectedLeaveTypes.push(typeId);
    } else {
      const index = this.selectedLeaveTypes.indexOf(typeId);
      if (index > -1) {
        this.selectedLeaveTypes.splice(index, 1);
      }
    }
  }

  isAllSelected() {
    let allSelected = false;
    if (
      this.selectedLeaveTypes?.length ===
      this.leavetypedataSource?.length && this.selectedLeaveTypes?.length != 0
    ) {
      allSelected = true;
    }
    return allSelected;
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

    this.getAllLeaveTypeList();

  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'yyyy-MM-dd') || '';
  }


  myFilter = (d: Date | null): boolean => {
    return true;
  };
}
