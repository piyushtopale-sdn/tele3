import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import { MatTableDataSource } from "@angular/material/table";
import {
  CalendarDayViewBeforeRenderEvent,
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarMonthViewDay,
  CalendarView,
  CalendarWeekViewBeforeRenderEvent,
} from "angular-calendar";
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours,
  format,
} from "date-fns";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { PatientService } from "../../patient.service";
import { IndiviualDoctorService } from "src/app/modules/individual-doctor/indiviual-doctor.service";
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { ActivatedRoute, Router } from "@angular/router";
import { doctor } from "@igniteui/material-icons-extended";
import { MatStepper } from "@angular/material/stepper";
import { MatTabChangeEvent, MatTabGroup } from "@angular/material/tabs";
import { Subscription, interval, map, Observable, Subject } from "rxjs";
import { DatePipe } from "@angular/common";
import {
  ContextMenuService,
  ContextMenuComponent,
} from "@perfectmemory/ngx-contextmenu";
import * as moment from "moment";
import { FourPortalService } from "src/app/modules/four-portal/four-portal.service";

export interface PeriodicElement {
  date: string;
  height: string;
  weight: string;
  hrate: string;
  bmi: string;
  bp: string;
  Pulse: string;
  resp: string;
  temp: string;
}

const ELEMENT_DATA: PeriodicElement[] = [];

export interface Medication {
  medicine: string;
  dose: string;
  frequency: string;
  treatementduration: string;
  startdate: string;
  enddate: string;
}

const MEDICATION_DATA: Medication[] = [];

@Component({
  selector: "app-patient-calender",
  templateUrl: "./patient-calender.component.html",
  styleUrls: ["./patient-calender.component.scss", "./angular-calendar.css"],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: true },
    },
  ],
})
export class PatientCalenderComponent implements OnInit {
  displayedColumns: string[] = [
    // "date",
    "height",
    "weight",
    "hrate",
    "bmi",
    "bp",
    "Pulse",
    "resp",
    "temp",
    // "action",
  ];
  dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

  displayedColumnss: string[] = [
    "medicine",
    "dose",
    "frequency",
    "treatementduration",
    "startdate",
    "enddate",
    "action",
  ];
  dataSourcee = new MatTableDataSource<Medication>(MEDICATION_DATA);

  displayedColumnsDocs: string[] = [
    "Document",
    "issue date",
    "expiry date",
    "action",
  ];
  dataSourceDocs: any[] = [];

  textQuestionList: any[] = [];
  checkboxquestion: any[] = [];
  radiobuttonquestion: any[] = [];
  assementArray: any[] = [];
  selectlistquestion: any[] = [];
  textboxquestion: any[] = [];
  portal_type: any;
  portal_appointmentDetails: any;
  fourPortal_id: any;

  openVerticallyCenteredchoosedate(choosedatecontent: any) {
    this.nextAvailableSlot();
    this.modalService.open(choosedatecontent, {
      centered: true,
      size: "lg",
      windowClass: "choose_date",
    });
  }

  // Select date and time modal
  openVerticallyCenteredselectdatetime(selectdatetimecontent: any) {
    this.modalService.open(selectdatetimecontent, {
      centered: true,
      size: "xl",
      windowClass: "select_datetime",
    });
  }

  openVerticallyCenteredsuccessmessage(successmessagecontent: any) {
    this.modalService.open(successmessagecontent, {
      centered: true,
      size: "sm",
      windowClass: "success",
    });
  }

  openVerticallyCenteredvitals(vitalscontent: any) {
    this.modalService.open(vitalscontent, {
      centered: true,
      size: "md",
      windowClass: "edit_staff",
    });
  }

  openVerticallyCenteredaddvitals(addvitalscontent: any) {
    this.modalService.open(addvitalscontent, {
      centered: true,
      size: "lg",
      windowClass: "add_vital",
    });
  }

  isMedicineUpdating: boolean = false;
  openVerticallyCenteredaddmedication(addmedicationcontent: any, data: any) {
    this.medicineForm.reset();
    this.medicines.clear();
    this.addNewMedicine();
    this.medicineId = data?._id;
    if (data) {
      //patchValue
      this.medicines.at(0).patchValue({ ...data });
      this.isMedicineUpdating = true;
      // this.medicineForm.patchValue({
      //   ...data,
      // });
    } else {
      this.isMedicineUpdating = false;
    }
    this.modalService.open(addmedicationcontent, {
      centered: true,
      size: "lg",
      windowClass: "add_medication",
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
  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  activeDayIsOpen: boolean = false;
  appointId: number = 0;
  rescheduledId: number = 0;
  cancelledId: number = 0;
  setRemainderId: number = 0;
  currentAppointmentId: any;
  contextMenu: ContextMenuComponent;

  events: Observable<Array<CalendarEvent>>;
  viewDate: Date = new Date();
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;

  refresh: Subject<any> = new Subject();
  isDayView: boolean;
  isWeekView: boolean;
  isMonthView: boolean;

  setView(view: CalendarView) {
    this.view = view;
  }

  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }

  @ViewChild("cancelappointmentcontent", { static: false })
  cancelappointmentcontent: any;

  @ViewChild("choosedate") choosedate: ElementRef<HTMLElement>;
  @ViewChild("successmessage") successmessage: ElementRef<HTMLElement>;

  resonText: any;

  bookingAvailableDates: string[] = [];

  doctordetailsData: any;
  doctor_rating: any;

  questions: any[] = [];
  isAssessmentSubmitted: boolean = false;



  appointmentId: any = "";
  documnetsForm: any = FormGroup;
  addVitals: any = FormGroup;
  medicineForm: any = FormGroup;
  Assesment: any = FormGroup;
  patient_id: any;
  doctor_id: any;
  isSubmitted: boolean = false;
  setDocToView: any = "";
  bloodGroupList: any[] = [];

  appointmentType: any = "";
  documentsData: any = [];
  vitalsData: any[] = [];
  medicinesData: any[] = [];

  vitalsPermission: boolean = false;
  medicinePermission: boolean = false;

  appointmentDate: any;
  appointmentTime: any;

  private subscription: Subscription;

  public dateNow = new Date();
  public dDay = new Date();
  milliSecondsInASecond = 1000;
  hoursInADay = 24;
  minutesInAnHour = 60;
  SecondsInAMinute = 60;

  public timeDifference;
  public secondsToDday;
  public minutesToDday;
  public hoursToDday;
  public daysToDday;

  enableCalling: boolean = false;

  medicineId: any = "";

  location_id: any;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private service: PatientService,
    private _coreService: CoreService,
    private toastr: ToastrService,
    private activatedRoute: ActivatedRoute,
    private _individualDoctor: IndiviualDoctorService,
    private datePipe: DatePipe,
    private router: Router,
    private contextMenuService: ContextMenuService,
    private date: DatePipe,
    private fourPortalService: FourPortalService
  ) {
    this.documnetsForm = this.fb.group({
      medical_document: this.fb.array([]),
    });

    this.addVitals = this.fb.group({
      date: ["", [Validators.required]],
      height: ["", [Validators.required]],
      weight: ["", [Validators.required]],
      h_rate: ["", [Validators.required]],
      bmi: ["", [Validators.required]],
      bp: ["", [Validators.required]],
      pulse: ["", [Validators.required]],
      resp: ["", [Validators.required]],
      temp: ["", [Validators.required]],
      blood_group: ["", [Validators.required]],
      clearance: ["", [Validators.required]],
      hepatics_summary: ["", [Validators.required]],
    });

    this.medicineForm = this.fb.group({
      medicines: this.fb.array([]),
    });

    this.Assesment = this.fb.group({
      assesmentQ: fb.array([]),
    });

    // this.subscription = interval(1000).subscribe((x) => {
    //   this.getTimeDifference();
    // });
  }
  ngOnInit(): void {
    this.activatedRoute.queryParamMap.subscribe(queryParams => {

      this.appointmentId = queryParams.get("appointmentId");
      this.portal_type = queryParams.get("portal_type");
    });

    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.patient_id = loginData?._id;
    this.getAppointmentDetails();
    this.addNewMedicalDocument();
    this.getCommonData();

    this.addNewMedicine();

    this.appointmentList().subscribe();
    this.refresh.next(1);
  }

  async getAppointmentDetails() {
    if (this.portal_type) {

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

            this.portal_appointmentDetails = response?.data?.appointmentDetails;
            this.fourPortal_id = response?.data?.doctor_basic_info?.basic_info?.for_portal_user;
            this.appointmentDate = this.portal_appointmentDetails?.date;
            this.appointmentTime = this.portal_appointmentDetails?.time;
            this.documentsData = response?.data?.patientAllDetails?.medicalDocument;
            this.appointmentType = this.portal_appointmentDetails?.consultationType;
            // this.doctorDetails();

            if (response.status) {
              let time;
              let hour;
              let minute;
              if (this.appointmentTime.length > 5) {
                time = this.appointmentTime.split(":");
                hour = time[0]; //get starting hour
                minute = time[1]?.split("-")[0]; //get starting minute
              } else {
                time = this.appointmentTime.split(".");
                hour = time[0];
                minute = time[1];
              }

              this.dDay = new Date(`${this.appointmentDate} ${hour}:${minute}:00`); //targeted date & time

              this.subscription = interval(1000).subscribe((x) => {
                this.getTimeDifference();
              });

              this.getPatientDetails();
            }

          }
        );
    } else {
      let reqData = {
        appointment_id: this.appointmentId,
      };

      this.service.getAppointmentDetails(reqData).subscribe(async (res) => {
        let response = await this._coreService.decryptObjectData({ data: res });
        this.doctor_id = response?.data?.doctor_basic_info[0]?.for_portal_user;
        this.appointmentDate = response?.data?.result?.consultationDate;
        this.appointmentTime = response?.data?.result?.consultationTime;
        this.documentsData = response?.data?.patient_document;
        this.appointmentType = response?.data?.result?.appointmentType;
        // this.viewDate=this.appointmentDate
        // this.getAssesmentList();
        this.getAssesmentList2();
        this.doctorDetails();

        if (response.status) {
          let time;
          let hour;
          let minute;
          if (this.appointmentTime.length > 5) {
            time = this.appointmentTime.split(":");
            hour = time[0]; //get starting hour
            minute = time[1]?.split("-")[0]; //get starting minute
          } else {
            time = this.appointmentTime.split(".");
            hour = time[0];
            minute = time[1];
          }

          this.dDay = new Date(`${this.appointmentDate} ${hour}:${minute}:00`); //targeted date & time

          this.subscription = interval(1000).subscribe((x) => {
            this.getTimeDifference();
          });

          this.getPatientDetails();
        }
      });
    }

  }

  //-------------------------Calender Code------------///////////////
  appointmentList(): Observable<any> {
    let data = {
      patient_portal_id: this.patient_id,
      status: "APPROVED",
      consultation_type: "",
      date: "",
      page: 1,
      limit: 0,
    };
    return (this.events = this.service.patientAppointmentList(data).pipe(
      map((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res });

        let appointment = [];

        data?.data?.data.forEach((element) => {
          if (element.appointment_id === this.appointmentId) {
            this.viewDate = new Date(element.consultation_date);

            appointment.push(element);
          }
        });

        // {
        //   icon:
        //     '<span class="material-icons material-icons-approv" title="Approve" style="color:#50ce30">check_circle_outline</span>', //'<i class="fa fa-check" title="Approve"></i>',
        //   name: "Approve",
        // },

        // let responsData = data.data.data;
        let responsData = appointment;
        return (responsData || []).map((res: any, index: number) => {

          let action = [];
          if (
            res.status == "New" ||
            res.status == "Upcoming" ||
            res.status == "Today"
          ) {
            action = this.sendAllAction([
              {
                icon: '<span class="material-icons material-icons-delete" title="Delete" style="color:#d00;">cancel</span>', // '<i class="fa fa-fw fa-trash" title="Delete"></i>',
                name: "Deleted",
              },
            ]);
          }

          let consulatation_date = moment(res.consultation_date).format(
            "YYYY-MM-DD"
          );

          let consulatation_start_time = res?.consultation_time?.split("-")[0];
          let consulatation_end_time = res?.consultation_time?.split("-")[1];


          let start_date_time =
            consulatation_date + "T" + consulatation_start_time + ":00";
          let end_date_time =
            consulatation_date + "T" + consulatation_end_time + ":00";

          let appointmentObj = {
            statusName: res.status,
            startDateTime: start_date_time,
            endDateTime: end_date_time,
            patientName: res.patient_name,
            doctorName: res.doctor_name,
            appointmentId: res.appointment_id,
            portal_type: res.portal_type
          };

          let title = `${res.consultation_time} ${res.patient_name}`;

          const eventObj: CalendarEvent = {
            title: title, //timeRange + appointmentObj.patientName,
            start: new Date(consulatation_date),
            end: new Date(consulatation_date),
            color: {
              primary: "brown",
              secondary: "red", // (bgColor && bgColor.color) || "#93ee93" //appointmentObj.color
            },
            cssClass: "CustomEvent",
            resizable: {
              beforeStart: true,
              afterEnd: true,
            },
            draggable: true,
            actions: action,
            meta: {
              ...appointmentObj,
            },
          };

          return eventObj;
        });

        // this.refresh.next();
      })
    ));
  }

  sendAllAction(actions: any) {
    return actions.map((obj) => {
      const icn = obj.icon as string;
      const [s1, ...s2Array] = icn.split(" ");
      const iconStr = [s1, 'value="' + obj.name + '"', s2Array].join(" ");
      obj.icon = iconStr.split(",").join(" ");

      return {
        label: obj.icon,
        onClick: ({ event }: { event: CalendarEvent }): void => {
          this.handleEvent(obj.name, event.meta);
        },
      };
    });
  }

  addEvent(event: any, type: any): void {

    let id = this.appointmentId;
    switch (type) {
      case "2":

        if (this.portal_type !== null) {

          this.router.navigate([`/patient/myappointment/newappointment`], {
            queryParams: {
              appointmentId: id,
              portal_type: this.portal_type
            }
          })
        } else {

          this.router.navigate([`/patient/myappointment/newappointment`], {
            queryParams: {
              appointmentId: id

            }
          })
        }

        break;
      case "3":
        if (this.portal_type !== null) {
          this.router.navigate([`/patient/myappointment/newappointment`], {
            queryParams: {
              appointmentId: id,
              portal_type: this.portal_type

            },
            state: {
              mode: 'CALENDER'
            }
          })
        } else {
          this.router.navigate([`/patient/myappointment/newappointment`], {
            queryParams: {
              appointmentId: id,
            },
            state: {
              mode: 'CALENDER'
            }
          })
        }
        // this.openVerticallyCenteredchoosedate(this.choosedate);
        break;
      case "4":
        this.openVerticallyCenteredcancelappointmentcontent(
          this.cancelappointmentcontent
        );
        break;
      case "6":
        if (this.portal_type !== null) {

          this.router.navigate([`/patient/myappointment/newappointment`], {
            queryParams: {
              appointmentId: id,
              portal_type: this.portal_type
            },
            state: {
              mode: "REMAINDER_CALENDER",
            },
          })
        } else {

          this.router.navigate([`/patient/myappointment/newappointment`], {
            queryParams: {
              appointmentId: id

            },
            state: {
              mode: "REMAINDER_CALENDER",
            },
          })
        }
        break;
    }
  }

  openVerticallyCenteredcancelappointmentcontent(
    cancelappointmentcontent: any
  ) {
    this.modalService.open(cancelappointmentcontent, {
      centered: true,
      size: "md",
    });
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void { }

  monthEvntsToolTip(appointmentTitle) {
    return '<div class="month-title-tip-view"> ' + appointmentTitle + " </div>";
  }

  getBgClass(index: number): string {
    return index % 2 == 0 ? "evenCellColor" : "oddCellColor";
  }

  monthViewActionCliked(action, event: CalendarEvent) {
    const actionEl = this.service.parseStringToHTML(
      action.label
    ) as HTMLElement;
    const actionName = actionEl.getAttribute("value") as string;
    this.handleEvent(actionName, event.meta);
  }

  eventClicked(event: CalendarEvent): void {
  }

  beforeMonthViewRender({ body }: { body: CalendarMonthViewDay[] }): void {
    this.isDayView = false;
    this.isWeekView = false;
    this.isMonthView = true;
    body.forEach((day) => {
      const slotInfo = {
        start: day.date,
        end: day.date,
      };
      // if (this.checkAvailability(slotInfo) && !this.isPatientScheduler) {
      //   day.cssClass = "available-bg-color";
      // }
    });
  }

  handleEvent(type: string, event: any) {

    this.currentAppointmentId = event.appointmentId;
    let appointmentObj = {
      appointmentId: event?.patientAppointmentId,
      isRecurrence: event?.isRecurrence,
      parentAppointmentId: event?.parentAppointmentId,
      deleteSeries: false,
      claimId: event?.claimId,
      patientEncounterId: event?.patientEncounterId || 0,
      isBillable: event?.isBillable,
      patientId: event?.patientID,
    };

    switch (type.toUpperCase()) {
      case "DELETED":

        this.openVerticallyCenteredcancelappointmentcontent(
          this.cancelappointmentcontent
        );
        break;
      default:
        break;
    }
  }

  public onContextMenu(
    $event: any,
    selectedEvent: CalendarEvent = null,
    rescheduleDate: null | Date = null
  ): void {

    this.appointId =
      $event.target.className.toLowerCase().indexOf("cal-event") == 0 ||
        $event.target.className.toLowerCase().indexOf("appt-blk") == 0 ||
        $event.target.className.toLowerCase().indexOf("month-event-txt-s") == 0
        ? 1
        : 0;



    if (
      $event.target.className.indexOf("material-icons") != 0 &&
      $event.target.className.indexOf("cal-event-title") != 0
    ) {

      // checking for cancelled in content menu
      this.contextMenuService.show.next({
        anchorElement: $event.target,
        // Optional - if unspecified, all context menu components will open
        contextMenu: this.contextMenu,
        event: <any>$event,
        item: 5

      });

      if (selectedEvent && selectedEvent.meta) {
        if (
          selectedEvent.meta.statusName == "New" ||
          selectedEvent.meta.statusName == "Upcoming" ||
          selectedEvent.meta.statusName == "Today"
        ) {

          this.cancelledId = 1;
        } else {
          this.cancelledId = 0;
        }
        // checking rescheduling in content menu
        if (
          selectedEvent.meta.statusName == "Upcoming" ||
          selectedEvent.meta.statusName == "Today"
        ) {
          this.rescheduledId = 1;
          this.setRemainderId = 1;
        } else {
          this.rescheduledId = 0;
          this.setRemainderId = 0;
        }

        // localStorage.setItem('apptId', selectedEvent.meta.patientAppointmentId);
        this.currentAppointmentId = selectedEvent.meta.appointmentId;
      }
      // this.contextMenuService.show.next({
      //   anchorElement: $event.target,
      //   // Optional - if unspecified, all context menu components will open
      //   contextMenu: this.contextMenu,
      //   event: <any>$event,
      //   item: 5,
      // });
      $event.preventDefault();
      $event.stopPropagation();
    }
  }

  isBoolingDateAvailable(reqDate: Date): boolean {
    if (this.bookingAvailableDates && this.bookingAvailableDates.length > 0) {
      const dateStr = format(reqDate, "YYYY-MM-DD");
      return this.bookingAvailableDates.some((x) => x == dateStr)
        ? true
        : false;
    } else {
      return false;
    }
  }

  toDateString(date) {
    return this.date.transform(new Date(date), "dd");
  }

  openVerticallyCentereddetale(addsecondsubsriber: any) {
    this.modalService.open(addsecondsubsriber, { centered: true, size: "md" });
  }

  cancelAppointment() {

    if(this.portal_type !== null){
      let dataToPass = {
        appointment_id: this.appointmentId,
        cancelReason: this.resonText,
        status: "REJECTED",
        cancelledOrAcceptedBy: this.patient_id,
        type: "patient",
        
      };
  
      this.fourPortalService.fourPortal_cancel_approved_appointment(dataToPass).subscribe((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res });
        this.modalService.dismissAll();
        this._coreService.showSuccess(data.message, "");
        this.refresh.next(1);
        this.router.navigate(["/patient/waitingroom"]);
      });
    }else{
      let dataToPass = {
        appointment_id: this.appointmentId,
        cancelReason: this.resonText,
        status: "REJECTED",
        cancelledOrAcceptedBy: this.patient_id,
        type: "patient",
      };
  
      this.service.cancelAppointment(dataToPass).subscribe((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res });
        this.modalService.dismissAll();
        this._coreService.showSuccess(data.message, "");
        this.refresh.next(1);
        this.router.navigate(["/patient/waitingroom"]);
      });
    }

  }

  /////////////////-----------------------------//////////////

  getPatientDetails() {
    let reqData = {
      patient_id: this.patient_id,
      doctor_id: this.doctor_id,
    };


    this.service.profileDetails(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response.status) {
        if (response?.body?.vitalPermission) {
          this.vitalsPermission = response?.body?.vitalPermission;
        }

        if (response?.body?.currentMedicinePermission) {
          this.medicinePermission = true;
        }

        this.vitalsData = response?.body?.vitalsDetails;
        // this.documentsData = response?.body?.medicalDocument;
        this.medicinesData = response?.body?.medicineDetails?.current_medicines;

        let docs: any = [];

        response?.body?.medicalDocument.forEach((element) => {
          docs.push({
            doc_name: element?.name,
            issue_date: element?.issue_date,
            expiration_date: element?.expiration_date,
            image_url: element?.image_signed_url,
          });
        });

        this.documentsData = [...this.documentsData, ...docs];

      }
    });
  }

  //-----------------Code For Documents Tab--------------------
  medDocValidation(index) {
    let docs = this.documnetsForm.get("medical_document") as FormArray;
    const formGroup = docs.controls[index] as FormGroup;
    return formGroup;
  }

  get medical_document() {
    return this.documnetsForm.controls["medical_document"] as FormArray;
  }

  addNewMedicalDocument() {
    const newMedicalDoc = this.fb.group({
      name: ["", [Validators.required]],
      issue_date: ["", [Validators.required]],
      expiration_date: [""],
      image: ["", [Validators.required]],
    });
    this.medical_document.push(newMedicalDoc);
  }

  deleteMedicalDoc(index: number) {
    this.medical_document.removeAt(index);
  }

  handleSaveDocuments() {
    this.isSubmitted = true;
    if (this.documnetsForm.invalid) {
      return;
    }
    this.isSubmitted = false;

    let reqData = {
      patient_id: this.patient_id,
      doctor_id: this.doctor_id,
      ...this.documnetsForm.value,
    };
    this.service.medicalDocuments(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      if (response.status) {
        this.toastr.success(response.message);
        this.resetDocsForm();
        this.getPatientDetails();
        this.nextStep();
      } else {
        this.toastr.error(response.message);
      }
    });
  }

  resetDocsForm() {
    this.documnetsForm.reset();
    this.medical_document.clear();
    this.addNewMedicalDocument();
  }

  async onMedicalDocChange(event: any, index: any) {
    if (event.target.files.length > 0) {
      let file = event.target.files[0];
      let formData: any = new FormData();
      formData.append("userId", this.patient_id);
      formData.append("docType", index);
      formData.append("multiple", "false");
      formData.append("docName", file);

      await this.uploadDocuments(formData).then((res: any) => {
        this.medical_document.at(index).patchValue({
          image: res.data[0].Key,
        });
      });
    }
  }

  uploadDocuments(doc: FormData) {
    return new Promise((resolve, reject) => {
      this.service.uploadFile(doc).subscribe(
        (res) => {
          let response = this._coreService.decryptObjectData(res);
          resolve(response);
        },
        (err) => {
          let errResponse = this._coreService.decryptObjectData({
            data: err.error,
          });
          this.toastr.error(errResponse.messgae);
        }
      );
    });
  }

  //-----------------Code For Medicine Tab--------------------

  medicineValidation(index) {
    let docs = this.medicineForm.get("medicines") as FormArray;
    const formGroup = docs.controls[index] as FormGroup;
    return formGroup;
  }

  get medicines() {
    return this.medicineForm.controls["medicines"] as FormArray;
  }

  addNewMedicine() {
    const newMedicalDoc = this.fb.group({
      medicine: ["", [Validators.required]],
      dose: ["", [Validators.required]],
      frequency: ["", [Validators.required]],
      strength: ["", [Validators.required]],
      start_date: ["", [Validators.required]],
      end_date: ["", [Validators.required]],
    });
    this.medicines.push(newMedicalDoc);
  }

  deleteMedicines(index: number) {
    this.medicines.removeAt(index);
  }

  handleAddMedication() {
    this.isSubmitted = true;
    if (this.medicineForm.invalid) {
      return;
    }

    if (this.isMedicineUpdating) {
      this.handleEditMedicine();
    } else {
      this.handleAddMedicines();
    }
  }

  handleAddMedicines() {
    let medicines = [];
    if (this.medicinesData.length != 0) {
      medicines = [...this.medicinesData, ...this.medicineForm.value.medicines];
    }

    let reqData = {
      patient_id: this.patient_id,
      current_medicines: medicines,
    };

    this.service.addMedicineOnWaitingRoom(reqData).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.toastr.success(response.message);
          this.modalService.dismissAll("close");
          this.getPatientDetails();
        }
      },
      (err) => {
        let errResponse = this._coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
  }

  handleEditMedicine() {
    let medicineToBeUpdate = this.medicines.at(0).value;
    let reqData = {
      patient_id: this.patient_id,
      medicine: medicineToBeUpdate,
      medicine_id: this.medicineId,
    };

    this.service.editMedicineOnWaitingRoom(reqData).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.toastr.success(response.message);
          this.modalService.dismissAll("close");
          this.getPatientDetails();
        }
      },
      (err) => {
        let errResponse = this._coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
  }

  // Quick view modal
  openVerticallyCenteredquickview(quick_view: any, url: any) {
    this.setDocToView = url;
    this.modalService.open(quick_view, {
      centered: true,
      size: "lg",
      windowClass: "quick_view",
    });
  }

  //--------------------Add Vitals Code------------------------------
  handleAddVitals() {
    let reqData = { ...this.addVitals.value, patient_id: this.patient_id };

    this.service.addVitals(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      if (response.status) {
        this.toastr.success(response.message);
        // this.goForward();
        this.closeVitalPopup();
        this.getPatientDetails();
      } else {
        this.toastr.error(response.message);
      }
    });
  }

  closeVitalPopup() {
    this.addVitals.reset();
    this.modalService.dismissAll("close");
  }

  getCommonData() {
    this.service.commonData().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      this.bloodGroupList = response?.body?.bloodGroup;
    });
  }

  //Delete Modal
  openVerticallyCenteredsecond(deleteModal: any, _id: any) {
    this.modalService.open(deleteModal, { centered: true, size: "sm" });
  }

  selectedIndex: number = 0;

  public tabChanged(tabChangeEvent: MatTabChangeEvent): void {
    this.selectedIndex = tabChangeEvent.index;
  }

  public nextStep() {
    this.selectedIndex += 1;
  }

  public previousStep() {
    this.selectedIndex -= 1;
  }

  //------------------Timer--------------------------
  private getTimeDifference() {
    this.timeDifference = this.dDay.getTime() - new Date().getTime();
    this.allocateTimeUnits(this.timeDifference);
  }

  private allocateTimeUnits(timeDifference) {
    this.secondsToDday = Math.floor(
      (timeDifference / this.milliSecondsInASecond) % this.SecondsInAMinute
    );
    this.minutesToDday = Math.floor(
      (timeDifference / (this.milliSecondsInASecond * this.minutesInAnHour)) %
      this.SecondsInAMinute
    );
    this.hoursToDday = Math.floor(
      (timeDifference /
        (this.milliSecondsInASecond *
          this.minutesInAnHour *
          this.SecondsInAMinute)) %
      this.hoursInADay
    );
    this.daysToDday = Math.floor(
      timeDifference /
      (this.milliSecondsInASecond *
        this.minutesInAnHour *
        this.SecondsInAMinute *
        this.hoursInADay)
    );

    if (
      this.daysToDday < 1 &&
      this.hoursToDday < 1 &&
      this.minutesToDday < 1 &&
      this.secondsToDday < 1
    ) {
      this.makeCallEnable();
    }


  }

  makeCallEnable() {
    this.enableCalling = true;
    this.subscription.unsubscribe();
    this.daysToDday = 0;
    this.hoursToDday = 0;
    this.minutesToDday = 0;
    this.secondsToDday = 0;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  questionAnsArray: any = [];

  // assesment =================
  handeAssesment(answer: string, question: any, obj: any = "") {

    let result = this.questionAnsArray.filter((ele) => {
      if (ele.question == question) {
        ele.answer = [answer];
      }
      return ele;
    });

  }

  //----------Reschedule-------------
  nextAvailable_slot: any;
  doctorAvailableTimeSlot: any;
  dateForSlot: any;
  choose_slot: any = "";
  hospital_location: any[] = [];

  nextAvailableSlot() {
    this._individualDoctor.nextAvailableSlot(this.appointmentId).subscribe({
      next: (res) => {
        let data = this._coreService.decryptObjectData({ data: res });

        this.nextAvailable_slot = {
          slot: data?.body?.slot?.slot,
          date: data?.body?.timeStamp,
        };
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  doctorAvailableSlot() {
    let param = {
      locationId: this.location_id,
      appointmentType: this.appointmentType,
      timeStamp: this.dateForSlot ? this.dateForSlot : new Date(),
      doctorId: this.doctor_id,
    };


    this._individualDoctor.doctorAvailableSlot(param).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });

        this.doctorAvailableTimeSlot = result.body.allGeneralSlot;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  reshedule(data: any) {

    let param = {
      appointmentId: this.appointmentId,
      rescheduleConsultationDate: this.dateForSlot
        ? new DatePipe("en-US").transform(this.dateForSlot, "yyyy-MM-dd")
        : new DatePipe("en-US").transform(
          this.nextAvailable_slot.date,
          "yyyy-MM-dd"
        ),
      rescheduleConsultationTime: this.choose_slot
        ? this.choose_slot
        : this.nextAvailable_slot.slot,
      rescheduled_by: "patient",
      rescheduled_by_id: this.patient_id,
    };
    this._individualDoctor.rescheduleAppointment(param).subscribe({
      next: (res) => {
        let data = this._coreService.decryptObjectData({ data: res });
        this.toastr.success(data?.message);
        this.closePopup();
        this.getAppointmentDetails();
        this.appointmentList().subscribe();
        this.openVerticallyCenteredsuccessmessage(this.successmessage);
      },
    });
  }

  closePopup() {
    this.modalService.dismissAll("close");
  }

  openVerticallyCenteredChooseDateTime(chooseCalender: any) {
    // this.isOpen = false;
    this.modalService.dismissAll();
    this.modalService.open(chooseCalender, {
      centered: true,
      size: "lg",
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
      this.appointmentType = data.type;
    } else {
      this.location_id = data.locationid;
    }

    this.doctorAvailableSlot();
  }

  chooseSlot(slot: string) {
    this.choose_slot = slot;
  }

  doctor_availability: any[] = [];

  doctorDetails() {
    let param = { doctor_portal_id: this.doctor_id };
    this._individualDoctor.doctorDetails(param).subscribe({
      next: async (res) => {
        let result = await this._coreService.decryptObjectData({ data: res });

        this.doctordetailsData = result.body?.data;
        this.doctor_availability = result.body?.data.in_availability;
        this.hospital_location = result.body?.data.hospital_location;
        // this.appointment_type = result.body?.data?.in_availability[0]?.appointment_type;
        this.location_id = result.body?.data?.in_availability[0]?.location_id;
        this.doctor_rating = result.body?.doctor_rating;

        this.doctorAvailableSlot();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  //---Assessments handling new code-------------------
  async getAssesmentList2() {
    let reqData = {
      page: 1,
      limit: 1000,
      searchText: "",
      doctorId: this.doctor_id,
    };

    this._individualDoctor.getQuestionnaire(reqData).subscribe({
      next: async (res) => {
        let response = await this._coreService.decryptObjectData({ data: res });

        for (let data of response.body.data) {
          if (data.controller == "textarea") {
            this.questions.push({
              type: "textarea",
              question: data?.question,
              options: data?.options,
              answer: [],
              question_id: data?._id,
              required: data?.required,
            });
          } else if (data.controller == "checkbox") {
            this.questions.push({
              type: "checkbox",
              question: data?.question,
              options: data?.options,
              answer: [],
              question_id: data?._id,
              required: data?.required,
            });
          } else if (data.controller == "radiobutton") {
            this.questions.push({
              type: "radiobutton",
              question: data?.question,
              options: data?.options,
              answer: [],
              question_id: data?._id,
              required: data?.required,
            });
          } else if (data.controller == "selectlist") {
            this.questions.push({
              type: "selectlist",
              question: data?.question,
              options: data?.options,
              answer: [],
              question_id: data?._id,
              required: data?.required,
            });
          } else if (data.controller == "textbox") {
            this.questions.push({
              type: "textbox",
              question: data?.question,
              options: data?.options,
              answer: [],
              question_id: data?._id,
              required: data?.required,
            });
          }
        }

        this.getPatientFilledAssesment2();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }



  getPatientFilledAssesment2() {
    let reqData = {
      appointmentId: this.appointmentId,
    };
    if (this.portal_type !== null) {
      this.fourPortalService.fourPortal_listAssesment_Appointment(reqData).subscribe((res) => {
        let response = this._coreService.decryptObjectData({ data: res });

        this.questions.forEach((question) => {
          response?.body?.assessments.forEach((ans) => {
            if (question?.question_id === ans?.question_id) {
              question.answer = ans?.answer;
            }
          });
        });
      });
    } else {
      this.service.getAssessmentList(reqData).subscribe((res) => {
        let response = this._coreService.decryptObjectData({ data: res });

        this.questions.forEach((question) => {
          response?.body?.assessments.forEach((ans) => {
            if (question?.question_id === ans?.question_id) {
              question.answer = ans?.answer;
            }
          });
        });
      });
    }

  }

  

  handleAnswer(question: any, answer: any, option?: string) {
    if (question.type === "checkbox") {
      if (answer) {
        question.answer.push(option);
      } else {
        question.answer = question.answer.filter((a) => a !== option);
      }
    } else {
      question.answer = [answer];
    }
  }

  saveAssessment() {
    this.isAssessmentSubmitted = true;
    let isInvalid = false;

    for (let i = 0; i < this.questions.length; i++) {
      const question = this.questions[i];
      if (question?.required && question?.answer.length === 0) {
        isInvalid = true;
        break;
      } else {
        this.isAssessmentSubmitted = false;
      }
    }

    if (isInvalid) {
      this._coreService.showError("Please fill required assessments", "");
      return;
    }

    let reqData = {
      assessments: [],
      appointmentId: this.appointmentId,
    };

    this.questions.forEach((question) => {
      reqData.assessments.push({
        question: question?.question,
        answer: question?.answer,
        question_id: question?.question_id,
      });
    });

    if (this.portal_type !== null) {
      this.fourPortalService.fourPortal_AddEditAssesment_Appointment(reqData).subscribe({
        next: (res) => {
          let response = this._coreService.decryptObjectData({ data: res });
          if (response.status) {
            this._coreService.showSuccess(response.message, "");
            this.nextStep();
          }
        },
        error: (err) => {
          console.log(err);
        },
      });
    } else {
      this.service.addAssesment(reqData).subscribe({
        next: (res) => {
          let response = this._coreService.decryptObjectData({ data: res });
          if (response.status) {
            this._coreService.showSuccess(response.message, "");
            this.nextStep();
          }
        },
        error: (err) => {
          console.log(err);
        },
      });

    }
    return;

  }
}
