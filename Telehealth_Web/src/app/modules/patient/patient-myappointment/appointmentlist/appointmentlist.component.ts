import { Component, OnInit, ViewEncapsulation, ViewChild } from "@angular/core";
import {
  FormArray,
  FormBuilder,
  Validators,
  FormControl,
  FormGroup,
} from "@angular/forms";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
// import { Validators } from "ngx-editor";
import { ToastrService } from "ngx-toastr";
import { IndiviualDoctorService } from "src/app/modules/individual-doctor/indiviual-doctor.service";
import { CoreService } from "src/app/shared/core.service";
import { PatientService } from "../../patient.service";
import * as moment from "moment";
import { DateRangeType, IgxCalendarComponent } from "igniteui-angular";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";
import { ThemePalette } from "@angular/material/core";
import { DatePipe } from "@angular/common";
import { Constants } from "src/app/config/constants";
import { Router } from "@angular/router";
import { FourPortalService } from "src/app/modules/four-portal/four-portal.service";
export interface PeriodicElement {
  dateofcreation: string;
  patientname: string;
  doctorname: string;
  orderid: string;
  hospitalname: string;
  madeby: string;
  dateandtime: string;
  location: string;
  appointmentstype: string;
  fee: string;
  status: string;
}

const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: "app-appointmentlist",
  templateUrl: "./appointmentlist.component.html",
  styleUrls: ["./appointmentlist.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AppointmentlistComponent implements OnInit {
  displayedColumns: string[] = [
    "dateofcreation",
    "patientname",
    "doctorname",
    "hospitalname",
    "madeby",
    "dateandtime",
    "location",
    "appointmentstype",
    "fee",
    "status",
    "action",
  ];
  @ViewChild("calendar", { static: true })
  public calendar: IgxCalendarComponent;

  // dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
  dataSource: any = [];
  isOpen = false;
  trigger1: any;
  text: any;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  appointmentId: any;
  userID: any;
  isSubmitted: boolean;
  remainderForm: any;
  doctorID: any;
  doctordetailsData: any = {};
  doctor_availability: any[] = [];
  hospital_location: any[] = [];
  location_id: any = "";
  appointment_type = "";
  notAvalible: any = 1;
  doctorAvailableTimeSlot: any = [];
  dateForSlot: any = new Date();
  startDate: any = "";
  today: string = moment().format("MM/DD/YYYY");
  public todaycalender = new Date(Date.now());
  consulation_filter: any = "";
  appointment_filter: any = "ALL";
  doctor_rating: any;
  nextAvailable_slot: any;
  choose_slot: any;

  seletectedLocation: any = "";
  selectedLocationId: any = "";
  allAppointmentList: any[] = [];


  sortColumn: string = 'createdAt';
  sortOrder: 1 | -1 = -1;
  sortIconClass: string = 'arrow_upward';

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

  timeHourValue: any = [
    { name: "0 Hour", value: 0 },
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

  doctorinfo: any;
  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;

  value = new Date();

  reschedulingConstHours: any = Constants.RESCHEDULING_CANCEL_HOURS;
  portal_type: any;
  cancel_type: any;
  reschedule_portal_type: any;
  portal_nearestAvailableSlot: any;
  portal_nearestAvailableDate: any;
  portal_hospital_location: any;
  doctorRating: any;
  speciality: any;
  portal_dateForSlot: any;
  portal_ansjson: any;
  patientAllDetails: any;
  portal_appointmentDetails: any;
  fourportal_UserDetails: any;
  portal_choose_slot: any;
  portal_Rating: any;
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  constructor(
    private _patientService: PatientService,
    private _coreService: CoreService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastrService: ToastrService,
    private _IndiviualDoctorService: IndiviualDoctorService,
    private datePipe: DatePipe,
    private router: Router,
    private fourPortalService: FourPortalService

  ) {
    const userData = this._coreService.getLocalStorage("loginData");
    this.userID = userData._id;

    this.remainderForm = this.fb.group({
      remainderrr: this.fb.array([]),
      remainderDT: this.fb.array([]),
    });
  }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.appointmentList(`${column}:${this.sortOrder}`);
  }


  ngOnInit(): void {
    // this.calendar.disabledDates = [{ type: DateRangeType.Before,dateRange:[new Date(2023, 2, 28)]}];
    // this.appointmentList(`${this.sortColumn}:${this.sortOrder}`);
    // this.addnewRemainder();
    // this.addnewRemainderDT();
  }

  public scheduleForm: FormGroup = new FormGroup({
    hospital_location: new FormControl(""),
    appointment_typed: new FormControl(),
  });

  scheduleFormSubmit() {
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted = false;
    this.remainderForm.reset();
    this.remainderrr1.clear();
    this.remainderDT.clear();
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    // this.addnewRemainder();
    // this.addnewRemainderDT();

    // this.choose_slot = "";
    this.dateForSlot = new Date();
  }

  doctorDetails() {
    let param = { doctor_portal_id: this.doctorID };
    this._IndiviualDoctorService.doctorDetails(param).subscribe({
      next: async (res) => {
        let result = await this._coreService.decryptObjectData({ data: res });

        this.doctordetailsData = result.body?.data;
        this.doctor_availability = result?.body?.data?.in_availability;
        this.hospital_location = result?.body?.data?.hospital_location;
        // this.appointment_type = result.body?.data.in_availability[0]?.appointment_type;
        // this.location_id = result.body?.data?.hospital_location[0]?.hospital_id;
        this.doctor_rating = result?.body?.doctor_rating;

        this.doctorAvailableSlot();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  doctorAvailableSlot() {
    let param = {
      locationId: this.location_id,
      appointmentType:
        this.appointment_type === "Online"
          ? "ONLINE"
          : this.appointment_type === "Home Visit"
            ? "HOME_VISIT"
            : "FACE_TO_FACE",
      timeStamp: this.dateForSlot,
      doctorId: this.doctorID,
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
        // this.choose_slot=""
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.appointmentList();
  }

  //-------Form Array Handling--------------->
  newRemainderForm(): FormGroup {
    return this.fb.group({
      minutes: ["", [Validators.required]],
      hours: [""],
    });
  }

  newRemainderDTForm(): FormGroup {
    return this.fb.group({
      dateTime: [""],
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

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  appointmentList(sort: any = '') {
    let data = {
      patient_portal_id: this.userID,
      status: this.appointment_filter,
      // status: "APPROVED",
      consultation_type: this.consulation_filter,
      date: this.startDate,
      page: this.page,
      limit: this.pageSize,
      sort: sort
    };
    this._patientService.patientAppointmentList(data).subscribe((res: any) => {
      let data = this._coreService.decryptObjectData({ data: res });

      this.totalLength = data?.data?.totalCount;
      this.dataSource = data?.data?.data;
      this.allAppointmentList = data?.data?.data;
    });
  }

  handleAppointmentType(event: any) {
    this.appointment_filter = event;
    this.appointmentList();
  }

  handleConsulationType(event: any) {
    this.consulation_filter = event;
    this.appointmentList();
  }

  public onDateChange(data: MatDatepickerInputEvent<Date>): void {
    this.startDate = moment(data.value).format("YYYY-MM-DD");
    this.appointmentList();
  }

  clearDateFilter() {
    this.startDate = "";
    this.appointmentList();
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  openVerticallyCenteredcancelappointmentcontent(
    cancelappointmentcontent: any, type: any
  ) {
    this.cancel_type = type
    this.isOpen = false;
    this.modalService.open(cancelappointmentcontent, {
      centered: true,
      size: "md",
    });


  }

  locationList: any = ([] = []);
  getLocations(data: any) {

    this._IndiviualDoctorService.getLocations(this.doctorID).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });

      if (response.data.length != 0) {
        this.locationList = response?.data[0]?.hospital_or_clinic_location;
        this.seletectedLocation = this.locationList[0]?.hospital_name;
        this.selectedLocationId = this.locationList[0]?.hospital_id;
      }
    });
  }

  handleLocationChange(location: any) {
    this.selectedLocationId = location?.hospital_id;

    this.seletectedLocation = location?.hospital_name;
  }



  openVerticallyCenteredChooseDateTime(chooseCalender: any) {
    this.isOpen = false;
    this.modalService.dismissAll();
    this.modalService.open(chooseCalender, {
      centered: true,
      size: "xl",
      windowClass: "select_datetime",
    });
  }

  public onSelection(data: any) {
    if (data.date) {
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

  openVerticallyCentereddetale(addsecondsubsriber: any) {
    // this.appointmentId = appointmentId;
    this.modalService.open(addsecondsubsriber, { centered: true, size: "md" });
  }

  openVerticallyCenteredremainder(remaindermodal: any, appointmentData: any) {
    const dateString = appointmentData?.consultation_date;
    this.portal_type = appointmentData?.portal_type
    const date = new Date(dateString);
    const formattedDate = date.toString();

    this.maxDate = new Date(formattedDate);
    this.getReminders(this.appointmentId, this.portal_type);
    this.remainderForm.reset();
    this.remainderrr1.clear();
    this.remainderDT.clear();

    this.addnewRemainder();
    this.addnewRemainderDT();
    this.isOpen = false;
    this.modalService.open(remaindermodal, { centered: true, size: "lg" });
  }

  getReminders(appointmentId: any, portal_type: any) {
    if (portal_type !== undefined) {
      let data = {
        appointment_id: appointmentId,
        patientId: this.userID
      };
      this.fourPortalService.fourPortal_getReminder_Appointment(data).subscribe((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res });
        var timeData = [];
        for (let i = 0; i < data?.data?.data?.time_reminder_data?.length; i++) {
          var timeDataValue = data?.data?.data?.time_reminder_data[i];

          if (i > 0) {
            this.addnewRemainder();
          }
          let dataObj = {
            minutes: timeDataValue.minutes,
            hours: timeDataValue.hours,
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
    } else {
      let data = {
        appointment_id: appointmentId,
        patientId: this.userID
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


  }

  cancelAppointment() {
    if (this.cancel_type !== undefined) {
      let reqData = {
        appointment_id: this.appointmentId,
        cancelReason: this.text,
        cancelledOrAcceptedBy: this.userID,
        status: "REJECTED",
        cancel_by: "patient"
      };
      this.fourPortalService.fourPortal_cancel_approved_appointment(reqData).subscribe((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res })

        if (data.status == true) {
          this.modalService.dismissAll();
          this.toastrService.success(data.message);
          this.appointmentList();
        }

      })
    } else {
      let dataToPass = {
        appointment_id: this.appointmentId,
        cancelReason: this.text,
        status: "REJECTED",
        cancelledOrAcceptedBy: this.userID,
        type: "patient",
      };
      this._patientService.cancelAppointment(dataToPass).subscribe((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res });
        this.modalService.dismissAll();
        this.text.clear();
        this.toastrService.success(data.message);
        this.appointmentList();
      });
    }

  }

  openCancelPopup(e: any, doctorId: any) {
    this.isOpen = !this.isOpen;
    this.appointmentId = e;
    this.doctorID = doctorId;
  }

  setReminderSave() {

    this.isSubmitted = true;
    if (this.remainderForm.invalid) {
      this._coreService.showError("","Please Fill the required Fields")
      return;
    }

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
    if (this.portal_type !== undefined) {
      let reqData = {
        appointment_id: this.appointmentId,
        // portalId: this.doctorID,
        portalId: "",
        patientId: this.userID,
        format: "minutes",
        time_reminder_data: reminderData,
        datetime_reminder_data: reminderData2,
        portal_type: this.portal_type
      };

      this.fourPortalService.fourPortal_setReminder_Appointment(reqData).subscribe((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res });
        this.remainderForm.reset();
        this.modalService.dismissAll();
        this.toastrService.success(data.message);
        this.appointmentList();

      });
    } else {
      let formData = {
        appointment_id: this.appointmentId,
        // doctorId: this.doctorID,
        doctorId: "",
        patientId: this.userID,
        format: "minutes",
        time_reminder_data: reminderData,
        datetime_reminder_data: reminderData2,
      };
      this._patientService.setReminder(formData).subscribe((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res });
        // this.remainderForm.clear()
        this.modalService.dismissAll();
        this.toastrService.success(data.message);
        this.appointmentList();
      });
    }


  }

  reshedule(isNextSlot: any) {

    if (this.reschedule_portal_type !== undefined) {
      let reqData = {
        appointmentId: this.appointmentId,
        rescheduleConsultationDate:
          isNextSlot === "no"
            ? new DatePipe("en-US").transform(this.portal_dateForSlot, "yyyy-MM-dd")
            : this.portal_nearestAvailableDate,
        rescheduleConsultationTime:
          isNextSlot === "no" ? this.portal_choose_slot : this.portal_nearestAvailableSlot,
        rescheduled_by: "patient",
        rescheduled_by_id: this.userID,
      };


      this.fourPortalService
        .fourPortal_reschedule_Appointment(reqData)
        .subscribe((res) => {
          let response = this._coreService.decryptObjectData({ data: res });
          if (response.status) {
            this.toastrService.success(response?.message);
            this.closePopup();

            this.appointmentList();
          }
        });
    } else {
      let param = {
        appointmentId: this.appointmentId,

        rescheduleConsultationDate:
          isNextSlot === "no"
            ? new DatePipe("en-US").transform(this.dateForSlot, "yyyy-MM-dd")
            : this.nextAvailable_slot?.date,
        rescheduleConsultationTime:
          isNextSlot === "no" ? this.choose_slot : this.nextAvailable_slot.slot,
        rescheduled_by: "patient",
        rescheduled_by_id: this.userID,
      };



      this._IndiviualDoctorService.rescheduleAppointment(param).subscribe({
        next: (res) => {
          let data = this._coreService.decryptObjectData({ data: res });
          this.toastrService.success(data?.message);
          this.closePopup();

          this.appointmentList();
        },
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

  chooseSlot(slot: string,) {
    this.choose_slot = slot;
  }

  async openVerticallyCenteredrechedule(choosedate: any, appointmentData: any, checkDisable: any) {
    // if (checkDisable) {
    //   this._coreService.showError("", "Doctor not allow to reschedule the appointment.")
    // } else {
    this.doctorID = appointmentData?.doctor_id;
    this.appointmentId = appointmentData?.appointment_id;
    this.reschedule_portal_type = appointmentData?.portal_type;
    this.appointment_type = appointmentData?.consultation_type;
    this.location_id = appointmentData?.hospital_details?.hospital_id;
    const dateString = appointmentData?.consultation_date;
    const date = new Date(dateString);
    const formattedDate = date.toString();

    this.value = new Date(formattedDate);
    this.dateForSlot = new Date(formattedDate);
    this.portal_dateForSlot = new Date(formattedDate);
    this.choose_slot = appointmentData?.consultation_time;
    if (this.reschedule_portal_type === undefined) {
      this.doctorDetails();
      this.nextAvailableSlot();
      this.getLocations(this.doctorID);
    } else {
      this.getNextAvailablleSlot(this.appointmentId);
      this.fourportal_Details();
    }
    // await this.getDoctorInfo();

    this.isOpen = false;
    this.modalService.open(choosedate, {
      centered: true,
      size: "lg",
      windowClass: "choose_date",
    });
    // }
    // this.isOpen = false

  }

  checkForCancelation(appointmentData: any) {
    let isAbleToCancel = false;
    let counsultationDate = appointmentData?.consultation_date;
    let consultationTimeHour = appointmentData?.consultation_time?.split(
      ":"
    )[0];
    let consultationTimeMinute = appointmentData?.consultation_time
      ?.split(":")[1]
      ?.split("-")[0];
    let counsultationDateAndTime = `${counsultationDate}T${consultationTimeHour}:${consultationTimeMinute}:00`;

    let cancelationDays;
    let cancelationHours;
    let cancelationMins;
    if (appointmentData?.consultation_type === "Online") {
      cancelationDays =
        appointmentData?.in_fee_management?.online?.cancelPolicy?.noofDays;
      cancelationHours =
        appointmentData?.in_fee_management?.online?.cancelPolicy?.noofHours;
      cancelationMins =
        appointmentData?.in_fee_management?.online?.cancelPolicy?.noofmin;
    } else if (appointmentData?.consultation_type === "Home Visit") {
      cancelationDays =
        appointmentData?.in_fee_management?.home_visit?.cancelPolicy?.noofDays;
      cancelationHours =
        appointmentData?.in_fee_management?.home_visit?.cancelPolicy?.noofHours;
      cancelationMins =
        appointmentData?.in_fee_management?.home_visit?.cancelPolicy?.noofmin;
    } else {
      cancelationDays =
        appointmentData?.in_fee_management?.f2f?.cancelPolicy?.noofDays;
      cancelationHours =
        appointmentData?.in_fee_management?.f2f?.cancelPolicy?.noofHours;
      cancelationMins =
        appointmentData?.in_fee_management?.f2f?.cancelPolicy?.noofmin;
    }

    let totalHoursPolicy = cancelationDays * 24 + cancelationHours + (cancelationMins / 60);

    const currentTime = new Date();
    const targetDate = new Date(counsultationDateAndTime);
    const timeDiff = targetDate.getTime() - currentTime.getTime();

    const totalHoursForAppointment = timeDiff / (1000 * 60 * 60);
    if (totalHoursForAppointment > totalHoursPolicy) {
      isAbleToCancel = true;
    } else {
    }

    return isAbleToCancel;
  }

  checkForReschedule(appointmentData: any) {
    let isAbleToCancel = false;
    let counsultationDate = appointmentData?.consultation_date;
    let consultationTimeHour =
      appointmentData?.consultation_time?.split(":")[0];
    let consultationTimeMinute = appointmentData?.consultation_time
      ?.split(":")[1]
      ?.split("-")[0];
    let counsultationDateAndTime = `${counsultationDate}T${consultationTimeHour}:${consultationTimeMinute}:00`;

    //let totalHoursPolicy = 8; //cant reschdule if remained hour is below 8 for appointment

    let totalHoursPolicy = this.reschedulingConstHours;

    const currentTime = new Date();
    const targetDate = new Date(counsultationDateAndTime);
    const timeDiff = targetDate.getTime() - currentTime.getTime();

    const totalHoursForAppointment = Math.floor(timeDiff / (1000 * 60 * 60)); //hour remain for appointment

    if (totalHoursForAppointment >= totalHoursPolicy) {
      isAbleToCancel = true;
    }

    return isAbleToCancel;
  }

  routeRoDetails_page(id: any, portal_type: any) {

    if (portal_type !== undefined) {
      this.router.navigate([`/patient/myappointment/newappointment`], {
        queryParams: {
          appointmentId: id,
          portal_type: portal_type
        }
      })

    } else {
      this.router.navigate([`/patient/myappointment/newappointment`], {
        queryParams: {
          appointmentId: id
        }
      })
    }

  }



  /* ****************Four--Portal******************* */
  portal_choose_Slot(slot: string) {
    this.portal_choose_slot = slot;

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
    let param = { portal_user_id: this.doctorID, type: this.reschedule_portal_type };
    // let param = { doctor_portal_id: "63e2493509a65d0de48c70c8" };
    this.fourPortalService.getProfileDetailsById(param).subscribe({
      next: async (res) => {
        let result = await this._coreService.decryptObjectData({ data: res });

        this.doctordetailsData = result?.data?.result[0];
        this.portal_Rating = result?.data?.portal_rating;
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
  portal_value = new Date();
  portal_AvailableTimeSlot: any[] = [];

  portal_AvailableSlot() {
    let param = {
      locationId: this.location_id,
      appointmentType:
        this.appointment_type === "Online"
          ? "ONLINE"
          : this.appointment_type === "Home Visit"
            ? "HOME_VISIT"
            : "FACE_TO_FACE",
      timeStamp: this.portal_dateForSlot ? this.portal_dateForSlot : this.portal_value,
      portal_id: this.doctorID,
      portal_type: this.reschedule_portal_type
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


  submitclaimAppointment(orderId: any, logginId: any, type: any) {
    this.router.navigate([`/patient/appointment-claim/submitclaim/${type}`], {
      queryParams: { appointment: orderId, logginId: logginId },
    });
  }
}
