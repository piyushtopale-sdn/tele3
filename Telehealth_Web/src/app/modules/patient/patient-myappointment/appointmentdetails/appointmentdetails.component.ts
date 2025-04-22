import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { PatientService } from "../../patient.service";
import { ActivatedRoute, Router } from "@angular/router";
import { IndiviualDoctorService } from "src/app/modules/individual-doctor/indiviual-doctor.service";
import { Location } from "@angular/common";
import { trigger } from "@angular/animations";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { DatePipe } from "@angular/common";
import { ThemePalette } from "@angular/material/core";
import { FormControl } from "@angular/forms";
import {
  Calendar,
  DateRangeType,
  IgxCalendarComponent,
} from "igniteui-angular";

import { Constants } from "src/app/config/constants";
import { FourPortalService } from "src/app/modules/four-portal/four-portal.service";
import { NgxUiLoaderService } from "ngx-ui-loader";

export interface ILocationData {
  mode: "CALENDER" | "REMAINDER_CALENDER";
}
@Component({
  selector: "app-appointmentdetails",
  templateUrl: "./appointmentdetails.component.html",
  styleUrls: ["./appointmentdetails.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AppointmentdetailsComponent implements OnInit {
  userId: any = "";
  remainderForm!: FormGroup;
  cancelAppointmentForm!: FormGroup;
  isSubmitted: boolean = false;
  appointmentId: any;
  appointmentdetail: any;
  patientDetails: any;
  patientProfile: any = "";
  doctorInfo: any;
  doctorID: any;
  resonText: any = "";
  choose_slot: any;
  dateForSlot: any;
  nextAvailable_slot: any;
  doctorAvailableTimeSlot: any[] = [];
  appointment_type: any;
  location_id: any;
  doctordetailsData: any = {};
  doctor_availability: any[] = [];
  hospital_location: any[] = [];
  doctor_rating: any;
  isOpen = false;
  nearestAvailableSlot: any;
  value = new Date();
  ansjson: any = "";
  @ViewChild("myButton") myButton: ElementRef<HTMLElement>;
  @ViewChild("consultationModal") consultationModal: ElementRef;

  @ViewChild("picker") picker: any;
  public date: moment.Moment;
  public disabled = false;
  public showSpinners = true;
  public showSeconds = false;
  public touchUi = false;
  public enableMeridian = false;
  public minDate = new Date();
  public maxDate = new Date();
  public stepHour = 1;
  public stepMinute = 1;
  public stepSecond = 1;
  public color: ThemePalette = "primary";
  public formGroup = new FormGroup({
    date: new FormControl(null, [Validators.required]),
    date2: new FormControl(null, [Validators.required]),
  });
  public dateControl = new FormControl(new Date());
  public dateControlMinMax = new FormControl(new Date());

  public options = [
    { value: true, label: "True" },
    { value: false, label: "False" },
  ];

  public listColors = ["primary", "accent", "warn"];

  public stepHours = [];
  public stepMinutes = [];
  public stepSeconds = [];

  patientappointment: any = "patientappointment";
  displayedColumns: string[] = [
    "medicine",
    "packorunit",
    "frequency",
    "duration",
  ];

  timeHourValue: any = [
    { name: "0  Hour", value: 0 },
    { name: "1  Hour", value: 1 },
    { name: "2  Hour", value: 2 },
    { name: "3  Hour", value: 3 },
    { name: "4  Hour", value: 4 },
    { name: "5  Hour", value: 5 },
    { name: "6  Hour", value: 6 },
    { name: "7  Hour", value: 7 },
    { name: "8  Hour", value: 8 },
    { name: "9  Hour", value: 9 },
    { name: "10 Hour", value: 10 },
    { name: "11 Hour", value: 11 },
    { name: "12 Hour", value: 12 },
    { name: "13 Hour", value: 13 },
    { name: "14 Hour", value: 14 },
    { name: "15 Hour", value: 15 },
    { name: "16 Hour", value: 16 },
    { name: "17 Hour", value: 17 },
    { name: "18 Hour", value: 18 },
    { name: "19 Hour", value: 19 },
    { name: "20 Hour", value: 20 },
    { name: "21 Hour", value: 21 },
    { name: "22 Hour", value: 22 },
    { name: "23 Hour", value: 23 },
  ];
  timeMinuteValue: any = [
    { name: "0  Minute", value: 0 },
    { name: "5  Minute", value: 5 },
    { name: "10  Minute", value: 10 },
    { name: "15  Minute", value: 15 },
    { name: "20  Minute", value: 20 },
    { name: "25  Minute", value: 25 },
    { name: "30  Minute", value: 30 },
    { name: "35  Minute", value: 35 },
    { name: "40  Minute", value: 40 },
    { name: "45  Minute", value: 45 },
    { name: "50  Minute", value: 50 },
    { name: "55  Minute", value: 55 },
    { name: "59  Minute", value: 59 },
  ];

  listMedicineDosagess: any[] = [];
  allDosagess: any[] = [];
  dosages: any[] = [];
  labs: any[] = [];
  imaging: any[] = [];
  vaccination: any[] = [];
  eyeglasses: any[] = [];
  others: any[] = [];
  totalCounts: any = 0;

  reschedulingConstHours: any = Constants.RESCHEDULING_CANCEL_HOURS;

  @ViewChild("calender", { read: IgxCalendarComponent, static: true })
  calendar: any;
  formatted_appointment_type: any;
  portal_type: string;
  patientAllDetails: any;
  portal_appointmentDetails: any;
  fourportal_UserDetails: any;
  portal_ansjson: any;
  fourportal_id: any;
  speciality: any;
  doctorRating: any;
  nearestAvailableDate: any;
  portal_dateForSlot :any;
  portal_hospital_location: any;
  portal_nearestAvailableSlot: any;
  portal_nearestAvailableDate: any;
  portal_value = new Date();
  portal_AvailableTimeSlot: any[] = [];
  portal_choose_slot: any;
  patientSubscriberphoto: any;
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private _coreService: CoreService,
    private toastr: ToastrService,
    private _cdr: ChangeDetectorRef,
    private _patientService: PatientService,
    private activatedRoute: ActivatedRoute,
    private _IndiviualDoctorService: IndiviualDoctorService,
    private location: Location,
    private indiviualDoctorService: IndiviualDoctorService,
    private datePipe: DatePipe,
    private fourPortalService: FourPortalService,
    private loader: NgxUiLoaderService) {

    this.activatedRoute.queryParamMap.subscribe(queryParams => {

      this.appointmentId = queryParams.get("appointmentId");
      this.portal_type = queryParams.get("portal_type");
    });


    let userData = this._coreService.getLocalStorage("loginData");
    this.userId = userData._id;






    this.remainderForm = this.fb.group({
      remainderrr: this.fb.array([]),
      remainderDT: this.fb.array([]),
    });
  }
  addConsulatationNotes() {
    this.openVerticallyCenteredapproved(this.consultationModal);
  }
  //  Approved modal
  openVerticallyCenteredapproved(approved: any) {
    this.modalService.open(approved, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
      keyboard: false,
      backdrop: false,
    });
  }

  ngOnInit(): void {
    this.addnewRemainder();
    this.addnewRemainderDT();

    if (this.portal_type) {
      this.four_portal_AppointmentDetails();
    } else {
      this.appointmentDetails();
    }

  }

  ngAfterViewInit() {
    // this.onViewChanged();
    setTimeout(() => {
      const locationInfo = this.location.getState() as ILocationData;
      if (locationInfo.mode === "CALENDER") {
        let element: HTMLElement = document.getElementById(
          "auto_trigger"
        ) as HTMLElement;
        element.click();
      }
      if (locationInfo.mode === "REMAINDER_CALENDER") {
        let element: HTMLElement = document.getElementById(
          "remainderauto_trigger"
        ) as HTMLElement;
        element.click();
      }
    }, 5000);
  }

  public onViewChanged() {
    let olddate = new Date("1970-01-01");
    let today = new Date(Date.now());

    let range = [
      new Date(olddate.getFullYear(), olddate.getMonth(), 1),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
    ];

    this.calendar.disabledDates = [
      { type: DateRangeType.Between, dateRange: range },
    ];

    // this.calendar.activeDate = new Date('2023-05-23');
    // this.calendar(new Date('2023-05-23'));

    this._cdr.detectChanges();
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted = false;
    this.remainderForm.reset();
    this.remainderrr1.clear();
    this.remainderDT.clear();
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.addnewRemainder();
    this.addnewRemainderDT();

    // this.choose_slot = "";
    this.dateForSlot = new Date();
    this.resonText = "";
  }
  //-------Form Array Handling--------------->
  newRemainderForm(): FormGroup {
    return this.fb.group({
      minutes: ["", [Validators.required]],
      hours: ["", [Validators.required]],
    });
  }
  newRemainderDTForm(): FormGroup {
    return this.fb.group({
      dateTime: ["", [Validators.required]],
    });
  }

  get remainderrr1(): FormArray {
    return this.remainderForm.get("remainderrr") as FormArray;
  }
  get remainderDT(): FormArray {
    return this.remainderForm.get("remainderDT") as FormArray;
  }

  // remainder
  addnewRemainder() {
    this.remainderrr1.push(this.newRemainderForm());
  }
  removeRemainder(i: number) {
    this.remainderrr1.removeAt(i);
  }
  // remainderDT
  addnewRemainderDT() {
    this.remainderDT.push(this.newRemainderDTForm());
  }
  removeRemainderDT(i: number) {
    this.remainderDT.removeAt(i);
  }
  //  Delete modal
  openVerticallyCentereddetale(addsecondsubsriber: any) {
    // this.appointmentId = appointmentId;
    this.modalService.open(addsecondsubsriber, { centered: true, size: "md" });
  }

  //  Add healthcare network modal
  openVerticallyCenteredcancelappointmentcontent(
    cancelappointmentcontent: any
  ) {
    this.modalService.open(cancelappointmentcontent, {
      centered: true,
      size: "md",
    });
  }

  // Remainder Modal
  openVerticallyCenteredremainder(remaindermodal: any) {
    this.getReminders(this.appointmentId);
    this.remainderForm.reset();
    this.remainderrr1.clear();
    this.remainderDT.clear();

    this.addnewRemainder();
    this.addnewRemainderDT();
    this.modalService.open(remaindermodal, { centered: true, size: "lg" });
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
  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  appointmentDetails() {
    let param = {
      appointment_id: this.appointmentId,
    };

    this._patientService.getAppointmentDetails(param).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });

        this.appointmentdetail = result?.data?.result;
        this.patientDetails = result?.data?.result.patientDetails;
        this.patientSubscriberphoto = result?.data?.insuraceSubscriberphoto;
        this.patientProfile = result?.data?.patient_profile;
        this.doctorInfo = result?.data?.doctor_basic_info[0];
        this.appointment_type = result?.data?.result?.appointmentType
        this.formatted_appointment_type = result?.data?.result?.appointmentType.replace(/_/g, ' ');
        this.ansjson = result?.data?.otherinfo?.ANSJSON;
        this.location_id = result?.data?.result?.hospital_details?.hospital_id;

        const dateString = result?.data?.result?.consultationDate;
        const date = new Date(dateString);
        const formattedDate = date.toString();

        this.maxDate = new Date(formattedDate);
        this.value = new Date(formattedDate);
        this.dateForSlot = new Date(formattedDate);
        this.choose_slot = result?.data?.result?.consultationTime;

        if (this.appointmentdetail?.status === "PAST") {
          this.getEprescription();
        }
      },

      error: (err) => {
        console.log("err", err);
      },
    });
  }

  setReminderSave() {
    let reminderData = [];
    let reminderData2 = [];
    if (
      this.remainderForm.value.remainderrr &&
      this.remainderForm.value.remainderrr.length > 0
    )
      this.remainderForm.value.remainderrr.forEach((el) => {
        reminderData.push({ hours: el?.hours, minutes: el?.minutes });
      });
    if (
      this.remainderForm.value.remainderDT &&
      this.remainderForm.value.remainderDT.length > 0
    )
      this.remainderForm.value.remainderDT.forEach((el) => {
        reminderData2.push({
          datetime: el.dateTime,
        });
      });


    if (this.portal_type) {
      this.loader.start();
      let reqData = {
        appointment_id: this.appointmentId,
        portalId: this.fourportal_id,
        patientId: this.userId,
        format: "minutes",
        time_reminder_data: reminderData,
        datetime_reminder_data: reminderData2,
        portal_type: this.portal_type
      };

      this.fourPortalService.fourPortal_setReminder_Appointment(reqData).subscribe((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res });
        this.loader.stop();
        this.remainderForm.reset();
        this.modalService.dismissAll();
        this.toastr.success(data.message);
        this.four_portal_AppointmentDetails();

      });
    } else {
      this.loader.start();
      let formData = {
        appointment_id: this.appointmentId,
        doctorId: this.doctorInfo.for_portal_user,
        patientId: this.userId,
        format: "minutes",
        time_reminder_data: reminderData,
        datetime_reminder_data: reminderData2,
      };

      this._patientService.setReminder(formData).subscribe((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res });
        this.loader.stop();
        this.remainderForm.reset();
        this.modalService.dismissAll();
        this.toastr.success(data.message);
        this.appointmentDetails();
      })
    }

  }

  cancelAppointment() {
    if(this.portal_type ){
      this.loader.start();
      let reqData = {
        appointment_id: this.appointmentId,
        cancelReason: this.resonText,        
        cancelledOrAcceptedBy: this.userId,
        status: "REJECTED",
        cancel_by: "patient"
      };
      this.fourPortalService.fourPortal_cancel_approved_appointment(reqData).subscribe((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res })
        this.loader.stop();
        this.modalService.dismissAll()
        this.toastr.success(data.message);
        this.four_portal_AppointmentDetails();
      })
    }else{
      this.loader.start();
      let dataToPass = {
        appointment_id: this.appointmentId,
        cancelReason: this.resonText,
        status: "REJECTED",
        cancelledOrAcceptedBy: this.userId,
        type: "patient",
      };
  
      this._patientService.cancelAppointment(dataToPass).subscribe((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res });
        this.loader.stop();
        this.modalService.dismissAll();
        this.toastr.success(data.message);
        this.appointmentDetails();
      });
    }
   
  }

  nextAvailableSlot() {
    this._IndiviualDoctorService
      .nextAvailableSlot(this.appointmentId)
      .subscribe({
        next: (res) => {
          let data = this._coreService.decryptObjectData({ data: res });

          this.nextAvailable_slot = {
            slot: data?.body?.slot?.slot,
            date: this.datePipe.transform(data?.body?.timeStamp, "yyyy-MM-dd"),
          };
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  reshedule(isNextSlot: any) {

    if (this.portal_type) {
      this.loader.start();
      let reqData = {
        appointmentId: this.appointmentId,
        rescheduleConsultationDate: isNextSlot === "no"
          ? new DatePipe("en-US").transform(this.portal_dateForSlot, "yyyy-MM-dd")
          : new DatePipe("en-US").transform(
            this.portal_nearestAvailableDate,
            "yyyy-MM-dd"
          ),

        rescheduleConsultationTime: isNextSlot === "no" ? this.portal_choose_slot : this.portal_nearestAvailableSlot,
        rescheduled_by: "patient",
        rescheduled_by_id: this.userId,
      };

      this.fourPortalService
        .fourPortal_reschedule_Appointment(reqData)
        .subscribe((res) => {
          let response = this._coreService.decryptObjectData({ data: res });
          if (response.status) {
            this.loader.stop();
            this.modalService.dismissAll("close");
            this.toastr.success(response.message);
            this.four_portal_AppointmentDetails();
          }
        });
    } else {
      this.loader.start();
      let param = {
        appointmentId: this.appointmentId,
        rescheduleConsultationDate:
          isNextSlot === "no"
            ? new DatePipe("en-US").transform(this.dateForSlot, "yyyy-MM-dd")
            : this.nextAvailable_slot.date,
        rescheduleConsultationTime:
          isNextSlot === "no" ? this.choose_slot : this.nextAvailable_slot.slot,
        rescheduled_by: "patient",
        rescheduled_by_id: this.userId,
      };

      // return;
      this._IndiviualDoctorService.rescheduleAppointment(param).subscribe({
        next: (res) => {
          let data = this._coreService.decryptObjectData({ data: res });
          this.loader.stop();
          this.toastr.success(data?.message);
          this.closePopup();
          this.appointmentDetails();
        },
      });
    }


  }

  chooseSlot(slot: string) {
    this.choose_slot = slot;
  }

  portal_choose_Slot(slot: string){
    this.portal_choose_slot = slot;

  }

  doctorAvailableSlot() {
    let param = {
      locationId: this.location_id,
      appointmentType: this.appointment_type,
      // timeStamp: this.dateForSlot ? this.dateForSlot : new Date(),
      timeStamp: this.dateForSlot ? this.dateForSlot : this.value,
      // doctorId: this.doctorInfo?._id,
      doctorId: this.doctorInfo?.for_portal_user,
    };


    // let param = { "locationId": "63d3cb116ef0c91c772e4627", "appointmentType": "ONLINE", "timeStamp": "2023-02-17T10:00:00.000Z", "doctorId": "63e0bc33f15a27adc67cc733" }
    this._IndiviualDoctorService.doctorAvailableSlot(param).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });

        if (result?.body?.length === 0) {
          this.doctorAvailableTimeSlot = [];
        } else {
          this.doctorAvailableTimeSlot = result?.body?.allGeneralSlot;
        }
        // this.choose_slot = "";
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  doctorDetails() {
    let param = { doctor_portal_id: this.doctorInfo.for_portal_user };
    this._IndiviualDoctorService.doctorDetails(param).subscribe({
      next: async (res) => {
        let result = await this._coreService.decryptObjectData({ data: res });

        this.doctordetailsData = result.body?.data;
        this.doctor_availability = result.body?.data.in_availability;
        this.hospital_location = result.body?.data.hospital_location;
        // this.appointment_type = result.body?.data?.in_availability[0]?.appointment_type;
        // this.location_id = result.body?.data?.in_availability[0]?.location_id;
        this.doctor_rating = result.body?.doctor_rating;

        this.doctorAvailableSlot();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  public onSelection(data: any) {

    if (data.date) {
      // this.dateForSlot = new Date(data.date).toISOString();

      const date = new Date(data.date);
      date.setHours(date.getHours() + 5, date.getMinutes() + 30); //adding 5.30 hr extra to get proper date
      const isoString = date.toISOString();
      this.dateForSlot = isoString;
    } else if (data.type) {
      this.appointment_type = data.type;
    } else {
      this.location_id = data.locationid;
    }  
      this.doctorAvailableSlot();
  }

  public onSelection2(data: any) {

    if (data.date) {
      // this.dateForSlot = new Date(data.date).toISOString();

      const date = new Date(data.date);
      date.setHours(date.getHours() + 5, date.getMinutes() + 30); //adding 5.30 hr extra to get proper date
      const isoString = date.toISOString();
      this.portal_dateForSlot = isoString;
      
    } else if (data.type) {
      this.appointment_type = data.type;
    } else {
      this.location_id = data.locationid;
    }
  
      this.portal_AvailableSlot();
    
  }

  openVerticallyCenteredChooseDateTime(chooseCalender: any) {
    this.isOpen = false;
    // this.choose_slot = "";
    this.modalService.dismissAll();
    this.modalService.open(chooseCalender, {
      centered: true,
      size: "xl",
      windowClass: "select_datetime",
    });
  }

  async openVerticallyCenteredrechedule(choosedate: any) {
    const dateString = this.appointmentdetail?.consultationDate;
    const date = new Date(dateString);
    const formattedDate = date.toString();
    this.value = new Date(formattedDate);
    this.dateForSlot = new Date(formattedDate);
    this.choose_slot = this.appointmentdetail?.consultationTime;

    if (this.portal_type) {
      this.getNextAvailablleSlot(this.appointmentId);
      this.fourportal_Details();
    } else {
      this.nextAvailableSlot();
      this.doctorDetails();
    }


    this.modalService.open(choosedate, {
      centered: true,
      size: "lg",
      windowClass: "choose_date",
    });
  }

  getReminders(appointmentId: any) {
    let data = {
      appointment_id: appointmentId,
    };
    this._patientService.getRemindersData(data).subscribe((res: any) => {
      let data = this._coreService.decryptObjectData({ data: res });
      var timeData = [];
      for (let i = 0; i < data?.data?.data?.time_reminder_data?.length; i++) {
        var timeDataValue = data?.data?.data?.time_reminder_data[i];
        if (i > 0) {
          this.addnewRemainder();
        }
        let dataObj = {
          minutes: timeDataValue?.minutes,
          hours: timeDataValue?.hours,
        };
        timeData.push(dataObj);
      }

      var dateData = [];
      for (
        let i = 0;
        i < data?.data?.data?.datetime_reminder_data?.length;
        i++
      ) {
        var timeDataValue1 =
          data?.data?.data?.datetime_reminder_data[i].datetime;

        if (i > 0) {
          this.addnewRemainderDT();
        }
        let dataObj = {
          dateTime: timeDataValue1,
        };
        dateData.push(dataObj);
      }


      this.remainderForm.patchValue({
        remainderrr: timeData,
      });
      this.remainderForm.patchValue({
        remainderDT: dateData,
      });
    });
  }

  dataSource: any = [];
  eprescriptionDetails: any;
  isPrescriptionValidate: boolean = false;
  templateSigneUrl: any = "";

  async getEprescription() {
    if(this.portal_type !== null){
      let reqData = {
        appointmentId: this.appointmentId,
        portal_type: this.portal_type
      };
  
      this.fourPortalService.fourPortal_get_ePrescription(reqData)
        .subscribe(async (res) => {
          let response = await this._coreService.decryptObjectData({ data: res });
  
          if (response.status) {
            this.eprescriptionDetails = response?.body;
            this.isPrescriptionValidate = response?.body?.isValidate;
            this.templateSigneUrl = response?.body?.previewTemplateSigendUrl;
            this.fourPortal_getAllEprescriptionsTests();
          }
        });
    }else{
   let reqData = {
      appointmentId: this.appointmentId,
    };

    this.indiviualDoctorService
      .getEprescription(reqData)
      .subscribe(async (res) => {
        let response = await this._coreService.decryptObjectData({ data: res });

        if (response.status) {
          this.eprescriptionDetails = response?.body;
          this.isPrescriptionValidate = response?.body?.isValidate;
          this.templateSigneUrl = response?.body?.previewTemplateSigendUrl;
          this.getAllEprescriptionsTests();
        }
      });
    }
 
  }

  public openPDF(): void {
    window.location.href = this.templateSigneUrl;
  }

  getAllEprescriptionsTests() {
    let reqData = {
      appointmentId: this.appointmentId,
    };
    this.indiviualDoctorService
      .getAllEprescriptionTests(reqData)
      .subscribe((res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          let data = response?.body[0];
          //For MEdicine Dosage
          this.allDosagess = data?.dosages;

          data?.dosages.forEach(async (element) => {
            let obj = {
              _id: element?.medicineId,
              medicine_name: element?.medicine_name,
            };

            let result = this.listMedicineDosagess.filter((s) =>
              s?.medicine_name.includes(element.medicine_name)
            );
            if (result.length === 0) {
              this.listMedicineDosagess.push(obj);
            }
          });

          this.labs = data?.labs;
          this.imaging = data?.imaging;
          this.vaccination = data?.vaccinations;
          this.eyeglasses = data?.eyeglasses;
          this.others = data?.others;

          this.totalCounts =
            this.listMedicineDosagess?.length +
            this.labs?.length +
            this.vaccination?.length +
            this.others?.length +
            this.eyeglasses?.length +
            this.imaging?.length;
        }
      });
  }
  fourPortal_getAllEprescriptionsTests(){
    let reqData = {
      appointmentId: this.appointmentId,
      portal_type:this.portal_type
    };
    this.fourPortalService.fourPortal_get_all_testEprescription
      (reqData)
      .subscribe((res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          let data = response?.body[0];
          //For MEdicine Dosage
          this.allDosagess = data?.dosages;

          data?.dosages.forEach(async (element) => {
            let obj = {
              _id: element?.medicineId,
              medicine_name: element?.medicine_name,
            };

            let result = this.listMedicineDosagess.filter((s) =>
              s?.medicine_name.includes(element.medicine_name)
            );
            if (result.length === 0) {
              this.listMedicineDosagess.push(obj);
            }
          });

          this.labs = data?.labs;
          this.imaging = data?.imaging;
          this.vaccination = data?.vaccinations;
          this.eyeglasses = data?.eyeglasses;
          this.others = data?.others;

          this.totalCounts =
            this.listMedicineDosagess?.length +
            this.labs?.length +
            this.vaccination?.length +
            this.others?.length +
            this.eyeglasses?.length +
            this.imaging?.length;
        }
      });
  }

  returnDosagesForMedicine(medicineName) {
    let doseArray = [];
    let statementArray = [];
    this.allDosagess.forEach((dose) => {
      if (dose.medicine_name === medicineName) {
        doseArray.push(dose);
      }
    });

    doseArray.forEach((dose) => {
      if (
        dose?.quantities?.quantity_type === "Exact_Quantity" ||
        dose?.quantities?.quantity_type === "Enough_Quantity"
      ) {
        if (dose?.frequency?.frequency_type === "Moment") {
          let statement = `${dose?.quantities?.quantity} ${dose?.quantities?.type}, Morning(${dose?.frequency?.morning}), Midday(${dose?.frequency?.midday}), Evening(${dose?.frequency?.evening}), Night(${dose?.frequency?.night}) for ${dose?.take_for?.quantity} ${dose?.take_for?.type}`;
          statementArray.push(statement);
        }

        if (
          dose?.frequency?.frequency_type === "Recurrence" ||
          dose?.frequency?.frequency_type === "Alternate_Taking"
        ) {
          let statement = `${dose?.quantities?.quantity} ${dose?.quantities?.type}, Medicines(${dose?.frequency?.medicine_quantity}) for every ${dose?.frequency?.every_quantity} ${dose?.frequency?.type},  ${dose?.take_for?.quantity} ${dose?.take_for?.type}`;
          statementArray.push(statement);
        }
      }
    });

    return statementArray;
  }

  combineTrevelAnddonsultFee(travelFee: any, consultFee: any) {
    {
      return travelFee + consultFee;
    }
  }

  disabledMessage: any = "KUNal Dukare";

  checkForCancelation() {
    let isAbleToCancel = false;
    let counsultationDate = this.appointmentdetail?.consultationDate;
    let consultationTimeHour = this.appointmentdetail?.consultationTime?.split(
      ":"
    )[0];
    let consultationTimeMinute = this.appointmentdetail?.consultationTime
      ?.split(":")[1]
      ?.split("-")[0];
    let counsultationDateAndTime = `${counsultationDate}T${consultationTimeHour}:${consultationTimeMinute}:00`;

    let cancelationDays;
    let cancelationHours;

    if (this.appointmentdetail?.appointmentType === "ONLINE") {
      cancelationDays = this.doctorInfo?.in_fee_management?.online?.cancelPolicy
        ?.noofDays;
      cancelationHours = this.doctorInfo?.in_fee_management?.online
        ?.cancelPolicy?.noofHours;
    } else if (this.appointmentdetail?.appointmentType === "HOME_VISIT") {
      cancelationDays = this.doctorInfo?.in_fee_management?.home_visit
        ?.cancelPolicy?.noofDays;
      cancelationHours = this.doctorInfo?.in_fee_management?.home_visit
        ?.cancelPolicy?.noofHours;
    } else {
      cancelationDays = this.doctorInfo?.in_fee_management?.f2f?.cancelPolicy
        ?.noofDays;
      cancelationHours = this.doctorInfo?.in_fee_management?.f2f?.cancelPolicy
        ?.noofHours;
    }

    let totalHoursPolicy = cancelationDays * 24 + cancelationHours;

    const currentTime = new Date();
    const targetDate = new Date(counsultationDateAndTime);
    const timeDiff = targetDate.getTime() - currentTime.getTime();

    const totalHoursForAppointment = Math.floor(timeDiff / (1000 * 60 * 60)); //hour remain for appointment

    if (totalHoursForAppointment > totalHoursPolicy) {
      isAbleToCancel = true;
    }
    return isAbleToCancel;
  }

  checkForReschedule() {
    let isAbleToCancel = false;
    let counsultationDate = this.appointmentdetail?.consultationDate;
    let consultationTimeHour =
      this.appointmentdetail?.consultationTime?.split(":")[0];
    let consultationTimeMinute = this.appointmentdetail?.consultationTime
      ?.split(":")[1]
      ?.split("-")[0];
    let counsultationDateAndTime = `${counsultationDate}T${consultationTimeHour}:${consultationTimeMinute}:00`;

    let totalHoursPolicy = this.reschedulingConstHours; //cant reschdule if remained hour is below 8 for appointment

    const currentTime = new Date();
    const targetDate = new Date(counsultationDateAndTime);
    const timeDiff = targetDate.getTime() - currentTime.getTime();

    const totalHoursForAppointment = Math.floor(timeDiff / (1000 * 60 * 60)); //hour remain for appointment

    if (totalHoursForAppointment >= totalHoursPolicy) {
      isAbleToCancel = true;
    } else {
    }

    return isAbleToCancel;
  }


  /* **************four-Portal*************** */

  four_portal_AppointmentDetails() {
    let reqData = {
      appointment_id: this.appointmentId,
      portal_type: this.portal_type
    }
    this.fourPortalService
      .appointment_deatils(reqData)
      .subscribe(
        async (res) => {
          let response = await this._coreService.decryptObjectData({
            data: res,
          });
          this.portal_ansjson = response?.data?.otherinfo?.ANSJSON;
          this.patientAllDetails = response?.data?.patinetDetails
          this.patientSubscriberphoto = response?.data?.insuraceSubscriberphoto;
          this.portal_appointmentDetails = response?.data?.appointmentDetails;
          this.fourportal_UserDetails = response?.data?.doctor_basic_info
          this.fourportal_id = response?.data?.doctor_basic_info?.basic_info?.for_portal_user
          this.appointment_type = this.portal_appointmentDetails?.consultationType;
          this.location_id = this.location_id =
            this.portal_appointmentDetails?.hospital_details?.hospital_id;
          const date_String = this.portal_appointmentDetails?.date;
          const datee = new Date(date_String);
          const formattedDatee = datee.toString();


          this.maxDate = new Date(formattedDatee);
          this.portal_value = new Date(formattedDatee);
          this.portal_dateForSlot = new Date(formattedDatee);
          this.portal_choose_slot = this.portal_appointmentDetails?.time;

          if (this.portal_appointmentDetails?.status === "Past") {
            this.getEprescription();
          }

        
        }
      );
  }


  getNextAvailablleSlot(id: any) {
    let req = {
      appointmentId: id
    }
    this.fourPortalService.fourPortal_nextAvaiable_slot(req).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.portal_nearestAvailableSlot = response?.body?.slot?.slot;
        this.portal_nearestAvailableDate = response?.body?.timeStamp;

      }
    });
  }
  fourportal_Details() {
    let param = { portal_user_id: this.fourportal_id, type: this.portal_type };
    // let param = { doctor_portal_id: "63e2493509a65d0de48c70c8" };
    this.fourPortalService.getProfileDetailsById(param).subscribe({
      next: async (res) => {
        let result = await this._coreService.decryptObjectData({ data: res });

        this.doctordetailsData = result?.data?.result[0];
        this.doctorRating = result?.data?.portal_rating;
        this.doctor_availability = result.data.availabilityArray;
        this.portal_hospital_location = this.doctordetailsData?.in_hospital_location?.hospital_or_clinic_location
        this.speciality = this.doctordetailsData?.specialities?.[0]?.specilization
        // this.location_id = this.location_id =
        //   result.body?.data.hospital_location[0].hospital_id;

        this.portal_AvailableSlot();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  portal_AvailableSlot() {
    let param = {
      locationId: this.location_id,
      appointmentType: this.appointment_type,
      timeStamp: this.portal_dateForSlot ? this.portal_dateForSlot : this.portal_value,
      portal_id: this.fourportal_id,
      portal_type: this.portal_type
    };


    this.fourPortalService.portalAvailableSlot(param).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        if (result?.body?.length === 0) {
          this.portal_AvailableTimeSlot = [];
        } else {
          this.portal_AvailableTimeSlot = result?.body?.allGeneralSlot;
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
}
