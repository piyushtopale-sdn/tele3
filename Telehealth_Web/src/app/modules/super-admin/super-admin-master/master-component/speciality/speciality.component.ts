import { Component, OnInit, ViewEncapsulation } from "@angular/core";
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
const SPECIALITY_ELEMENT_DATA: SpecialityPeriodicElement[] = [
  { specialization: "Vincent Chase", addedby: "Hospital" },
  { specialization: "Vincent Chase", addedby: "Hospital" },
  { specialization: "Vincent Chase", addedby: "Hospital" },
  { specialization: "Vincent Chase", addedby: "Hospital" },
];

@Component({
  selector: "app-speciality",
  templateUrl: "./speciality.component.html",
  styleUrls: ["./speciality.component.scss"],
  encapsulation:ViewEncapsulation.None

})
export class SpecialityComponent implements OnInit {
  specialityservicedisplayedColumns: string[] = [
    "createdAt",
    "specialization",
    // "addedby",
    "status",
    "action",
  ];
  specialityservicedataSource: any = [];
  specialityForm!: FormGroup;
  isSubmitted: boolean = false;
  editSpecialityForm!: FormGroup;
  specialityId: any;
  page: any = 1;
  pageSize: number = 10;
  totalLength: number = 0;
  searchText: any = "";
  userId: any = "";
  selectedFiles: any;
  sortColumn: string = 'specilization';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';
  innerMenuPremission:any=[];
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
    private loader : NgxUiLoaderService,
    private dateAdapter: DateAdapter<Date>,
    private datepipe: DatePipe,
  ) {
    this.specialityForm = this.fb.group({
      specialities: this.fb.array([]),
    });

    let userData = this._coreService.getLocalStorage("loginData");
    this.userId = userData._id;
    this.loginrole = this._coreService.getLocalStorage("adminData").role;

    this.editSpecialityForm = this.fb.group({
      specialityId: ["", [Validators.required]],
      specilization: ["", [Validators.required]],
      specilization_arabic: ["", [Validators.required]],
      active_status: ["", [Validators.required]],
    });


    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });
  }

  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.getAllSpeciality(`${column}:${this.sortOrder}`);
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

    this.addnewSpeciality();
    this.getAllSpeciality(`${this.sortColumn}:${this.sortOrder}`);
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 300);
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission(){
    let userPermission = this._coreService.getLocalStorage("adminData").permissions;
    if(userPermission){
      let menuID = sessionStorage.getItem("currentPageMenuID");
      let checkData = this.findObjectByKey(userPermission, "parent_id",menuID)
      if(checkData){
        if(checkData.isChildKey == true){
          var checkSubmenu = checkData.submenu;      
          if (checkSubmenu.hasOwnProperty("speciality")) {
            this.innerMenuPremission = checkSubmenu['speciality'].inner_menu;
  
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

  specializationExcleForm: FormGroup = new FormGroup({
    specialization_csv: new FormControl("", [Validators.required]),
  });

  excleSubmit() {
    this.isSubmitted = true;
    if (this.specializationExcleForm.invalid) {
      return;
    }
    this.loader.start();
    const formData = new FormData();
    formData.append("added_by", this.userId);
    formData.append("file", this.selectedFiles);
    // uploadExcelMedicine
    this.service.uploadSpecialityApi(formData).subscribe(
      (res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.loader.stop();
          this.getAllSpeciality();
          this.toastr.success(response.message);
          this.closePopup();
          this._coreService.setCategoryForService(1);
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
        this.selectedFiles=null

      },
      (error: any) => {
        this.loader.stop();
        let encryptedData = { data: error.error };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (!response.status) {
          this.toastr.error(response.message);
        }
      }
    );
  }

  downLoadExcel() {
    const link = document.createElement("a");
    link.setAttribute("target", "_blank");
    link.setAttribute("href", "assets/doc/specialization.xlsx");
    link.setAttribute("download", `specializationSampleExcelFile.xlsx`);
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

  exportSpeciality() {
    this.loader.start();
    /* generate worksheet */
    var data: any = [];
    this.pageSize = 0;
    this.service.allSpecialtyListforexport(this.page, this.pageSize, this.searchText)
      .subscribe((res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        if(result.status == true){
          this.loader.stop();
          var array = [
            "Specialization",
          ];
  
          data = result.data.array
  
          data.unshift(array);
  
          var fileName = 'Speciality_List.xlsx';
  
          const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
          /* generate workbook and add the worksheet */
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          /* save to file */
          XLSX.writeFile(wb, fileName);
        }
      });
  }

  getAllSpeciality(sort:any='') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      userId: this.userId,
      searchText: this.searchText,
      sort:sort,
      fromDate:this.fromDate,
      toDate:this.toDate

    };

    this.service.listSpeciality(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.totalLength = response?.body?.totalCount;
      this.specialityservicedataSource = response?.body?.data;
    });
  }
  addSpecialities() {
    this.isSubmitted = true;
    if (this.specialityForm.invalid) {
      this._coreService.showError("", "Please fill all the required fields.")
      return;
    }
    this.loader.start();
    let reqData = {
      specialityArray: this.specialityForm.value.specialities,
      added_by: this.userId,
    };
    this.service.addSpeciality(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.getAllSpeciality();
        this.closePopup();
      } else if(response.status == false) {
        this.loader.stop();
        this.toastr.error(response.message);
        this.closePopup();

      }
    });
  }
  updateSpecialities() {
    this.isSubmitted = true;
    if (this.editSpecialityForm.invalid) {
      return;
    }
    this.loader.start();
    this.service
      .updateSpeciality(this.editSpecialityForm.value)
      .subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);

        if (response.status) {
          this.loader.stop();
          this.getAllSpeciality();
          this.toastr.success(response.message);
          this.closePopup();
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      });
  }
  selectedSpecialities: any = [];
  deleteSpecialities(isDeleteAll: any = "") {
    this.loader.start();
    let reqData = {
      specialityId: this.specialityId,
      action_name: "delete",
      action_value: true,
    };

    if (isDeleteAll === "all") {
      reqData.specialityId = "";
    } else {
      reqData.specialityId = this.selectedSpecialities;
    }

    this.service.deleteSpeciality(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.getAllSpeciality();
        this.toastr.success(response.message);
        this.closePopup();
        this.selectedSpecialities = [];
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  handletoggleChange(event: any, data: any) {
    this.loader.start();
    let reqData = {
      specialityId: data?._id,
      action_name: "active",
      action_value: event.checked,
    };

    this.service.deleteSpeciality(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.getAllSpeciality();
        this.toastr.success(response.message);
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  handleSearchCategory(event: any) {
    this.searchText = event.target.value.trim();
    this.getAllSpeciality();
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllSpeciality();
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted = false;
    this.specialityForm.reset();
    this.specialities.clear();
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.addnewSpeciality();
  }

  //-------Form Array Handling----------------
  newSpecialityForm(): FormGroup {
    return this.fb.group({
      specilization: ["", [Validators.required]],
      specilization_arabic: ["", [Validators.required]],
      active_status: [true, [Validators.required]],
      delete_status: [false, [Validators.required]],
    });
  }

  get specialities(): FormArray {
    return this.specialityForm.get("specialities") as FormArray;
  }

  addnewSpeciality() {
    this.specialities.push(this.newSpecialityForm());
  }

  removeSpeciality(i: number) {
    this.specialities.removeAt(i);
  }
  //  Add speciality service modal
  openVerticallyCenteredAddspecialityservicecontent(
    addspecialityservicecontent: any
  ) {
    this.modalService.open(addspecialityservicecontent, {
      centered: true,
      size: "md",
      windowClass: "master_modal add_lab",
    });
  }

  //  Edit speciality service modal
  openVerticallyCenterededitspecialityservice(
    editspecialityservicecontent: any,
    data: any
  ) {
    this.editSpecialityForm.patchValue({
      specialityId: data._id,
      specilization: data.specilization,
      specilization_arabic: data.specilization_arabic,
      active_status: data.active_status,
    });
    this.modalService.open(editspecialityservicecontent, {
      centered: true,
      size: "md",
      windowClass: "edit_speciality_service",
    });
  }

  //add import modal
  openVerticallyCenteredimport(imporMedicine: any) {
    this.modalService.open(imporMedicine, {
      centered: true,
      size: "lg",
      windowClass: "master_modal import",
    });
  }
  //delete popup
  openVerticallyCenteredsecond(deletePopup: any, specialityId: any) {
    this.specialityId = specialityId;
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
      this.specialityservicedataSource?.map((element) => {
        if (!this.selectedSpecialities.includes(element?._id)) {
          this.selectedSpecialities.push(element?._id);
        }
      });
    } else {
      this.selectedSpecialities = [];
    }
  }

  handleCheckBoxChange(event, medicineId) {
    if (event.checked == true) {
      this.selectedSpecialities.push(medicineId);
    } else {
      const index = this.selectedSpecialities.indexOf(medicineId);
      if (index > -1) {
        this.selectedSpecialities.splice(index, 1);
      }
    }
  }

  isAllSelected() {
    let allSelected = false;
    if (
      this.selectedSpecialities?.length ===
      this.specialityservicedataSource?.length && this.selectedSpecialities?.length != 0
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

    this.getAllSpeciality();

  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'yyyy-MM-dd') || '';
  }


  myFilter = (d: Date | null): boolean => {
    return true;
  };
}
