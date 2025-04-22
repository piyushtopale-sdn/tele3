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

export interface SpecialityPeriodicElement {
  specialization: string;
  addedby: string;
}

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
})
export class CategoryComponent implements OnInit {
  specialityservicedisplayedColumns: string[] = [
    "createdAt",
    "title",
    "addedby",
    "status",
    "action",
  ];
  specialityservicedataSource: any = [];
  titleForm!: FormGroup;
  // categoryForm!: FormGroup;
  isSubmitted: boolean = false;
  editTitleForm!: FormGroup;
  titleId: any;
  categoryId: any;
  page: any = 1;
  pageSize: number = 10;
  totalLength: number = 0;
  searchText: any = "";
  userId: any = "";
  selectedFiles: any;

  // sortColumn: string = 'title';
  // sortOrder: 'asc' | 'desc' = 'asc';
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
    this.titleForm = this.fb.group({
      // category_name: ["", Validators.required],
      // category_description: ["", Validators.required],
      // description: ["", Validators.required],
      // active_status: ["", [Validators.required]],
      titles: this.fb.array([]),
    });

    let userData = this._coreService.getLocalStorage("loginData");
    this.userId = userData._id;
    this.loginrole = this._coreService.getLocalStorage("adminData").role;
    this.editTitleForm = this.fb.group({
      categoryId: ["", [Validators.required]],
      // title: ["", [Validators.required]],
      categoryName: ["", Validators.required],
      categoryNameArabic: ["", Validators.required],
      categoryDescription: ["", Validators.required],
      description: ["", Validators.required],

      status: ["", [Validators.required]],
    });

    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });
  }

  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.getAllTitleLists(`${column}:${this.sortOrder}`);
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
    this.getAllTitleLists(`${this.sortColumn}:${this.sortOrder}`);
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
          if (checkSubmenu.hasOwnProperty("title")) {
            this.innerMenuPremission = checkSubmenu['title'].inner_menu;
  
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
    this._superAdminService.uploadExcelTitleList(formData).subscribe(
      (res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.loader.stop();
          this.getAllTitleLists();
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
    link.setAttribute("href", "assets/doc/TitleList.xlsx");
    link.setAttribute("download", `TitleList.xlsx`);
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
  // exportSpeciality() {
  //   window.location.href =
  //     "";
  // }



  exportSpeciality() {
    this.loader.start();
    /* generate worksheet */
    var data: any = [];
    this.pageSize = 0;
    this._superAdminService.allCategoryListforexport(this.page, this.pageSize, this.searchText)
      .subscribe((res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        if(result.status == true){
          this.loader.stop();
          var array = [
            "categoryName",
            "categoryDescription"
          ];
  
          data = result.data.array
  
          data.unshift(array);
  
          var fileName = 'Category_List.xlsx';
  
          const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
          /* generate workbook and add the worksheet */
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          /* save to file */
          XLSX.writeFile(wb, fileName);
        }
      });
  }

  getAllTitleLists(sort:any='') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      searchText: this.searchText,
      sort:sort,
      fromDate:this.fromDate,
      toDate:this.toDate
    };
    this._superAdminService.CategoryLists(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if(response.status){
        this.totalLength = response?.body?.totalRecords;
        this.specialityservicedataSource = response?.body?.result;
      }
    });
  }
  addTitles() {
    // return
    this.isSubmitted = true;
    if (this.titleForm.invalid) {
      this._coreService.showError("", "Please fill all the required fields.")
      return;
    }
    this.isSubmitted = false;
    this.loader.start();
    let reqData = {
      categoryData: this.titleForm.value.titles,
      added_by: this.userId,
    };
    
    this._superAdminService.addCategory(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };

      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.getAllTitleLists();
        this.closePopup();
      } else if(response.status === false){
        this.loader.stop();
        this._coreService.showError(response.message, "");
        this.modalService.dismissAll();
        this.closePopup();

      }
    });
  }
  updateTeam() {
         this.isSubmitted = true;
    if (this.editTitleForm.invalid) {
      this._coreService.showError("", "Please fill all the required fields.")
      return;
    }
    this.isSubmitted = false;
    this.loader.start();
    this._superAdminService
      .updateCategoryApi(this.editTitleForm.value)
      .subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);

        if (response.status) {
          this.loader.stop();
          this.getAllTitleLists();
          this.toastr.success(response.message);
          this.closePopup();
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      });
  }
  selectedSpecialities: any = [];
  deletedTitle(isDeleteAll: any = "") {
    // let reqData = {
    //   categoryIds: this.categoryId,
    //   action_name: "delete",
    //   action_value: true,
    // };
    let reqData = {
      categoryIds: this.categoryId,
      actionName: "isDeleted",
      actionValue: true,
    };
    this.loader.start();
    if (isDeleteAll === "all") {
      reqData.categoryIds = "";
    } else {
      reqData.categoryIds = this.selectedSpecialities;
    }


    this.service.deleteCategories(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
     
      if (response.status) {
        this.loader.stop();
        this.getAllTitleLists();
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
    // let reqData = {
    //   categoryId: data?._id,
    //   action_name: "active",
    //   action_value: event.checked,
    // };
    let reqData = {
      categoryId: data?._id,
      actionName: "status",
      actionValue: event.checked,
    };
    this.loader.start();
    this.service.stausHandleCategory(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.getAllTitleLists();
        this.toastr.success(response.message);
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  handleSearchCategory(event: any) {
    this.searchText = event.target.value.trim();
    this.getAllTitleLists();
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllTitleLists();
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted = false;
    this.titleForm.reset();
    this.titles.clear();
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.addnewSpeciality();
  }

  //-------Form Array Handling----------------
  newSpecialityForm(): FormGroup {
    return this.fb.group({
      categoryName: ["", [Validators.required]],
      categoryNameArabic: ["", [Validators.required]],
      categoryDescription: ["", [Validators.required]],
      description: ["", [Validators.required]],
      status: [true, [Validators.required]],
      // delete_status: [false, [Validators.required]],
    });
  }

  get titles(): FormArray {
    return this.titleForm.get("titles") as FormArray;
  }

  addnewSpeciality() {
    this.titles.push(this.newSpecialityForm());
  }

  removeSpeciality(i: number) {
    this.titles.removeAt(i);
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
    
    this.editTitleForm.patchValue({
      categoryId: data._id,
      categoryName: data.categoryName,
      categoryNameArabic: data.categoryNameArabic,
      categoryDescription: data.categoryDescription,
      description:data.description,
      status : data.status
  
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
  openVerticallyCenteredsecond(deletePopup: any, categoryId: any) {
    this.categoryId = categoryId;
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

    this.getAllTitleLists();

  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'yyyy-MM-dd') || '';
  }


  myFilter = (d: Date | null): boolean => {
    return true;
  };
}
