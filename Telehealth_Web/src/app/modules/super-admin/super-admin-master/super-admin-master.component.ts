import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";
import { SuperAdminService } from "../super-admin.service";
import * as XLSX from "xlsx";
import { ActivatedRoute } from "@angular/router";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { DateAdapter } from "@angular/material/core";
import { DatePipe } from "@angular/common";

// Medicines table data
export interface PeriodicElement {
  medicinename: string;
  addedby: string;
  status: string;
  action: string;
  id: string;
}
const ELEMENT_DATA: PeriodicElement[] = [
];

@Component({
  selector: "app-super-admin-master",
  templateUrl: "./super-admin-master.component.html",
  styleUrls: ["./super-admin-master.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class SuperAdminMasterComponent implements OnInit {
  loading: boolean = false;
  // Medicines table data
  displayedColumns: string[] = ["createdAt","registerNumber", "scientificName", "tradeName", "authorizationStatus", "action"];
  // dataSource = ELEMENT_DATA;
  dataSource: any = [];
  // Exclusion table data

  medicineForm: FormGroup;
  medicineExcelForm: FormGroup;
  isSubmitted: boolean;
  userId: string;
  medicineList: any;
  userData: any;
  page: any = 1;
  pageSize: number = 10;
  totalLength: number = 0;
  selectedFiles: any;
  allMedicineDetails: any[] = [];
  @ViewChild("addmedicinecontent", { static: false }) addmedicinecontent: any;
  @ViewChild("editmedicinecontent", { static: false }) editmedicinecontent: any;
  activetab: number = 0;
  medicineName: string;
  inn: string;
  dossage: string;
  pharmaFormulation: string;
  adminRoute: string;
  therapeuticClass: string;
  manuFacturer: string;
  presciptionDelivery: string;
  other: string;
  webLink: string;
  medicineId: string;
  searchText: string = "";
  sortColumn: string = 'registerNumber';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';
  selectedMedicines: any = [];
  innerMenuPremission: any = [];
  loginrole: any;
  selectedIndex: number = 0;
  updateby_medicineId: any;

  dateRangeForm: FormGroup;
  fromDate: string = "";
  toDate: string = "";

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private _coreService: CoreService,
    private service: SuperAdminService,
    private _superAdminService: SuperAdminService,
    private activatedRoute: ActivatedRoute,
    private loader: NgxUiLoaderService,
    private dateAdapter: DateAdapter<Date>,
    private datepipe: DatePipe,


  ) {
    let admin = this._coreService.getLocalStorage("loginData");
    this.loginrole = this._coreService.getLocalStorage("adminData").role;
    this.userId = admin._id;

    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });

    this.medicineForm = this.fb.group({
      registerNumber: ["", [Validators.required,Validators.pattern('^[0-9]+$')]],
      registerYear: ["", [Validators.required,Validators.pattern('^[0-9]{4}$')]],
      productType: ["", [Validators.required]],
      drugType: ["", [Validators.required]],
      subType: ["", [Validators.required]],
      scientificName: ["", [Validators.required]],
      scientificNameArabic: ["", [Validators.required]],
      tradeName: ["", [Validators.required]],
      tradeNameArabic: ["", [Validators.required]],
      strength: [""],
      strengthUnit: [""],
      pharmaceuticalForm: [""],
      administrationRoute: [""],
      ATCCode1: [""],
      ATCCode2: [""],
      size: [""],
      sizeUnit: [""],
      packageType: [""],
      packageSize: [""],
      legalStatus: [""],
      productControlDistributeArea: [""],
      publicPrice: [""],
      pricingDate: [""],
      shelfLife: [""],
      storageConditions: [""],
      marketingCompany: [""],
      marketingCountry: [""],
      manufactureName: [""],
      manufactureCountry: [""],
      manufactureName2: [""],
      manufactureCountry2: [""],
      secondaryPackageManufacture: [""],
      mainAgent: [""],
      secondAgent: [""],
      thirdAgent: [""],
      marketingStatus: [""],
      authorizationStatus: ["", [Validators.required]]
    });
  }
  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.getmedicinesList(`${column}:${this.sortOrder}`);
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


    this.getmedicinesList(`${this.sortColumn}:${this.sortOrder}`);  
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 300);

    this.activatedRoute.queryParams.subscribe((params) => {
      this.activetab = params["activeTab"];
    });
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

    this.getmedicinesList();

  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'MM-dd-yyyy') || '';
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
          if (checkSubmenu.hasOwnProperty("medicines")) {
            this.innerMenuPremission = checkSubmenu['medicines'].inner_menu;

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

  public medicineExcleForm: FormGroup = new FormGroup({
    medicine_csv: new FormControl("", [Validators.required]),
  });

  //delete popup
  openVerticallyCenteredsecond(deletePopup: any, medicineId: any) {
    this.medicineId = medicineId;
    this.modalService.open(deletePopup, { centered: true, size: "sm" });
  }

  public excleSubmit() {
    this.isSubmitted = true;
    if (this.medicineExcleForm.invalid) {
      return;
    }
    this.isSubmitted = false;
    this.loader.start();
    const formData: any = new FormData();
    formData.append("userId", this.userId);
    formData.append("file", this.selectedFiles);
    for (let [key, value] of formData.entries()) {
    }
    this._superAdminService.uploadExcelMedicine(formData).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let result = this._coreService.decryptObjectData(encryptedData);

        if (result.status) {
          this.loader.stop();
          this.selectedFiles = '';
          this.closePopup();
          this.toastr.success(result.message);
          this.getmedicinesList();
        } else {
          this.closePopup();
          this.loader.stop();
          this.toastr.error(result.message);
        }
      },
      error: (err) => {
        this.loader.stop();
        console.log(err);
      },
      complete: () => {
        this.loader.stop();
      },
    });
  }
  selectedTab(event: any) {
    this.activetab = event.index
  }


  downLoadExcel() {
    const link = document.createElement("a");
    link.setAttribute("target", "_blank");
    link.setAttribute("href", "assets/doc/medicines.xlsx");
    link.setAttribute("download", `medicine.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  public fileChange(event) {
    let fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let file: File = fileList[0];
      this.selectedFiles = file;
    }
  }

  //..............AddMedicine.....................

  closePopup() {
    this.medicineForm.reset();
    this.modalService.dismissAll("close");
    this.getmedicinesList();

  }

  addMedicines(type: any) {
    this.isSubmitted = true;
    const isInvalid = this.medicineForm.invalid;

    if (isInvalid) {
      this.medicineForm.markAllAsTouched();

      const firstInvalidField = document.querySelector(
        'input.ng-invalid, input.ng-invalid'
      );
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      this._coreService.showError("", "Please fill all required fields.")
      return;
    }
    this.isSubmitted = false;


    if (type === "add") {
      let reqData = {
        ...this.medicineForm.value
      };
      this.loader.start();
      this._superAdminService.addMedicine(reqData).subscribe((res: any) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.loader.stop();
          this.toastr.success(response.message);
          this.closePopup();
        } else if (response.status == false) {
          this.loader.stop();
          this.toastr.error(response.message);
          this.closePopup();
        }
      });

    } else {
      let reqData = {
        medicineId: this.updateby_medicineId,
        ...this.medicineForm.value
      };
      this.loader.start();
      this._superAdminService.updateMedicine(reqData).subscribe((res: any) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.loader.stop();
          this.toastr.success(response.message);
          this.closePopup();
        } else if (response.status == false) {
          this.loader.stop();
          this.toastr.error(response.message);
          this.closePopup();
        }
      });
    }
  }

  exportMedicine() {
    /* generate worksheet */
    var data: any = [];
    this.pageSize = 0;
    this.service.listMedicineforexport(this.page, this.pageSize, this.searchText)
      .subscribe((res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        
        if (result.status) {
          this.loader.stop();
          var array = [
           "Register Number",
            "Register Year",
            "Product Type",
            "Drug Type",
            "Sub Type",
            "Scientific Name",
            "Scientific Name Arabic",
            "Trade Name",
            'Trade Name Arabic',
            "Strength",
            "Strength Unit",
            "Pharmaceutical Form",
            "Administration Route",
            "ATCCode1",
            "ATCCode2",
            "Size",
            "Size Unit",
            "Package Type",
            "Package Size",
            "Legal Status",
            "Product Control Distribute Area",
            "Public Price",
            "Pricing Date",
            'Shelf Life',
            'Storage Conditions',
            "Marketing Company",
            'Marketing Country',
            "Manufacture Name",
            "Manufacture Country",
            'Manufacture Name2',
            'Manufacture Country2',
            "Secondary Package Manufacture",
            "Main Agent",
            "Second Agent",
            "Third Agent",
            'Marketing Status',
            "Authorization Status",
            'isActive'
          ];
          data = result.data.array
          data.unshift(array);
          var fileName = 'Medicine_List.xlsx';
          const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
          /* generate workbook and add the worksheet */
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          /* save to file */
          XLSX.writeFile(wb, fileName);
        }
      });
  }

  getmedicinesList(sort: string = '') {
    this.service
      .getmedicineList(this.page, this.pageSize, this.searchText, sort, this.fromDate, this.toDate)
      .subscribe((res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        if (result.status) {
          this.totalLength = result?.body?.totalRecords;
          this.dataSource = result?.body?.result;

        }
      });
  }


  handleSearch(event: any) {
    this.searchText = event.target.value.trim();
    this.getmedicinesList();
  }

  deleteMed() {
    let reqData = {
      actionName: 'isDeleted',
      actionValue: true,
      medicineIds: this.selectedMedicines
    };
    this.loader.start();
    this._superAdminService.deleteMedicine(reqData).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.loader.stop();
          this.toastr.success(response.message);
          this.closePopup();
          this.selectedMedicines = []
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  public handlePageEventMedicine(data: {
    pageIndex: number;
    pageSize: number;
  }): void {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getmedicinesList();
  }

  reset() {
    this.medicineForm.reset();
  }

  handleClose() {
    this.modalService.dismissAll("close");
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }

  //  Add medicine modal
  openVerticallyCenteredAddmedicine(addmedicinecontent: any) {

    this.modalService.open(this.addmedicinecontent, {
      centered: true,
      size: "xl",
      windowClass: "master_modal add_medicine medicine-modal",
    });
  }

  openVerticallyCenteredEditmedicine(editmedicinecontent: any, id: any) {
    this.updateby_medicineId = id
    this.getMedicinedata(this.updateby_medicineId),
      this.modalService.open(this.editmedicinecontent, {
        centered: true,
        size: "xl",
        windowClass: "master_modal add_medicine medicine-modal",
      });
  }


  getMedicinedata(id: any) {
    let reqData = {
      id: id
    }

    this.service.getIdByMedicine_api(reqData).subscribe({
      next: (result) => {
        let response = this._coreService.decryptObjectData({ data: result });
        if (response.status) {
          let data = response?.body;
          this.medicineForm.patchValue({
            registerNumber: data?.registerNumber,
            registerYear: data?.registerYear,
            productType: data?.productType,
            drugType: data?.drugType,
            subType: data?.subType,
            scientificName: data?.scientificName,
            scientificNameArabic: data?.scientificNameArabic,
            tradeName: data?.tradeName,
            tradeNameArabic: data?.tradeNameArabic,
            strength: data?.strength,
            strengthUnit: data?.strengthUnit,
            pharmaceuticalForm: data?.pharmaceuticalForm,
            administrationRoute: data?.administrationRoute,
            ATCCode1: data?.ATCCode1,
            ATCCode2: data?.ATCCode2,
            size: data?.size,
            sizeUnit: data?.sizeUnit,
            packageType: data?.packageType,
            packageSize: data?.packageSize,
            legalStatus: data?.legalStatus,
            productControlDistributeArea: data?.productControlDistributeArea,
            publicPrice: data?.publicPrice,
            pricingDate: data?.pricingDate,
            shelfLife: data?.shelfLife,
            storageConditions: data?.storageConditions,
            marketingCompany: data?.marketingCompany,
            marketingCountry: data?.marketingCountry,
            manufactureName: data?.manufactureName,
            manufactureCountry: data?.manufactureCountry,
            manufactureName2: data?.manufactureName2,
            manufactureCountry2: data?.manufactureCountry2,
            secondaryPackageManufacture: data?.secondaryPackageManufacture,
            mainAgent: data?.mainAgent,
            secondAgent: data?.secondAgent,
            thirdAgent: data?.thirdAgent,
            marketingStatus: data?.marketingStatus,
            authorizationStatus: data?.authorizationStatus
          });
        } else {
          this.loader.stop();
          this._coreService.showError("", response.message);
        }
      },
      error: (err: ErrorEvent) => {
        this.loader.stop();
        this._coreService.showError("Error", err.error.message);
      },
    });
  }

  //add medicine import modal
  openVerticallyCenteredimport(imporMedicine: any) {
    this.modalService.open(imporMedicine, {
      centered: true,
      size: "md",
      windowClass: "master_modal import",
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

  makeSelectAll(event: any) {

    if (event.checked == true) {
      this.dataSource.map((element) => {
        if (!this.selectedMedicines.includes(element?._id)) {
          this.selectedMedicines.push(element?._id);
        }
      });
    } else {
      this.selectedMedicines = [];
    }
  }

  handleCheckBoxChange(event, medicineId) {
    if (event.checked == true) {
      this.selectedMedicines.push(medicineId);
    } else {
      const index = this.selectedMedicines.indexOf(medicineId);
      if (index > -1) {
        this.selectedMedicines.splice(index, 1);
      }
    }
  }

  isAllSelected() {
    let allSelected = false;
    if (this.selectedMedicines?.length === this.dataSource?.length && this.selectedMedicines?.length != 0) {
      allSelected = true;
    }
    return allSelected;
  }

  myFilter = (d: Date | null): boolean => {
    return true;
  };
  limitYearLength(event: any) {
    const inputValue = event.target.value;
    if (inputValue.length > 4) {
      event.target.value = inputValue.slice(0, 4);
    }
  }
}