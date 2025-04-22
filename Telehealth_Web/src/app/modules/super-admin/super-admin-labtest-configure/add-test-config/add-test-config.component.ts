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
import { ActivatedRoute, Router } from "@angular/router";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { LabimagingdentalopticalService } from "../../labimagingdentaloptical.service";

@Component({
  selector: "app-add-test-config",
  templateUrl: "./add-test-config.component.html",
  styleUrls: ["./add-test-config.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AddTestConfigComponent {
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

  constructor(
    private coreService: CoreService,
    private sadminService: SuperAdminService,
    private lad_radioService: LabimagingdentalopticalService,
    private route: Router,
    private loader: NgxUiLoaderService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
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

    this.testConfigForm.get('test_config')?.valueChanges.subscribe((selectedValue) => {
      if (selectedValue === 'ALPHA_RESULT') {
        this.getAlpharesultsList();        
      }
    });
  }

  getAlpharesultsList() {
    let reqData = {
      limit: 0
    };

    this.sadminService.AlphaResultsLists(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.aplharesults_list = response?.body?.result

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

  async submitForm() {
    this.isSubmitted = true;

    if (this.testConfigForm.get("test_config").value === "NUMERIC_RESULT") {
      this.testConfigForm.get("alpha_results")?.clearValidators();
      this.testConfigForm.get("alpha_results")?.updateValueAndValidity();
      this.testConfigForm.get('alpha_results').setValue('');
    }

    if (this.testConfigForm.get("test_config").value === "ALPHA_RESULT") {
      const referenceRange = this.testConfigForm.get(
        "refrence_range"
      ) as FormArray;

      referenceRange.controls.forEach(group => {
        group.get('gender').clearValidators();
        group.get('age').clearValidators();
        group.get('high').clearValidators();
        group.get('low').clearValidators();
        group.get('criticalHigh').clearValidators();
        group.get('criticalLow').clearValidators();
        group.get('unit').clearValidators();

        group.get('gender').updateValueAndValidity();
        group.get('age').updateValueAndValidity();
        group.get('high').updateValueAndValidity();
        group.get('low').updateValueAndValidity();
        group.get('criticalHigh').updateValueAndValidity();
        group.get('criticalLow').updateValueAndValidity();
        group.get('unit').updateValueAndValidity();

        group.get('gender').setValue('');
        group.get('age').setValue('');
        group.get('high').setValue('');
        group.get('low').setValue('');
        group.get('criticalHigh').setValue('');
        group.get('criticalLow').setValue('');
        group.get('unit').setValue('');
      });
    }

    if (this.testConfigForm.invalid) {
      this.testConfigForm.markAllAsTouched();
      const firstInvalidField = document.querySelector(
        "input.ng-invalid, mat-select.ng-invalid"
      );
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: "smooth" });
      }
      this.coreService.showError("", "Please fill all required fields.");
      return;
    }
    let referenceRange = [];

    if (this.testConfigForm.value.test_config === 'NUMERIC_RESULT') {

      this.testConfigForm.value.refrence_range.forEach((element) => {
        let obj = element;
        referenceRange.push(obj);
      });
    } else {
      referenceRange = [];
    }


    if (this.testConfigId === null || this.testConfigId === undefined) {
      let reqData = {
        labId: this.testConfigForm.value.lab_centre,
        testName: this.testConfigForm.value.test_name,
        testConfiguration: this.testConfigForm.value.test_config,
        referenceRange: referenceRange,
        notes: this.testConfigForm.value.notes,
        alphaResult: this.testConfigForm.value.alpha_results,
      };
      this.loader.start();

      this.sadminService.addConfiguration(reqData).subscribe({
        next: (result) => {
          let response = this.coreService.decryptObjectData({ data: result });
          if (response.status) {
            this.loader.stop();
            this.coreService.showSuccess("", response.message);
            this.route.navigate([`/super-admin/test-configuration`]);
          } else {
            this.loader.stop();
            this.coreService.showError("", response.message);
          }
        },
        error: (err: ErrorEvent) => {
          this.loader.stop();
          this.coreService.showError("Error", err.error.message);
        },
      });
    } else {
      let reqData = {
        id: this.testConfigId,
        labId: this.testConfigForm.value.lab_centre,
        testName: this.testConfigForm.value.test_name,
        testConfiguration: this.testConfigForm.value.test_config,
        referenceRange: referenceRange,
        notes: this.testConfigForm.value.notes,
        alphaResult: this.testConfigForm.value.alpha_results,
      };
      this.loader.start();

      this.lad_radioService.updateLabTestConfigApi(reqData).subscribe({
        next: (result) => {
          let response = this.coreService.decryptObjectData({ data: result });
          if (response.status) {
            this.loader.stop();
            this.coreService.showSuccess("", response.message);
            this.route.navigate([`/super-admin/test-configuration`]);
          } else {
            this.loader.stop();
            this.coreService.showError("", response.message);
          }
        },
        error: (err: ErrorEvent) => {
          this.loader.stop();
          this.coreService.showError("Error", err.error.message);
        },
      });
    }


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
        this.labUserList = [];
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

}
