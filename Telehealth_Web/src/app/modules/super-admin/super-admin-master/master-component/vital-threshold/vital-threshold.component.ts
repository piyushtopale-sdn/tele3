import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { Component, ViewEncapsulation, OnInit, ViewChild } from "@angular/core";
import {
  FormGroup,
  Validators,
  FormBuilder,
  FormArray,
  ValidatorFn,
  ValidationErrors,
  AbstractControl,
} from "@angular/forms";
import { CoreService } from "src/app/shared/core.service";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { DateAdapter } from "@angular/material/core";
import { DatePipe } from "@angular/common";
import { MatPaginator } from "@angular/material/paginator";

export interface PendingPeriodicElement {
  radio_centre: string;
  test: number;
}

@Component({
  selector: 'app-vital-threshold',
  templateUrl: './vital-threshold.component.html',
  styleUrls: ['./vital-threshold.component.scss']
  // encapsulation: ViewEncapsulation.None,
})
export class VitalThresholdComponent implements OnInit {
  resultSource: any = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("addcontentData", { static: false }) addcontentData: any;
  @ViewChild("editOpencontentData", { static: false }) editOpencontentData: any;
  updatebyeditId: any;
  superAdminId: any;
  isEditMode: boolean = false;

  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;
  isSubmitted: boolean = false;
  searchText = "";
  startDate: string = null;
  endDate: string = null;
  pendingdisplayedColumns: string[] = [];
  displayedColumns: string[] = [
    "createdAt",
    "type_of_result",
    "high",
    "low",
    "critical_high",
    "critical_low",
    "interpretive_data",
    "action"
  ];

  sortColumn: string = 'for_portal_user.createdAt';
  sortOrder: 1 | -1 = -1;

  sortIconClass: string = 'arrow_upward';
  innerMenuPremission: any = [];
  selectedMedicines: any = [];
  loginrole: any;
  labtest_configId: any;
  testConfigForm!: FormGroup;
  testConfigFormEdit!: FormGroup;
  assessmentId: any;
  superadminId: any;
  ageRanges: string[] = [
    "All",
    "0-59",
    "60 +",
  ];
  
  vitalsTypes = ["BLOOD_PRESSURE", "HEART_RATE", "WEIGHT", "PULSE", "TEMPERATURE", "BLOOD_GLUCOSE","HEIGHT"];
  editVitalType: any;
  testConfigId: string;
  dateRangeForm: FormGroup;
  fromDate: string = "";
  toDate: string = "";
  selectedVitalType : string = "";
  constructor(
    private coreService: CoreService,
    private modalService: NgbModal,
    private sadminService: SuperAdminService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    private loader: NgxUiLoaderService,
    private dateAdapter: DateAdapter<Date>,
    private datepipe: DatePipe,
  ) {
    let paramId = this.activatedRoute.snapshot.paramMap.get("id");

    if (paramId !== null) {
      this.testConfigId = paramId;
    }
    this.testConfigForm = this.fb.group({
      vitalsType: ['', [Validators.required]],
      refrence_range: this.fb.array(
        [this.createOption({})],
       { validators: this.uniqueGenderAgeValidator()}
      ),
    });

    this.testConfigFormEdit = this.fb.group({
      vitalsType: ['', [Validators.required]],
      id : '',
      refrence_range: this.fb.array(
        [],
        this.uniqueGenderAgeValidator()
      ),
      
    }, { updateOn: 'submit' });


    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });
    
  }

  get options() {
    return this.testConfigForm.get("refrence_range") as FormArray;
  }

  get optionsEdit() {
    return this.testConfigFormEdit.get("refrence_range") as FormArray;
  }

  

  createOption(data:any = {}): FormGroup {
    return this.fb.group({
      gender: [data?.gender || '' , [Validators.required]],
      age: [data?.age || '' , [Validators.required]],
      high: [data?.high || '' , [Validators.required]],
      low: [data?.low || '' , [Validators.required]],
      criticalHigh: [data?.criticalHigh || '' , [Validators.required]],
      criticalLow: [data?.criticalLow || '' , [Validators.required]],
      unit: [data?.unit || '' , [Validators.required]],
    });
  }

  // addOption() {
  //   this.options.push(this.createOption());
  // }

  addOption() {
    // Add a new field to the options array
    if (this.testConfigForm.value.vitalsType === "BLOOD_PRESSURE") {
      this.options.push(this.createOption());
      this.options.push(this.createOption());
    } else {
      this.options.push(this.createOption());
    }
  }


 removeOption(index: number) {
  if (this.testConfigForm.value.vitalsType === "BLOOD_PRESSURE") {
    if (this.options.length > 2) {
      this.options.removeAt(index); // Remove the current field
      if (index > 0) {
        this.options.removeAt(index - 1); // Remove the preceding field
      }
    }
  } else {
    this.options.removeAt(index); // Remove the current field
  }
}


  addOptionEdit() {
    if (this.testConfigFormEdit.value.vitalsType === 'BLOOD_PRESSURE') {
      this.optionsEdit.push(this.createOption());
      this.optionsEdit.push(this.createOption());
    } else {
      this.optionsEdit.push(this.createOption());
    }
  }

  // removeOption(index: number) {
  //   if (this.options.length > 1) {
  //     this.options.removeAt(index);
  //   }
  // }

  // removeOption(index: number) {
  //   if (this.testConfigForm.value.vitalsType === "BLOOD_PRESSURE") {
  //     if (this.options.length > 2) {
  //       this.options.removeAt(index);
  //       this.options.removeAt(index - 1);
  //     }
  //   } else {
  //     this.options.removeAt(index);
  //   }
  // }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.getVitalThresholdList(`${column}:${this.sortOrder}`);
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

    this.getVitalThresholdList(`${this.sortColumn}:${this.sortOrder}`);
    if (this.testConfigForm.value.vitalsType === "BLOOD_PRESSURE") {
      this.options.push(this.createOption());
    }
  }

  onValueChange(event: any): void {
    if (this.testConfigForm.value.vitalsType === "BLOOD_PRESSURE") {
      this.options.push(this.createOption());
    } else {
      const length = this.options.length;
      for (let i = length - 1; i > 0; i--) {
        this.options.removeAt(i);
      }
    }
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

  getVitalThresholdList(sort: any = '') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      searchText: this.searchText,
      sort: sort,
      fromDate:this.fromDate,
      toDate:this.toDate
    };

    this.sadminService.getVitalThreshold(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      
      if (response.status) {
        this.totalLength = response?.body?.totalRecords;
        this.resultSource = response?.body?.result;
      }

    });
  }

  async submitForm() {
    this.isSubmitted = true;

    if (this.testConfigForm.invalid) {
      this.testConfigForm.markAllAsTouched();
      this.coreService.showError("", "Please fill all required fields.");
      return;
    }

    let referenceRange = [];
    if (this.testConfigForm.value.vitalsType === "BLOOD_PRESSURE") {
      // Ensure proper structure
      // referenceRange = [
      //   {
      //     BPSystolic: this.testConfigForm.value.refrence_range[0], // Assuming Systolic is at index 0
      //     BPDiastolic: this.testConfigForm.value.refrence_range[1], // Assuming Diastolic is at index 1
      //   },
      // ];
let bpTestLength = this.testConfigForm.value.refrence_range?.length
      this.testConfigForm.value.refrence_range?.map((item:any,index:any)=>{
        
        if (index % 2 === 0) {
          referenceRange.push({
            BPSystolic: this.testConfigForm.value.refrence_range[index], // Current item as BPSystolic
            BPDiastolic: this.testConfigForm.value.refrence_range[index + 1], // Next item as BPDiastolic
          });
        }
        
      })

    } else {
      
      referenceRange = this.testConfigForm.value.refrence_range.map((range) => (
        {
        gender: range.gender,
        age: range.age,
        high: range.high,
        low: range.low,
        criticalHigh: range.criticalHigh,
        criticalLow: range.criticalLow,
        unit: range.unit,
      }));
    }

    const reqData = {
      vitalsType: this.testConfigForm.value.vitalsType,
      rangeData: referenceRange,
    };


    this.loader.start();

    this.sadminService.addVitalsThreshold(reqData).subscribe({
      next: (result) => {
        const response = this.coreService.decryptObjectData({ data: result });
        if (response.status) {
          this.coreService.showSuccess("", "Vitals threshold added successfully");
          this.getVitalThresholdList();
          this.closePopup();
          this.resetForm();
        } else {
          this.coreService.showError("", response.message);
        }
        this.loader.stop();
      },
      error: (err: ErrorEvent) => {
        this.loader.stop();
        console.error("Error during API call:", err);
        this.coreService.showError("Error", err.error ? err.error.message : "An unknown error occurred.");
      },
    });
  }

  // async submitFormEdit() {
  //   this.isSubmitted = true;

  //   if (this.testConfigFormEdit.invalid) {
  //     this.testConfigFormEdit.markAllAsTouched();
  //     this.coreService.showError("", "Please fill all required fields.");
  //     return;
  //   }

  //   // Prepare data for update API call
  //   const reqDataByID = {
  //     vitalsType: this.testConfigFormEdit.value.vitalsType,
  //     gender: this.testConfigFormEdit.value.gender,
  //     age: this.testConfigFormEdit.value.age,
  //     high: this.testConfigFormEdit.value.high,
  //     low: this.testConfigFormEdit.value.low,
  //     criticalHigh: this.testConfigFormEdit.value.criticalHigh,
  //     criticalLow: this.testConfigFormEdit.value.criticalLow,
  //     unit: this.testConfigFormEdit.value.unit,
  //     id: this.testConfigId,
  //   };


  //   // Only proceed with API call if `testConfigId` is present
  //   if (this.testConfigId) {
  //     this.loader.start();

  //     this.sadminService.updateVitalThresholdApi(reqDataByID).subscribe({
  //       next: (result) => {
  //         const response = this.coreService.decryptObjectData({ data: result });
  //         if (response.status) {
  //           this.coreService.showSuccess("", "Vitals threshold updated successfully");
  //           this.getVitalThresholdList();
  //           this.closePopup();
  //           this.resetForm();
  //         } else {
  //           this.coreService.showError("", response.message);
  //         }
  //         this.loader.stop();
  //       },
  //       error: (err: ErrorEvent) => {
  //         this.loader.stop();
  //         console.error("Error during API call:", err); // Log API error details
  //         this.coreService.showSuccess("", "Vitals threshold updated successfully");
  //         // this.coreService.showError("Error", err.error ? err.error.message : "An unknown error occurred.");
  //       },
  //     });
  //   } else {
  //     console.warn("No testConfigId found; skipping update API call.");
  //     this.coreService.showError("", "No valid ID provided for updating the vitals threshold.");
  //   }
  // }

  async submitFormEdit(data:any) {
    this.isSubmitted = true;

    if (this.testConfigFormEdit.invalid) {
      this.testConfigFormEdit.markAllAsTouched();
      this.coreService.showError("", "Please fill all required fields.");
      return;
    }

    const referenceRange = this.testConfigFormEdit.value.refrence_range.map((range) => ({
      gender: range.gender,
      age: range.age,
      high: range.high,
      low: range.low,
      criticalHigh: range.criticalHigh,
      criticalLow: range.criticalLow,
      unit: range.unit,
    }));
    this.testConfigId = this.testConfigFormEdit.value.id
    const reqDataByID = {
      vitalsType: this.testConfigFormEdit.value.vitalsType,
      rangeData: referenceRange,
      id: this.testConfigId
    };


    if (this.testConfigId) {
      this.loader.start();

      this.sadminService.updateVitalThresholdApi(reqDataByID).subscribe({
        next: (result) => {
          const response = this.coreService.decryptObjectData({ data: result });
          if (response.status) {
            this.coreService.showSuccess("", "Vitals threshold updated successfully");
            this.getVitalThresholdList();
            this.closePopup();
            this.resetForm();
          } else {
            this.coreService.showError("", response.message);
          }
          this.loader.stop();
        },
        error: (err: ErrorEvent) => {
          this.loader.stop();
          console.error("Error during API call:", err); 
          this.coreService.showError("Error", err.error ? err.error.message : "An unknown error occurred.");
        },
      });
    } else {
      this.coreService.showError("", "No valid ID provided for updating the vitals threshold.");
    }
  }

  openVerticallyCenteredEdit(openeditcontent: any, editData: any) {
    this.testConfigFormEdit.reset();
    this.editVitalType = editData.vitalsType;

    this.testConfigFormEdit.patchValue({
        id: editData._id,   
        vitalsType: editData.vitalsType || "",
    });

    switch (editData.vitalsType) {
        case "BLOOD_PRESSURE1":
            this.optionsEdit.clear();
            this.handleBloodPressureData(editData);
            break;

        default:
            this.optionsEdit.clear();
            editData.referenceRange.forEach((data: any) => {
                this.optionsEdit.push(this.createOption(data));
            });
            break;
    }
    this.modalService.open(openeditcontent, {
        centered: true,
        size: "xl",
        windowClass: "edit_vital_threshold_modal",
    });
  }


  private handleBloodPressureData(thresholdData: any): void {
    const diastolicData = thresholdData.BPDiastolic;
    const systolicData = thresholdData.BPSystolic;
  
    // Example: Only populate systolicData data for now
    this.testConfigFormEdit.patchValue({
      vitalsType: "BLOOD_PRESSURE",
      gender: systolicData.gender,
      age: systolicData.age,
      high: systolicData.high,
      low: systolicData.low,
      criticalHigh: systolicData.criticalHigh,
      criticalLow: systolicData.criticalLow,
      unit: systolicData.unit,
    });
  }


  deleteMed(isDeleteAll: string = "") {
    const reqData = {
      actionName: 'isDeleted',
      actionValue: true,
      id: isDeleteAll === "all" ? this.resultSource.map(item => item._id) : this.selectedMedicines,
    };

    if (reqData.id.length === 0) {
      this.toastr.error("Please select items to delete.");
      return;
    }

    this.loader.start();
    this.sadminService.deleteVitalThreshold(reqData).subscribe({
      next: (res) => {
        const response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.toastr.success(response.message);
          this.getVitalThresholdList();
          this.selectedMedicines = [];
          this.closePopup();
        } else {
          this.toastr.error(response.message);
        }
        this.loader.stop();
      },
      error: (err) => {
        console.error('Error during delete API call:', err);
        this.toastr.error('Failed to delete vitals threshold.');
        this.loader.stop();
      }
    });
  }


  handleCheckBoxChange(event, medicineId) {
    if (event.checked) {
      if (!this.selectedMedicines.includes(medicineId)) {
        this.selectedMedicines.push(medicineId);
      }
    } else {
      const index = this.selectedMedicines.indexOf(medicineId);
      if (index > -1) {
        this.selectedMedicines.splice(index, 1);
      }
    }
  }

  makeSelectAll(event: any) {
    if (event.checked == true) {
      this.resultSource?.map((element) => {
        if (!this.selectedMedicines.includes(element?._id)) {
          this.selectedMedicines.push(element?._id);
        }
      });
    } else {
      this.selectedMedicines = [];
    }
  }


  isAllSelected() {
    let allSelected = false;
    if (
      this.selectedMedicines?.length ===
      this.resultSource?.length && this.selectedMedicines?.length != 0
    ) {
      allSelected = true;
    }
    return allSelected;
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted = false;
    this.testConfigForm.reset();
    this.getVitalThresholdList();
    this.clearOtherEntries()
  }
  clearOtherEntries() {
    const length = this.options.length;
    for (let i = length - 1; i > 0; i--) {  
      this.options.removeAt(i);  
    }
  }
  

  resetForm() {
    this.testConfigForm.reset();
    const formArray = this.testConfigForm.get('refrence_range') as FormArray;
    formArray.clear();
    formArray.push(this.createOption());
    this.testConfigId = null; // Reset ID after use
    this.testConfigForm.markAsPristine();
    this.testConfigForm.markAsUntouched();
  }

  handleSearchFilter(text: any) {
    this.searchText = text.trim();
    this.getVitalThresholdList()
  }

  clearFilter() {
    this.searchText = "";
    this.getVitalThresholdList();
  }


  openVerticallyCenteredsecond(deletePopup: any, medicineId: any) {
    if (medicineId) {
      this.selectedMedicines = [medicineId];
    }
    this.modalService.open(deletePopup, { centered: true, size: 'md' });
  }


  public handlePageEvent(data: { pageIndex: number; pageSize: number }): void {

    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getVitalThresholdList();

  }

  openVerticallyCenteredAddcontent(
    openaddcontent: any
  ) {
    this.modalService.open(this.addcontentData, {
      centered: true,
      size: "xl",
      windowClass: "master_modal add_content",
    });
  }

uniqueGenderAgeValidator(): ValidatorFn {
  return (formArray: AbstractControl): ValidationErrors | null => {
    if (!(formArray instanceof FormArray)) return null;

    const seenVitals = new Set<string>(); // For non-BP vital
    const seenSystolic = new Set<string>(); // For BP Systolic
    const seenDiastolic = new Set<string>(); // For BP Diastolic
    let hasDuplicate = false;

    const vitalsType = this.testConfigForm?.get('vitalsType')?.value;

    (formArray as FormArray).controls.forEach((control, index) => {
      const gender = control.get('gender')?.value;
      const age = control.get('age')?.value;
      const key = `${gender}-${age}`;

      if (gender && age) {
        if (vitalsType === "BLOOD_PRESSURE") {
          const isSystolic = index % 2 === 0 ? true : false;

          if (isSystolic) {
            if (seenSystolic.has(key)) {
              hasDuplicate = true;
            } else {
              seenSystolic.add(key);
            }
          } else {
            if (seenDiastolic.has(key)) {
              hasDuplicate = true;
            } else {
              seenDiastolic.add(key);
            }
          }
        } else {
          // For other vitals, only one unique combination should exist
          if (seenVitals.has(key)) {
            hasDuplicate = true;
          } else {
            seenVitals.add(key);
          }
        }
      }
    });

    return hasDuplicate ? { duplicateCombination: true } : null;
  };
}

  validateNumberInput(event: KeyboardEvent): boolean {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    const keyCode = event.key;

    // Allow control keys like backspace, tab, arrows, etc.
    if (allowedKeys.includes(keyCode)) {
      return true;
    }

    // Block non-numeric characters, except for '.'
    if (!/^[0-9]$/.test(keyCode)) {
      event.preventDefault();
      return false;
    }

    return true;
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

    this.getVitalThresholdList();

  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'yyyy-MM-dd') || '';
  }


  myFilter = (d: Date | null): boolean => {
    return true;
  };

  getFormattedType(type: string): string {
    return type.replace(/_/g, ' ');
  }
}
