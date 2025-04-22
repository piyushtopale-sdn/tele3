import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { Component, ViewEncapsulation } from "@angular/core";
import { FormGroup, Validators, FormBuilder, FormArray } from "@angular/forms";
import { CoreService } from "src/app/shared/core.service";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Editor, Toolbar } from "ngx-editor";
import jsonDoc from "../../../../../assets/doc/doc";

@Component({
  selector: 'app-add-noti',
  templateUrl: './add-noti.component.html',
  styleUrls: ['./add-noti.component.scss'],
  encapsulation: ViewEncapsulation.None,

})
export class AddNotiComponent {
  notifiForm!: FormGroup;
  isSubmitted: boolean = false;
  assessmentId: any;
  superadminId: any;

  editordoc = jsonDoc;
  abouteditor!: Editor;
  abouteditor_arabic!: Editor;
  toolbar: Toolbar = [
    ["bold", "italic", "underline", "text_color", "background_color", "strike"],
    ["align_left", "align_center", "align_right", "align_justify"],
    ["ordered_list", "bullet_list"],
    ["code", "blockquote"],
    [{ heading: ["h1", "h2", "h3", "h4", "h5", "h6"] }],
    ["link", "image"],
  ];
  // toolbar_arabic: Toolbar = [
  //   ["bold", "italic", "underline", "text_color", "background_color", "strike"],
  //   ["align_left", "align_center", "align_right", "align_justify"],
  //   ["ordered_list", "bullet_list"],
  //   ["code", "blockquote"],
  //   [{ heading: ["h1", "h2", "h3", "h4", "h5", "h6"] }],                       [[6 Feb 2025 comment content arabic ]]
  //   ["link", "image"],
  // ];
  notiId: string;
  conditions = [
    { value: 'LOGIN_OTP', label: 'login_otp' },
    { value: 'FORGOT_PASSWORD', label: 'forgot_password' },
    { value: 'PRESCRIBE_MEDICATION', label: 'prescribe_medication' },
    { value: 'ORDER_MEDICINE', label: 'order_medicine' },
    { value: 'ACCEPTED_MEDICINE_ORDER', label: 'accepted_medicine_order' },
    { value: 'REJECTED_MEDICINE_ORDER', label: 'rejected_medicine_order' },
    { value: 'UNDER_PROCESS_MEDICINE_ORDER', label: 'under_process_medicine_order' },
    { value: 'COMPLETED_MEDICINE_ORDER', label: 'completed_medicine_order' },
    { value: 'PRESCRIBE_LABORATORY', label: 'prescribe_laboratory' },
    { value: 'BOOK_LABORATORY_APPOINTMENT', label: 'book_laboratory_appointment' },
    { value: 'APPROVED_LABORATORY_APPOINTMENT', label: 'approved_laboratory_appointment' },
    { value: 'REJECTED_LABORATORY_APPOINTMENT', label: 'rejected_laboratory_appointment' },
    { value: 'CANCELLED_LABORATORY_APPOINTMENT', label: 'cancelled_laboratory_appointment' },
    { value: 'UNDER_PROCESS_LABORATORY_APPOINTMENT', label: 'under_process_laboratory_appointment' },
    { value: 'COMPLETED_LABORATORY_APPOINTMENT', label: 'completed_laboratory_appointment' },
    { value: 'PRESCRIBE_RADIOLOGY', label: 'prescribe_radiology' },
    { value: 'BOOK_RADIOLOGY_APPOINTMENT', label: 'book_radiology_appointment' },
    { value: 'APPROVED_RADIOLOGY_APPOINTMENT', label: 'approved_radiology_appointment' },
    { value: 'REJECTED_RADIOLOGY_APPOINTMENT', label: 'rejected_radiology_appointment' },
    { value: 'CANCELLED_RADIOLOGY_APPOINTMENT', label: 'cancelled_radiology_appointment' },
    { value: 'UNDER_PROCESS_RADIOLOGY_APPOINTMENT', label: 'under_process_radiology_appointment' },
    { value: 'COMPLETED_RADIOLOGY_APPOINTMENT', label: 'completed_radiology_appointment' },
    { value: 'BOOK_DOCTOR_APPOINTMENT', label: 'book_doctor_appointment' },
    { value: 'APPROVED_DOCTOR_APPOINTMENT', label: 'approved_doctor_appointment' },
    { value: 'REJECTED_DOCTOR_APPOINTMENT', label: 'rejected_doctor_appointment' },
    { value: 'CANCELLED_DOCTOR_APPOINTMENT', label: 'cancelled_doctor_appointment' },
    { value: 'PATIENT_CONFIRMED_APPOINTMENT', label: 'patient_confirmed_appointment' },
    { value: 'PATIENT_DECLINED_APPOINTMENT', label: 'patient_declined_appointment' },
    { value: 'RESCHEDULE_DOCTOR_APPOINTMENT', label: 'reschedule_doctor_appointment' },
    { value: 'MISSED_DOCTOR_APPOINTMENT', label: 'missed_doctor_appointment' },
    { value: 'RESCHEDULE_LABORATORY_APPOINTMENT', label: 'reschedule_laboratory_appointment' },
    { value: 'RESCHEDULE_RADIOLOGY_APPOINTMENT', label: 'reschedule_radiology_appointment' },
    { value: 'PROFILE_CREATED', label: 'profile_created' },
    { value: 'FAMILY_PROFILE_CREATION', label: 'family_profile_creation' },
    { value: 'APPOINTMENT_REMINDER', label: 'appointment_reminder_patient' },
    { value: 'MISSED_CALL', label: 'call_missed' },
    { Value: 'WAITING_PATIENT', label: 'waiting_patient'},
    { Value: 'RESULT_RECEIVED', label: 'result_received'},
    { value: 'PATIENT_CONFIRMED_NEW_APPOINTMENT', label: 'patient_confirmed_new_appointment' },
    { value: 'REGISTERED_EXTERNAL_LAB', label: 'registered_external_lab' },
    { value: 'BOOK_LABORATORY_RADIOLOGY', label: 'lab_booking_confirmation_patient' },
    { value: 'CANCELLED_LABRADIO_APPOINTMENT', label: 'lab_booking_cancelled_patient' },
    { value: 'RESCHEDULE_LABORATORY_RADIOLOGY', label: 'lab_booking_reschedule_patient' }
  ];  


  constructor(
    private coreService: CoreService,
    private sadminService: SuperAdminService,
    private route: Router,
    private loader: NgxUiLoaderService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,


  ) {
    this.notifiForm = this.fb.group({
      title: ["", [Validators.required]],
      type: ["email", [Validators.required]],
      condition: ["", [Validators.required]],
      email_text: ["", [Validators.required]],
      // email_text_arabic: ["", [Validators.required]],          [[6 Feb 2025 comment content arabic ]]
      sms_text: ["", [Validators.required]],
      // sms_text_arabic: ["", [Validators.required]],            [[6 Feb 2025 comment content arabic ]]
    });

    let paramId = this.activatedRoute.snapshot.paramMap.get("id");

    if (paramId !== null) {
      this.notiId = paramId;
      this.getNotData(this.notiId)
    }

  }



  ngOnInit(): void {
    this.abouteditor = new Editor();
    this.abouteditor_arabic = new Editor();

  }


  handleCondition() {
    this.notifiForm.reset
  }


  async getNotData(id: any) {
    let reqData = {
      _id: id
    }
    this.sadminService.notificationListById(reqData).subscribe({
      next: (result) => {
        let response = this.coreService.decryptObjectData({ data: result });
        
        if (response.status) {
          let ele = response?.data
          this.notifiForm.patchValue({
            title: ele?.notification_title,
            type: ele?.notification_type,
            condition: ele?.condition
          })
          if (ele?.notification_type === 'sms' || ele?.notification_type === 'push_notification') {
            this.notifiForm.patchValue({
              sms_text: ele?.content,
              // sms_text_arabic: ele?.content_arabic         [[6 Feb 2025 comment content arabic ]]
            })
          }

          // if (ele?.notification_type === 'sms') {
          //   this.notifiForm.patchValue({
          //     sms_text_arabic: ele?.content_arabic         [[6 Feb 2025 comment content arabic ]]
          //   })
          // }

          if (ele?.notification_type === 'email') {
            this.notifiForm.patchValue({
              email_text: ele?.content,
              // email_text_arabic: ele?.content_arabic           [[6 Feb 2025 comment content arabic ]]
            })
          }
          // if (ele?.notification_type === 'email') {
          //   this.notifiForm.patchValue({
          //     email_text_arabic: ele?.content_arabic         [[6 Feb 2025 comment content arabic ]]
          //   })
          // }
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


  async submitForm() {
    this.isSubmitted = true;


    if (this.notifiForm.get('type').value === 'email') {
      this.notifiForm.get('sms_text')?.clearValidators();
      this.notifiForm.get('sms_text')?.updateValueAndValidity();
      this.notifiForm.get('sms_text').setValue('');
    }
    // if (this.notifiForm.get('type').value === 'email') {
    //   this.notifiForm.get('sms_text_arabic')?.clearValidators();
    //   this.notifiForm.get('sms_text_arabic')?.updateValueAndValidity();       [[6 Feb 2025 comment content arabic ]]
    //   this.notifiForm.get('sms_text_arabic').setValue('');
    // }

    if (this.notifiForm.get('type').value === 'sms' || this.notifiForm.get('type').value === 'push_notification') {
      this.notifiForm.get('email_text')?.clearValidators();
      this.notifiForm.get('email_text')?.updateValueAndValidity();
      this.notifiForm.get('email_text').setValue('');
    }

    // if (this.notifiForm.get('type').value === 'sms' || this.notifiForm.get('type').value === 'push_notification') {
    //   this.notifiForm.get('email_text_arabic')?.clearValidators();
    //   this.notifiForm.get('email_text_arabic')?.updateValueAndValidity();         [[6 Feb 2025 comment content arabic ]]
    //   this.notifiForm.get('email_text_arabic').setValue('');
    // }

    if (this.notifiForm.invalid) {
      this.notifiForm.markAllAsTouched();

      const firstInvalidField = document.querySelector(
        'input.ng-invalid, input.ng-invalid'
      );
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      this.coreService.showError("", "Please fill all required fields.")
      return;
    }

    if (this.notiId === null || this.notiId === undefined ) {

      let reqData = {
        notification_title: this.notifiForm.value.title,
        content: this.notifiForm.value.email_text ? this.notifiForm.value.email_text : this.notifiForm.value.sms_text,
        // content_arabic: this.notifiForm.value.email_text_arabic ? this.notifiForm.value.email_text_arabic : this.notifiForm.value.sms_text_arabic,   [[6 Feb 2025 comment content arabic ]]
        condition: this.notifiForm.value.condition,
        notification_type: this.notifiForm.value.type,

      }

      this.loader.start();

      this.sadminService.addNotification(reqData).subscribe({
        next: (result) => {
          let response = this.coreService.decryptObjectData({ data: result });
          if (response.status) {
            this.loader.stop();
            this.coreService.showSuccess("", response.message);
            this.route.navigate([`/super-admin/notification`]);

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
        notification_title: this.notifiForm.value.title,
        content: this.notifiForm.value.email_text ? this.notifiForm.value.email_text : this.notifiForm.value.sms_text,
        // content_arabic: this.notifiForm.value.email_text_arabic ? this.notifiForm.value.email_text_arabic : this.notifiForm.value.sms_text_arabic,  [[6 Feb 2025 comment content arabic ]]
        condition: this.notifiForm.value.condition,
        notification_type: this.notifiForm.value.type,
        id: this.notiId
      }

      this.loader.start();

      this.sadminService.updateNotification(reqData).subscribe({
        next: (result) => {
          let response = this.coreService.decryptObjectData({ data: result });
          if (response.status) {
            this.loader.stop();
            this.coreService.showSuccess("", response.message);
            this.route.navigate([`/super-admin/notification`]);

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
  ngOnDestroy(): void {
    this.abouteditor.destroy();
    this.abouteditor_arabic.destroy();
  }
}


