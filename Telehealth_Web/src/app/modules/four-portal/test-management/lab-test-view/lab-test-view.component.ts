import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { Component, ViewEncapsulation } from "@angular/core";
import {
  FormGroup,
  Validators,
  FormBuilder,
  FormArray,
  ValidatorFn,
  ValidationErrors,
} from "@angular/forms";
import { CoreService } from "src/app/shared/core.service";
import { ActivatedRoute } from "@angular/router";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { LabimagingdentalopticalService } from "src/app/modules/super-admin/labimagingdentaloptical.service";
import { Location } from "@angular/common";

@Component({
  selector: 'app-lab-test-view',
  templateUrl: './lab-test-view.component.html',
  styleUrls: ['./lab-test-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LabTestViewComponent {
  testConfigForm!: FormGroup;
  isSubmitted: boolean = false;
  assessmentId: any;
  superadminId: any;
  labUserList: any = [];
  aplharesults_list: any = [];
  ageRanges: string[] = [
    "all",
    "0-59",
    "60 +",
  ];
  testConfigId: string;
  centerName: any;
  isReadOnly = true; 

  constructor(
    private readonly coreService: CoreService,
    private readonly sadminService: SuperAdminService,
    private readonly lad_radioService: LabimagingdentalopticalService,
    private readonly location: Location,
    private readonly loader: NgxUiLoaderService,
    private readonly fb: FormBuilder,
    private readonly activatedRoute: ActivatedRoute,
  ) {
    let paramId = this.activatedRoute.snapshot.paramMap.get("id");

    if (paramId !== null) {
      this.testConfigId = paramId;
      this.getTestConfig(this.testConfigId)
    }
    this.testConfigForm = this.fb.group({
      lab_centre: ["", [Validators.required]],
      test_name: ["", [Validators.required]],
      test_config: ["NUMERIC_RESULT", [Validators.required]],
      notes: [""],
      refrence_range: this.fb.array(
        [this.createOption()],
        this.uniqueGenderAgeValidator()
      ),
      alpha_results: ["", [Validators.required]],
    });

    this.testConfigForm.get('lab_centre').disable(); 
  }

  get options() {
    return this.testConfigForm.get("refrence_range") as FormArray;
  }

  createOption(): FormGroup {
    return this.fb.group({
      gender: ["", [Validators.required]],
      age: ["", [Validators.required]],
      high: ["", [Validators.required]],
      low: ["", [Validators.required]],
      criticalHigh: ["", [Validators.required]],
      criticalLow: ["", [Validators.required]],
      unit: ["", [Validators.required]],
    });
  }

  addOption() {
    (this.testConfigForm.get("refrence_range") as FormArray).push(
      this.createOption()
    );
  }

  removeOption(index: number) {
    (this.testConfigForm.get("refrence_range") as FormArray).removeAt(index);
  }

  ngOnInit(): void { 
    this.getLabUserList();
    this.getAlpharesultsList();
  }

  getAlpharesultsList(){
    let reqData = {
      limit: 0
    };

    this.sadminService.AlphaResultsLists(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      if (response.status) {
       this.aplharesults_list =  response?.body?.result
       
      }
    });
  }

  uniqueGenderAgeValidator(): ValidatorFn {
    return (formArray: FormArray): ValidationErrors | null => {
      const selectedCombinations = new Set<string>();

      for (const control of formArray.controls) {
        const gender = control.get('gender')?.value;
        const age = control.get('age')?.value;

        if (gender && age) {
          const combination = `${gender}-${age}`;
          if (selectedCombinations.has(combination)) {
            return { duplicateCombination: true };
          }
          selectedCombinations.add(combination);
        }
      }

      return null;
    };
  }
  
  getLabUserList(patchData: any = "") {
    let reqData = {
      limit: 0,
      status: "APPROVED",
      type: "Laboratory",
    };

    this.lad_radioService.laboratoryList(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        const labUserListArray = response?.data?.data;
        labUserListArray.map((user) => {
          this.labUserList.push({
            label: user?.centre_name,
            value: user?.for_portal_user?._id,
          });
        });

        if (patchData !== '') {
          this.centerName = patchData
        }
      }
    });
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

  async getTestConfig(id: any) {
    let reqData = {
      id: id
    }
    this.lad_radioService.getLabTestConfigBYID(reqData).subscribe({
      next: (result) => {
        let response = this.coreService.decryptObjectData({ data: result });
        if (response.status) {
          let ele = response?.body?.result[0]
          this.getLabUserList(ele?.labId?._id)
          this.testConfigForm.patchValue({
            test_name: ele?.testName,
            test_config: ele?.testConfiguration,
            notes: ele?.notes,
           alpha_results: ele?.alphaResult ? ele.alphaResult.join(', ') : ''
          })

          // Get the reference range FormArray
          const optionsArray = this.testConfigForm.get('refrence_range') as FormArray;

          // Clear existing FormArray controls before patching new data
          while (optionsArray.length !== 0) {
            optionsArray.removeAt(0);
          }
          // Add reference ranges from response data
          ele.referenceRange.forEach((data: any) => {
            optionsArray.push(this.fb.group({
              gender: data?.gender,
              age: data?.age,
              high: data?.high,
              low: data?.low,
              criticalHigh: data?.criticalHigh,
              criticalLow: data?.criticalLow,
              unit: data?.unit,
            }));
          });
        } else {
          this.coreService.showError("", response.message);
        }
      },
      error: (err: ErrorEvent) => {
        this.loader.stop();
        this.coreService.showError("Error", err.error.message);
      },
    });
  }
  routeBack(){
    this.location.back()
  }
}
