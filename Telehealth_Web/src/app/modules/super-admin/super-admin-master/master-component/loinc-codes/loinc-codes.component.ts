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
import { DateAdapter } from "@angular/material/core";
import { DatePipe } from "@angular/common";
import * as XLSX from 'xlsx';
import { NgxUiLoaderService } from "ngx-ui-loader";

// Speciality table data
export interface SpecialityPeriodicElement {
  specialization: string;
  addedby: string;
}

@Component({
  selector: 'app-loinc-codes',
  templateUrl: './loinc-codes.component.html',
  styleUrls: ['./loinc-codes.component.scss']
})
export class LoincCodesComponent {
  displayedColumns: string[] = [
    "createdAt",
    "loinccode",
    "description",          //[[6 feb Add description Column in table ]]
    "status",
    "action",
  ];
  dataSource: any = [];
  codeForm!: FormGroup;
  isSubmitted: boolean = false;
  editCodeForm!: FormGroup;
  loincCodeId: any;
  page: any = 1;
  pageSize: number = 10;
  totalLength: number = 0;
  searchText: any = "";
  userId: any = "";
  selectedFiles: any;

  sortColumn: string = 'loincCode';
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
    this.codeForm = this.fb.group({
      loinccodes: this.fb.array([]),
    });

    let userData = this._coreService.getLocalStorage("loginData");
    this.userId = userData._id;
    this.loginrole = this._coreService.getLocalStorage("adminData").role;
    this.editCodeForm = this.fb.group({
      loincCodeId: ["", [Validators.required]],
      loincCode: ["", [Validators.required]],
      description: ["", [Validators.required]],
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
    this.getAllList(`${column}:${this.sortOrder}`);
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



    this.addnewFields();
    this.getAllList(`${this.sortColumn}:${this.sortOrder}`);
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
          if (checkSubmenu.hasOwnProperty("designation")) {
            this.innerMenuPremission = checkSubmenu['designation'].inner_menu;

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

  excleSubmit() {
    this.isSubmitted = true;
    if (this.teamExcelForm.invalid) {
      return;
    }
    this.loader.start();
    const formData = new FormData();
    formData.append("added_by", this.userId);
    formData.append("file", this.selectedFiles);
    // uploadExcelMedicine
    this._superAdminService.uploadExcelLoincCodeList(formData).subscribe(
      (res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.loader.stop();
          this.getAllList();
          this.toastr.success(response.message);
          this.closePopup();
          this._coreService.setCategoryForService(1);
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
          this.closePopup();
        }
        this.selectedFiles = null

      },
      (error: any) => {
        let encryptedData = { data: error.error };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (!response.status) {
          this.toastr.error(response.message);
          this.loader.stop();
          this.closePopup();
        }
      }
    );
  }

  downLoadExcel() {
    const link = document.createElement("a");
    link.setAttribute("target", "_blank");
    link.setAttribute("href", "assets/doc/Loinc_Codes.xlsx");
    link.setAttribute("download", `loinccode.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  fileChange(event) {
    let fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let file: File = fileList[0];
      this.selectedFiles = file;
    }
  }

  exportLoincCodeToExcel() {
    /* generate worksheet */
    var data: any = [];
    this.pageSize = 0;
    this.loader.start();
    this._superAdminService.allLoincCodeListforexport(this.page, this.pageSize, this.searchText)
      .subscribe((res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        if (result.status == true) {
          this.loader.stop();
          var array = [
            "loinccode","description"
          ];

          data = result.data.array

          data.unshift(array);

          var fileName = 'Loinc_Codes.xlsx';

          const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
          /* generate workbook and add the worksheet */
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'loincCode');
          /* save to file */
          XLSX.writeFile(wb, fileName);
        }
      });
  }

  getAllList(sort: any = '') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      searchText: this.searchText,
      sort: sort,
      fromDate: this.fromDate,
      toDate: this.toDate
    };
    this._superAdminService.getAllLoincCodes(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response?.status) {
        this.totalLength = response?.body?.totalCount;
        this.dataSource = response?.body?.data;
      } else {
        this.dataSource = []
        this.totalLength = 0
      }
    });
  }

  addLoincCode() {
    this.isSubmitted = true;
    if (this.codeForm.invalid) {
      this._coreService.showError("", "Please fill all the required fields.");
      return;
    }
    this.loader.start();
    this.isSubmitted = false;
    let reqData = {
      loincCodeArray: this.codeForm.value.loinccodes,
      added_by: this.userId,
    };
    this._superAdminService.addLoincCodes(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };

      let response = this._coreService.decryptObjectData(encryptedData);
      this.loader.start();
      if (response?.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.getAllList();
        this.closePopup();
      } else if (response.status === false) {
        this.loader.stop();
        this._coreService.showError(response.message, "");
        this.modalService.dismissAll();
        this.closePopup();
      }
    });
  }
  updateLoincCode() {
    this.isSubmitted = true;
    if (this.editCodeForm.invalid) {
      this._coreService.showError("", "Please fill all the required fields.");
      return;
    }
    this.isSubmitted = false;

    this.loader.start();
    this._superAdminService
      .updateLoincCodeApi(this.editCodeForm.value)
      .subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);

        if (response.status) {
          this.loader.stop();
          this.getAllList();
          this.toastr.success(response.message);
          this.closePopup();
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      });
    this.loader.stop();
  }
  selectedCode: any = [];
  deleteHandle(isDeleteAll: any = "") {
    this.loader.start();
    let reqData = {
      loincCodeId: this.loincCodeId,
      action_name: "delete",
      action_value: true,
    };

    if (isDeleteAll === "all") {
      reqData.loincCodeId = "";
    } else {
      reqData.loincCodeId = this.selectedCode;
    }

    this.service.deleteLoincCode(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.getAllList();
        this.toastr.success(response.message);
        this.closePopup();
        this.selectedCode = [];
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  handletoggleChange(event: any, data: any) {
    this.loader.start();
    let reqData = {
      loincCodeId: data?._id,
      action_name: "active",
      action_value: event.checked,
    };

    this.service.deleteLoincCode(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.getAllList();
        this.toastr.success(response.message);
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  handleSearchCategory(event: any) {
    this.searchText = event.target.value.trim();
    this.getAllList();
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllList();
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted = false;
    this.codeForm.reset();
    this.teamExcelForm.reset(); 
    this.loinccodes.clear();
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.addnewFields();
  }

  //-------Form Array Handling----------------
  newForm(): FormGroup {
    return this.fb.group({
      loincCode: ["", [Validators.required]],
      description: ["", [Validators.required]],
      active_status: [true, [Validators.required]],
      delete_status: [false, [Validators.required]],
    });
  }

  get loinccodes(): FormArray {
    return this.codeForm.get("loinccodes") as FormArray;
  }

  addnewFields() {
    this.loinccodes.push(this.newForm());
  }

  removeFields(i: number) {
    this.loinccodes.removeAt(i);
  }
  //  Add speciality service modal
  openVerticallyCenteredAddspecialityservicecontent(
    addcontent: any
  ) {
    this.modalService.open(addcontent, {
      centered: true,
      size: "md",
      windowClass: "master_modal add_content",
    });
  }

  //  Edit speciality service modal
  openEditLoincCodePopup(editcontent: any, data: any) {
    this.editCodeForm.patchValue({
      loincCodeId: data._id,
      loincCode: data.loincCode,
      description: data.description,
      active_status: data.active_status,
    });
    this.modalService.open(editcontent, {
      centered: true,
      size: "md",
      windowClass: "edit_content",
    });
  }

  //add import modal
  openVerticallyCenteredimport(imporMedicine: any) {
    this.modalService.open(imporMedicine, {
      centered: true,
      size: "lg",
      windowClass: "master_modal Import",
    });
  }
  //delete popup
  openVerticallyCenteredsecond(deletePopup: any, loincCodeId: any) {
    this.loincCodeId = loincCodeId;
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
      this.dataSource?.map((element) => {
        if (!this.selectedCode.includes(element?._id)) {
          this.selectedCode.push(element?._id);
        }
      });
    } else {
      this.selectedCode = [];
    }
  }

  handleCheckBoxChange(event, loincCodeId) {
    if (event.checked == true) {
      this.selectedCode.push(loincCodeId);
    } else {
      const index = this.selectedCode.indexOf(loincCodeId);
      if (index > -1) {
        this.selectedCode.splice(index, 1);
      }
    }
  }

  isAllSelected() {
    let allSelected = false;
    if (
      this.selectedCode?.length ===
      this.dataSource?.length && this.selectedCode?.length != 0
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

    this.getAllList();

  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'MM-dd-yyyy') || '';
  }

  myFilter = (d: Date | null): boolean => {
    return true;
  };
}
