import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { LabimagingdentalopticalService } from 'src/app/modules/super-admin/labimagingdentaloptical.service';
import { SuperAdminService } from 'src/app/modules/super-admin/super-admin.service';
import { CoreService } from 'src/app/shared/core.service';
import { FourPortalService } from '../../four-portal.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-lab-add-manual-result',
  templateUrl: './lab-add-manual-result.component.html',
  styleUrls: ['./lab-add-manual-result.component.scss']
})
export class LabAddManualResultComponent {

  labForm: FormGroup;
  testConfigId: string;
  appointmentId: any;
  testArray: any;
  testName: any;
  alphaResultList: any = [];
  selectAll = false;
  selectedTests: any[] = [];
  testResultId: any;
  testREsultDetails: any;
  appointmentStatus: any;
  patient_details: any;
  patient_dob: any;
  patient_gender: any;
  patient_age: number;
  test_status: any;
  isAnyPending = false;
  
  constructor(private readonly fb: FormBuilder,
    private readonly coreService: CoreService,
    private readonly sadminService: SuperAdminService,
    private readonly lad_radioAdminService: LabimagingdentalopticalService,
    private readonly location: Location,
    private readonly loader: NgxUiLoaderService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly lad_radio_Service: FourPortalService) {

    this.activatedRoute.queryParams.subscribe((params: any) => {
      this.appointmentId = params.appointmentID;
      this.appointmentStatus = params.appointmentStatus;
      this.patient_details = JSON.parse(params['patientDetails']);
      this.test_status = params.testStatus;
    })

    this.patient_dob = this.patient_details?.dob;
    this.patient_gender = this.patient_details?.gender;
    this.patient_age = this.calculateAge(this.patient_dob);


    this.labForm = this.fb.group({
      tests: this.fb.array([]) // Initialize as an empty array
    });
    this.testConfigId = this.activatedRoute.snapshot.paramMap.get("id");
  }

  ngOnInit(): void {
    if (this.testConfigId !== null) {
      this.getTestRecord(this.testConfigId)
    }
    this.getAlphaResult_list();
  }


  getTestResultDetails() {
    let reqData = {
      appointmentId: this.appointmentId,
      testId: this.testConfigId,
      resultType: 'manual',
    };

    this.lad_radioAdminService.getLABTestResultDetails_API(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);
      
      if (response.status) {
        this.testREsultDetails = response?.data[0];
        this.testResultId = this.testREsultDetails?._id;
        this.patchData(this.testREsultDetails?.manualResultData)
      }

    });
  }
  patchData(data: any) {
    if (data?.length) { // Check if there is data
      const testsArray = this.labForm.get('tests') as FormArray;
      data.forEach((result, index) => {
        const testGroup = testsArray.at(index) as FormGroup;
        // Patch only the relevant fields
        if (testGroup !== undefined) {
          testGroup.patchValue({
            result: result?.result ?? '', // assuming the API response has 'result'
            flag: result?.flag ?? 'NA', // assuming the API response has 'flag'
            status: result?.status ?? 'PENDING' // assuming the API response has 'status'
          });
        }
      });
    }
  }




  get tests() {
    return this.labForm.get('tests') as FormArray;
  }

  createTestGroup(test): FormGroup {
    let ref_range;
    let crit_high;
    let crit_low;
    if (test?.testId?.testConfiguration === 'NUMERIC_RESULT') {
      let refRange = test?.testId?.referenceRange;
      const filteredRange = this.filterReferenceRange(refRange, this.patient_gender, this.patient_age);

      if (filteredRange.length > 0) {
        ref_range = filteredRange[0].low + "-" + filteredRange[0].high + " " + filteredRange[0].unit;
        
        crit_high = filteredRange[0].criticalHigh;
        crit_low = filteredRange[0].criticalLow;
      } else {
        ref_range = refRange[0].low + "-" + refRange[0].high + " " + refRange[0].unit;
        crit_high = refRange[0].criticalHigh;
        crit_low = refRange[0].criticalLow;
        
      }

    } else {
      ref_range = 'NA';
      crit_high = 'NA';
      crit_low = 'NA';
    }

    const testGroup = this.fb.group({
      select: [false],
      procedure: [test?.testName ?? ''],
      result: [''],
      flag: ['NA'],
      status: ['PENDING'],
      referencerange: [ref_range ?? ''],
      testConfiguration: [test?.testId?.testConfiguration ?? ''],
      criticalHigh: [crit_high ?? ''],
      criticalLow: [crit_low ?? '']
    });

    // Listen for changes in the 'select' checkbox
    testGroup.get('select').valueChanges.subscribe(() => {
      this.updateSelectedTests(testGroup); // Update selected tests on checkbox change
    });
    testGroup.get('status').valueChanges.subscribe(() => {
      this.updateSelectedTests(testGroup); 
    });
    // Listen for changes in the 'result' field
    testGroup.get('result').valueChanges.subscribe((value) => {
      if (value) {
        testGroup.get('select').setValue(true, { emitEvent: true }); // Check the item if there's a result value
        this.setFlagBasedOnRange(testGroup); // Update flag based on the reference range
        this.updateSelectedTests(testGroup); // Update selectedTests array
      }
    });

    return testGroup;
  }

  updateSelectedTests(testGroup: FormGroup) {
    const isSelected = testGroup.get('select').value;
    const testData = {
      procedure: testGroup.get('procedure').value,
      result: testGroup.get('result').value,
      flag: testGroup.get('flag').value,
      status: testGroup.get('status').value,
      referenceRange: testGroup.get('referencerange').value
    };

    if (isSelected) {
      // Add or update the test data in selectedTests if it’s checked
      const existingIndex = this.selectedTests.findIndex(item => item.procedure === testData.procedure);
      if (existingIndex > -1) {
        // Update existing entry
        this.selectedTests[existingIndex] = testData;
      } else {
        // Add new entry
        this.selectedTests.push(testData);
      }
    } else {
      // Remove from selectedTests if unchecked
      this.selectedTests = this.selectedTests.filter(item => item.procedure !== testData.procedure);
    }
    this.checkForPendingStatus();
  }
  checkForPendingStatus() {
    this.isAnyPending = this.selectedTests.some(test => test.status === 'PENDING');
  }
  /* flagColour */
  setFlagBasedOnRange(testGroup: FormGroup) {
    const result = testGroup.get('result').value;
    if (testGroup.get('testConfiguration').value === 'NUMERIC_RESULT') {
      const [low, high] = testGroup.get('referencerange').value
      .split('-')
      .map(part => Number(part.trim().replace(/[^\d.-]/g, ''))); 
      const criticalHigh = testGroup.get('criticalHigh').value;
      const criticalLow = testGroup.get('criticalLow').value;

      let flag = 'N'; // Normal by default
      if (result > criticalHigh) {
        flag = 'CH'; // Critical High
      } else if (result < criticalLow) {
        flag = 'CL'; // Critical Low
      } else if (result > high) {
        flag = 'H'; // High
      } else if (result < low) {
        flag = 'L'; // Low
      }

      testGroup.get('flag').setValue(flag);
    }
  }

  getResultColor(result: number, referencerange: string, criticalHigh: number, criticalLow: number, testConfiguration: string): any {
    if (testConfiguration === 'NUMERIC_RESULT') {
      if (result == null || referencerange == null) return 'black'; // Default color

      const [low, high] = referencerange.split('-').map(part => Number(part.trim().replace(/[^\d.-]/g, '')));  // Assuming range format is "low-high"

      if (result > criticalHigh) {
        return 'red'; // Critical High (CH)
      } else if (result < criticalLow) {
        return 'purple'; // Critical Low (CL)
      } else if (result > high) {
        return 'brown'; // High (H)
      } else if (result < low) {
        return 'blue'; // Low (L)
      } else {
        return 'green'; // Normal (N)
      }
    }
  }



  /* select-all-deselect */
  selectAllTests(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectAll = checked;

    const testFormArray = this.labForm.get('tests') as FormArray;
    testFormArray.controls.forEach((testGroup) => {
      testGroup.get('select').setValue(checked);
    });
  }

  updateSelectAll() {
    const testFormArray = this.labForm.get('tests') as FormArray;
    const allSelected = testFormArray.controls.every((testGroup) => (testGroup as FormGroup).get('select').value);
    const anySelected = testFormArray.controls.some((testGroup) => (testGroup as FormGroup).get('select').value);

    this.selectAll = allSelected; // Set selectMain checked if all are selected
    if (!anySelected) {
      this.selectAll = false; // Reset selectAll if any checkbox is deselected
    }
  }




  // Method to update the status for selected tests
  updateStatusForSelectedTests(newStatus: string) {
    const testFormArray = this.labForm.get('tests') as FormArray;

    testFormArray.controls.forEach((testGroup) => {
      if (testGroup.get('select').value) {
        testGroup.get('status').setValue(newStatus);
        // Update the corresponding data in selectedTests array, if needed
        const procedure = testGroup.get('procedure').value;
        const selectedTest = this.selectedTests.find(test => test.procedure === procedure);
        if (selectedTest) {
          selectedTest.status = newStatus;
        }
      }
    });
  }

  // Event handler for 'Performed' button
  onPerformedClick() {
    this.updateStatusForSelectedTests('PERFORMED');
  }

  // Event handler for 'Verify' button
  onVerifyClick() {
    this.updateStatusForSelectedTests('VERIFIED');
  }



  onSubmit(type: any = '') {
    let tempType;
    if (type === 'temp') {
      tempType = true;
    } else {
      tempType = false;

    }
    const hasEmptyResult = this.selectedTests.some(test => !test.result);

    if (hasEmptyResult) {
      this.coreService.showWarning("",'Please fill in the result for all selected tests.');
      return;
    }     
    let reqData = {
      appointmentId: this.appointmentId,
      testId: this.testConfigId,
      resultType: 'manual',
      manualResultData: this.selectedTests,
      tempSave: tempType,
      testResultId: this.testResultId ?? "",
    }
    this.loader.start();
    this.lad_radio_Service.uploadTestREsultsApi(reqData).subscribe({
      next: (result) => {
        let response = this.coreService.decryptObjectData({ data: result });
        if (response.status) {
          this.loader.stop();
          this.coreService.showSuccess("", response.message);
          this.routeToBack();
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


  async getTestRecord(id: any) {
    let reqData = {
      appointmentId: this.appointmentId,
      testId: id,

    }
    this.lad_radioAdminService.getLabManualtestRecords_api(reqData).subscribe({
      next: (result) => {
        let response = this.coreService.decryptObjectData({ data: result });
        
        if (response.status) {
          this.testName = response?.data?.testName;
          this.testArray = response?.data?.tests;
          if(this.testArray.length > 0){
            const testFormArray = this.labForm.get('tests') as FormArray;
  
            this.testArray.forEach(test => {
  
              testFormArray.push(this.createTestGroup(test));
            });
            this.getTestResultDetails();
          }else{
            this.coreService.showInfo("", `Sub Tests not added for this test. Please add subtests from superadmin.` );
          }


        } else {
          this.coreService.showError("", response.message);
        }
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("Error", err.error.message);
      },
    });
  }

  getAlphaResult_list() {
    let reqData = {
      page: 1,
      limit: 0
    };

    this.sadminService.AlphaResultsLists(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.alphaResultList = response?.body?.result;
      }

    });
  }

  routeToBack() {
    // this.route.navigate([`/portals/manage-result/Laboratory/lab-details/${this.appointmentId}`])
    this.location.back();
  }

  calculateAge(dob: string): number {
    const birthDate = new Date(dob); // Convert DOB string to Date object
    const today = new Date(); // Current date

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    // Adjust age if the current month/day is before the birth month/day
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  filterReferenceRange(referenceRange: any[], gender: string, age: number) {

    return referenceRange.filter(item => {
      // Handle 'all' for gender
      if (item.gender !== 'all' && item.gender !== gender) {
          return false; // Skip if gender does not match
      }

      if (item.age === 'all' && item.gender === 'all') {
          return true;
      }

      if (item.age.includes('+')) {
          // Handle "60+" case
          const minAge = parseInt(item.age.split('+')[0], 10);
          return age >= minAge;
      } else {
          // Handle "0-59" or similar ranges
          const [minAge, maxAge] = item.age.split('-').map(Number);
          return age >= minAge && age <= maxAge;
      }
  });
}


}
