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
const SPECIALITY_ELEMENT_DATA: SpecialityPeriodicElement[] = [
  { specialization: "Vincent Chase", addedby: "Hospital" },
  { specialization: "Vincent Chase", addedby: "Hospital" },
  { specialization: "Vincent Chase", addedby: "Hospital" },
  { specialization: "Vincent Chase", addedby: "Hospital" },
];


@Component({
  selector: 'app-alpha-results',
  templateUrl: './alpha-results.component.html',
  styleUrls: ['./alpha-results.component.scss']
})
export class AlphaResultsComponent implements OnInit {

  specialityservicedisplayedColumns: string[] = [
    "createdAt",
    "language",
    // "addedby",
    "status",
    "action",
  ];
  specialityservicedataSource: any = [];
  alphaResults!: FormGroup;
  isSubmitted: boolean = false;
  editLanguageForm!: FormGroup;
  languageId: any;
  page: any = 1;
  pageSize: number = 5;
  totalLength: number = 0;
  searchText: any = "";
  userId: any = "";
  selectedFiles: any;

  sortColumn: string = 'createdAt';
  sortOrder: -1 | 1 = -1;
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
    private _superAdminService: SuperAdminService,
    private dateAdapter: DateAdapter<Date>,
    private datepipe: DatePipe,

  ) {
    this.alphaResults = this.fb.group({
      alphaResultsArray: this.fb.array([]),
    });

    let userData = this._coreService.getLocalStorage("loginData");
    this.userId = userData._id;
    this.loginrole = this._coreService.getLocalStorage("adminData").role;
    this.editLanguageForm = this.fb.group({
      id: [""],
      alphaResultName: ["", [Validators.required]],
      alphaResultNameArabic: ["", [Validators.required]],
      isMarkedAsCritical:[false],
      status: [""],
    });

    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });
  }
  onSortData(column:any) {
    this.sortColumn = column;
    // this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.getAllLanguageList(`${column}:${this.sortOrder}`);
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
    this.getAllLanguageList(`${this.sortColumn}:${this.sortOrder}`);
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
          if (checkSubmenu.hasOwnProperty("spoken_language")) {
            this.innerMenuPremission = checkSubmenu['spoken_language'].inner_menu;
  
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
    this._superAdminService.uploadExcelLanguageList(formData).subscribe(
      (res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.loader.stop();
          this.getAllLanguageList();
          this.toastr.success(response.message);
          this.closePopup();
          this._coreService.setCategoryForService(1);
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
          this.closePopup();
        }
        this.selectedFiles=null

      },
      (error: any) => {
        let encryptedData = { data: error.error };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (!response.status) {
          this.loader.stop();
          this.toastr.error(response.message);
          this.closePopup();
        }
      }
    );
  }

  downLoadExcel() {
    const link = document.createElement("a");
    link.setAttribute("target", "_blank");
    link.setAttribute("href", "assets/doc/languageFile.xlsx");
    link.setAttribute("download", `languageFile.xlsx`);
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
    /* generate worksheet */
    this.loader.start();
    var data: any = [];
    this.pageSize = 0;
    this._superAdminService.allAlphaResultListforexport(this.page, this.pageSize, this.searchText)
      .subscribe((res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        if(result.status == true){
          this.loader.stop();
          var array = [
            "Alpha Name",
          ];
  
          data = result.data.array
  
          data.unshift(array);
  
          var fileName = 'Alpha_Results.xlsx';
  
          const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
          /* generate workbook and add the worksheet */
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          /* save to file */
          XLSX.writeFile(wb, fileName);
        }
      });
  }




  getAllLanguageList(sort:any='') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      userId: this.userId,
      searchText: this.searchText,
      sort:sort,
      fromDate:this.fromDate,
      toDate:this.toDate
    };

    this._superAdminService.AlphaResultsLists(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.totalLength = response?.body?.totalRecords;
      this.specialityservicedataSource = response?.body?.result;
    });
  }
  addAlphaResults() {
    this.isSubmitted = true;
    if (this.alphaResults.invalid) {
      this._coreService.showError("", "Please fill all the required fields.")
      return;
    }
    this.isSubmitted = false;
    this.loader.start();
    let reqData = {
      data: this.alphaResults.value.alphaResultsArray,
      added_by: this.userId,
    };
    this._superAdminService.addAlphaResults(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };

      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.getAllLanguageList();
        this.closePopup();
      } else if(response.status === false){
        this.loader.stop();
        this._coreService.showError(response.message, "");
        this.modalService.dismissAll();
        this.closePopup();

      }
    });
  }
  updateLanguage() {
    this.isSubmitted = true;
    if (this.editLanguageForm.invalid) {
      this._coreService.showError("", "Please fill all the required fields.")
      return;
    }
    this.loader.start();
    this._superAdminService
      .updateAlphaResultsApi(this.editLanguageForm.value)
      .subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);

        if (response.status) {
          this.loader.stop();
          this.getAllLanguageList();
          this.toastr.success(response.message);
          this.closePopup();
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      });
  }
  selectedSpecialities: any = [];
  deletedAlphaResults(isDeleteAll: any = "") {
    this.loader.start();
    let reqData = {
      ids: this.languageId,
      actionName: "isDeleted",
      actionValue: true,
    };

    if (isDeleteAll === "all") {
      reqData.ids = "";
    } else {
      reqData.ids = this.selectedSpecialities;
    }

    this.service.deleteAlphaResults(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.getAllLanguageList();
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
      id: data?._id,
      actionName: "status",
      actionValue: event.checked,
    };

    this.service.deleteAlphaResults(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.getAllLanguageList();
        this.toastr.success(response.message);
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  handleSearchCategory(event: any) {
    this.searchText = event.target.value.trim();
    this.getAllLanguageList();
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllLanguageList();
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted = false;
    this.alphaResults.reset();
    this.alphaResultsArray.clear();
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.addnewSpeciality();
  }

  //-------Form Array Handling----------------
  newSpecialityForm(): FormGroup {
    return this.fb.group({
      alphaResultName: ["", [Validators.required]],
      alphaResultNameArabic: ["", [Validators.required]],
      isMarkedAsCritical: [false],
      status: [true, [Validators.required]],
      delete_status: [false, [Validators.required]],
    });
  }

  get alphaResultsArray(): FormArray {
    return this.alphaResults.get("alphaResultsArray") as FormArray;
  }

  addnewSpeciality() {
    this.alphaResultsArray.push(this.newSpecialityForm());
  }

  removeSpeciality(i: number) {
    this.alphaResultsArray.removeAt(i);
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
    this.editLanguageForm.patchValue({
      id: data._id,
      alphaResultName: data.alphaResultName,
      alphaResultNameArabic: data.alphaResultNameArabic,
      isMarkedAsCritical:data.isMarkedAsCritical,
      status: data.status,
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
      windowClass: "master_modal Import",
    });
  }
  //delete popup
  openVerticallyCenteredsecond(deletePopup: any, languageId: any) {
    this.languageId = languageId;
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

    this.getAllLanguageList();

  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'yyyy-MM-dd') || '';
  }


  myFilter = (d: Date | null): boolean => {
    return true;
  };

}
