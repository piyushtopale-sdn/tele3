import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { Component, ViewEncapsulation } from "@angular/core";
import { FormGroup, Validators, FormBuilder, FormArray } from "@angular/forms";
import { CoreService } from "src/app/shared/core.service";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-add-questions',
  templateUrl: './add-questions.component.html',
  styleUrls: ['./add-questions.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddQuestionsComponent {
  questionForm!: FormGroup;
  isSubmitted: boolean = false;
  assessmentId: any;
  superadminId: any;


  constructor(
    private coreService: CoreService,
    private sadminService: SuperAdminService,
    private route: Router,
    private loader: NgxUiLoaderService,
    private fb: FormBuilder,

  ) {
    this.questionForm = this.fb.group({
      questionFor: ["", [Validators.required]],
      genderSpecific: [""],
      type: ["", [Validators.required]],
      question: ["", [Validators.required]],
      questionArabic: ["", [Validators.required]],
      options: this.fb.array([this.createOption()]),
      // subQuestions: this.fb.array([this.subQuestionsForm()])
    });

  }

  get options(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  createOption(): FormGroup {
    return this.fb.group({
      option: ["", []], // Assuming each option has a value
      optionArabic: [''],
    });
  }

  //For Option Only
  // addOption() {
  //   (this.questionForm.get('options') as FormArray).push(this.createOption());
  // }

  //For Both option and optionArabic
  addOption() {
    this.options.push(this.createOption());
  }

  //For Option Only
  // removeOption(index: number) {
  //   (this.questionForm.get('options') as FormArray).removeAt(index);
  // }

  //For Both option and optionArabic
  removeOption(index: number) {
    this.options.removeAt(index);
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
    return this.questionForm.get("subQuestions") as FormArray;
  }

  addSubQuestion() {
    (this.questionForm.get('subQuestions') as FormArray).push(this.subQuestionsForm());
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


  ngOnInit(): void { }


  ngAfterViewInit() { }


  async submitForm() {
    this.isSubmitted = true;

    if (this.questionForm.get('type').value === 'text') {
      const options = this.questionForm.get('options') as FormArray;

      options.controls.forEach(control => {
        control.get('option')?.clearValidators(); 
        control.get('optionArabic')?.clearValidators(); 
        control.get('option')?.updateValueAndValidity();
        control.get('optionArabic')?.updateValueAndValidity();
      });
    }

    const isInvalid = this.questionForm.invalid;

    if (isInvalid) {
      this.questionForm.markAllAsTouched();

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
      ...this.questionForm.value
    }
    this.loader.start();

    this.sadminService.addQuestionnair(reqData).subscribe({
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
