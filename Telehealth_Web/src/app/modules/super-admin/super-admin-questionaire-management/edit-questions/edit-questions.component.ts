import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { Component, ViewEncapsulation } from "@angular/core";
import { FormGroup, Validators, FormBuilder, FormArray } from "@angular/forms";
import { CoreService } from "src/app/shared/core.service";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxUiLoaderService } from 'ngx-ui-loader';


@Component({
  selector: 'app-edit-questions',
  templateUrl: './edit-questions.component.html',
  styleUrls: ['./edit-questions.component.scss'],
  encapsulation: ViewEncapsulation.None,

})
export class EditQuestionsComponent {
  editForm!: FormGroup;
  isSubmitted: boolean = false;
  assessmentId: any;
  superadminId: any;
  quesionnaire_details: any;


  constructor(
    private coreService: CoreService,
    private sadminService: SuperAdminService,
    private activatedRoute: ActivatedRoute,
    private route: Router,
    private loader: NgxUiLoaderService,
    private fb: FormBuilder,

  ) {

    let paramId = this.activatedRoute.snapshot.paramMap.get("id");
    this.assessmentId = paramId;

    this.editForm = this.fb.group({
      questionFor: ["", [Validators.required]],
      genderSpecific: [""],
      type: ["", [Validators.required]],
      question: ["", [Validators.required]],
      questionArabic: ["", [Validators.required]],
      options: this.fb.array([]),
      // subQuestions: this.fb.array([this.subQuestionsForm()])
    });

  }

  get options(): FormArray {
    return this.editForm.get('options') as FormArray;
  }

  createOption(): FormGroup {
    return this.fb.group({
      option: ["", [Validators.required]], // Assuming each option has a value
      optionArabic: ["", [Validators.required]],
    });
  }

  addOption() {
    (this.editForm.get('options') as FormArray).push(this.createOption());
  }

  removeOption(index: number) {
    (this.editForm.get('options') as FormArray).removeAt(index);
  }

  /****sub-questions-form*******/
  subQuestionsForm(): FormGroup {
    return this.fb.group({
      selectedOption: ["", []],
      type: ["", []],
      question: ["", []],
      questionArabic: ["", []],
      optionsSQ: this.fb.array([this.createOptionSQ()]),
    });
  }

  get subQuestionsControl(): FormArray {
    return this.editForm.get("subQuestions") as FormArray;
  }

  addSubQuestion() {
    (this.editForm.get('subQuestions') as FormArray).push(this.subQuestionsForm());
  }

  removeSubQuestions(index: number) {
    if (this.subQuestionsControl.length > 1) {
      this.subQuestionsControl.removeAt(index);
    }
  }

  /* **** dependent-question-options******* */
  createOptionSQ(): FormGroup {
    return this.fb.group({
      option: [""], // Adjust validators as needed
    });
  }

  getOptionsSQ(index: number): FormArray {
    return this.subQuestionsControl.at(index).get('optionsSQ') as FormArray;
  }

  addOptionSQ(index: number): void {
    const optionsSQ = this.getOptionsSQ(index);
    optionsSQ.push(this.createOptionSQ());
  }

  removeOptionSQ(index: number, optionIndex: number): void {
    const optionsSQ = this.getOptionsSQ(index);
    optionsSQ.removeAt(optionIndex);
  }


  ngOnInit(): void {

    this.getQuestionnaire_details();
  }

  getQuestionnaire_details() {
    let reqData = {
      id: this.assessmentId
    }

    this.sadminService.getIdBy_Questionnaire(reqData).subscribe({
      next: (result) => {
        let response = this.coreService.decryptObjectData({ data: result });

        if (response.status) {
          this.quesionnaire_details = response?.body;
          this.patchValues(this.quesionnaire_details)
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

  patchValues(data: any) {
    this.editForm.patchValue({
      questionFor: data?.questionFor,
      genderSpecific: data?.genderSpecific,
      type: data?.type,
      question: data?.question,
      questionArabic: data?.questionArabic
    });
    const optionsArray = this.editForm.get('options') as FormArray;
    data.options.forEach((ele: any) => {
      optionsArray.push(this.fb.group({
        option: ele.option,
        optionArabic: ele.optionArabic
      }));
    });
  }

  async submitForm() {
    this.isSubmitted = true;

    const isInvalid = this.editForm.invalid

    if (isInvalid) {
      this.editForm.markAllAsTouched();

      const firstInvalidField = document.querySelector(
        'input.ng-invalid, input.ng-invalid'
      );
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      this.coreService.showError("", "Please fill all required fields.")
      return;
    }

    let reqData = {
      assessmentId: this.assessmentId,
      ...this.editForm.value
    }
    this.loader.start();

    this.sadminService.update_questionnaire(reqData).subscribe({
      next: (result) => {
        let response = this.coreService.decryptObjectData({ data: result });
        if (response.status) {
          this.loader.stop();
          this.coreService.showSuccess("", response.message);
          this.route.navigate([`/super-admin/questionnaire-management`]);

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
