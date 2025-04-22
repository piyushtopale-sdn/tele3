import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormControl } from "@angular/forms";
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours,
} from "date-fns";

import {
  CalendarDayViewBeforeRenderEvent,
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarMonthViewDay,
  CalendarView,
  CalendarWeekViewBeforeRenderEvent,
} from "angular-calendar";

import { EventColor } from "calendar-utils";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute, Router } from "@angular/router";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { PatientService } from "src/app/modules/patient/patient.service";
import { DatePipe } from "@angular/common";
import { map, Observable, Subject } from "rxjs";
import * as moment from "moment";
import {
  ContextMenuComponent,
  ContextMenuService,
} from "@perfectmemory/ngx-contextmenu";
import { format } from "date-fns";
import { IResponse } from "src/app/shared/classes/api-response";

const colors: Record<string, EventColor> = {
  red: {
    primary: "#ad2121",
    secondary: "#FAE3E3",
  },
  blue: {
    primary: "#1e90ff",
    secondary: "#D1E8FF",
  },
  yellow: {
    primary: "#e3bc08",
    secondary: "#FDF1BA",
  },
};

interface OfficeTime {
  dayStartHour: string;
  dayStartMinute: string;
  dayEndHour: string;
  dayEndMinute: string;
}

@Component({
  selector: "app-scheduler",
  templateUrl: "./scheduler.component.html",
  styleUrls: ["./scheduler.component.scss", "./angular-calendar.css"],
  encapsulation: ViewEncapsulation.None,
})
export class SchedulerComponent implements OnInit,OnChanges {
  location = new FormControl("");
  locationList: string[] = [
    "India",
    "China",
    "Turki",
    "Japan",
    "Barma",
    "Indonesia",
  ];
  @Input() selectedStatus: any = "ALL"; 
  @Input()  dateFilter: any = "";

  patients = new FormControl("");
  patientList: any[] = [];
  // dateFilter: any = "";
 
  userId: any = "";
  events: Observable<Array<CalendarEvent>>;
  activeDayIsOpen: boolean = false; 
  trigger: any;
  contextmenu = false;
  contextmenuX = 0;
  contextmenuY = 0;
  resonText: any;

  isOpen = false;
  contextMenu: ContextMenuComponent;
  contextMenuPosition = { x: "0", y: "0" };
  openContextMenu: boolean = true;
  officeTime: OfficeTime;
  view: CalendarView = CalendarView.Month;

  CalendarView = CalendarView;
  showAllEventDaysArray: number[] = [];
  viewDate: Date = new Date();

  appointId: number = 0;
  cancelledId: number = 0;
  rescheduledId: number = 0;
  setRemainderId: number = 0;
  bookingAvailableDates: string[] = [];
  refresh: Subject<any> = new Subject();
  isDayView: boolean;
  isWeekView: boolean;
  isMonthView: boolean;
  currentAppointmentId: any;


  assign_doctor_depart: any;
  listData: any;
  assign_doctor_services: any;
  assign_doctor_unit: any;
  hospital_location: any[] = [];

  @ViewChild("cancelappointmentcontent", { static: false })
  cancelappointmentcontent: any;
  doctor_portal_id: any[];
  userRole: any;
  doctor_id: any;
  for_portal_user: any;
  currentDate: Date = new Date();
  currentMonthStartDate: string = "";
  currentMonthEndDate: string = "";
  doctorLocationFilter: any = "";
  patientLocationFilter: any = "";
  uniquePatients: string[]

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private doctorService: IndiviualDoctorService,
    private coreService: CoreService,
    private toastr: ToastrService,
    private router: Router,
    private _patientService: PatientService,
    private datePipe: DatePipe,
    private contextMenuService: ContextMenuService,
    private date: DatePipe,
    private patientService: PatientService,
    private cdr: ChangeDetectorRef
  ) { this.calculateMonthRange(this.currentDate); this.getAppointmentlist() }
  calculateMonthRange(currentDate) {
    this.currentMonthStartDate = moment(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)).format("YYYY-MM-DD");
    const nextMonth = currentDate.getMonth() + 1;
    const nextYear = currentDate.getFullYear() + (nextMonth === 12 ? 1 : 0);
    this.currentMonthEndDate = moment(new Date(nextYear, nextMonth % 12, 0)).format("YYYY-MM-DD");
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedStatus'] || changes['dateFilter']) {
      this.getAppointmentlist()
      this.cdr.detectChanges(); // Trigger change detection
    }
  }
  ngOnInit(): void {
    
    let userData = this.coreService.getLocalStorage("loginData");
    let adminData = JSON.parse(localStorage.getItem("adminData"));

    this.userId = userData._id;

    this.userRole = userData?.role;
    this.assign_doctor_depart = adminData?.department
    this.assign_doctor_services = adminData?.services
    this.assign_doctor_unit = adminData?.department



    this.for_portal_user = adminData?.in_hospital;

    this.doctor_portal_id = [];

    if (this.userRole === "INDIVIDUAL_DOCTOR_STAFF") {
      this.doctor_portal_id.push(this.for_portal_user);    
    }  
    else {
      this.doctor_portal_id.push(this.userId);     
    }
    this.getAppointmentlist();

  }
  getUniquePatients(patients: string[]): string[] {
    return Array.from(new Set(patients));
  }

  async getAppointmentlist() {
    let reqData = {
      doctor_portal_id: this.doctor_portal_id,
      limit: 1000000,
      page: 1,
      status: this.selectedStatus,
      date: this.dateFilter,
      // sort:sort
      // filterByDocLocname: this.doctorLocationFilter,
      filterByPatientname: this.patientLocationFilter

    };

    return (this.events = this.doctorService.appoinmentListApi(reqData).pipe(
      map((res: any) => {
        let data = this.coreService.decryptObjectData({ data: res });
        this.patientList = data.data.data.map((ele) => {
          return ele.patientName;
        });
        if (this.patientLocationFilter) {
          
        } else {

          this.uniquePatients = this.getUniquePatients(this.patientList);
        }

       
        let responsData = data.data.data;
        return (responsData || []).map((res: any, index: number) => {

          let action = [];
          if (
            res.status == "Pending" ||
            res.status == "Upcoming" 
          ) {
            action = this.sendAllAction([
              {
                icon: '<span class="material-icons material-icons-delete" title="Delete" style="color:#d00;">cancel</span>', // '<i class="fa fa-fw fa-trash" title="Delete"></i>',
                name: "Deleted",
              },
            ]);
          }

          let consulatation_date = moment(res.consultationDate).format(
            "YYYY-MM-DD"
          );

          

          let consulatation_start_time = res?.consultationTime?.split("-")[0];
          let consulatation_end_time = res?.consultationTime?.split("-")[1];        

          let start_date_time =
            consulatation_date + "T" + consulatation_start_time + ":00";
          let end_date_time =
            consulatation_date + "T" + consulatation_end_time + ":00";

          let appointmentObj = {
            statusName: res.status,
            startDateTime: start_date_time,
            endDateTime: end_date_time,
            patientName: res.patientName,
            appointmentId: res._id,
          };

          let title = `${res.consultationTime} ${res.patientName}`;

          const eventObj: CalendarEvent = {
            title: title, //timeRange + appointmentObj.patientName,
            start: new Date(start_date_time),
            end: new Date(end_date_time),
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

  // get doctor department,service and unit assign to staff
  async getDoctor(doctor_list) {

    let reqData = {
      in_hospital: this.doctor_id,
      doctor_list: doctor_list,
      departmentArray: this.assign_doctor_depart,
      unitArray: this.assign_doctor_unit,
      serviceArray: this.assign_doctor_services
    }

    this.doctorService.getdepartmentAsperDoctor(reqData).subscribe({

      next: async (result: IResponse<any>) => {
        let response = await this.coreService.decryptObjectData({ data: result });

        if (response.status == true) {
          this.listData = response?.body?.data.map((assDoc_is: any) => {

            if (this.doctor_portal_id.indexOf(assDoc_is?.for_portal_user) == -1) {
              this.doctor_portal_id.push(assDoc_is?.for_portal_user);
            }

          })
          this.getAppointmentlist();
        }

      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
        if (err.message === "INTERNAL_SERVER_ERROR") {
          this.coreService.showError("", err.message);
        }
      },

    })
  }

  addEvent(event: any, type: any): void {

    let id = this.currentAppointmentId;
    switch (type) {
      case "2":
        this.router.navigate(["/individual-doctor/appointment/appointmentdetails/" + id]);
        break;
      case "3":
        this.router.navigate(["/individual-doctor/appointment/appointmentdetails/" + id], {
          state: {
            mode: "CALENDER",
          },
        });
        break;
      case "4":
        this.openVerticallyCenteredcancelappointmentcontent(
          this.cancelappointmentcontent
        );
        break;
      case "6":
        this.router.navigate(["/individual-doctor/appointment/appointmentdetails/" + id], {
          state: {
            mode: "REMAINDER_CALENDER",
          },
        });
        break;
    }
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

  disableContextMenu() {
    this.contextmenu = false;
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
      // currentStaffid: this.isClientLogin ? event.appointmentStaffs[0].staffId : 0
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

  openVerticallyCenteredcancelappointmentcontent(
    cancelappointmentcontent: any
  ) {
    this.modalService.open(cancelappointmentcontent, {
      centered: true,
      size: "md",
    });
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
     
    });
  }

  eventClicked(event: CalendarEvent): void { }

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

      this.contextMenuService.show.next({
        anchorElement: $event.target,
        // Optional - if unspecified, all context menu components will open
        contextMenu: this.contextMenu,
        event: <any>$event,
        item: 5,
      });

      // checking for cancelled in content menu

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

  monthEvntsToolTip(appointmentTitle) {
    return '<div class="month-title-tip-view"> ' + appointmentTitle + " </div>";
  }

  getBgClass(index: number): string {
    return index % 2 == 0 ? "evenCellColor" : "oddCellColor";
  }

  monthViewActionCliked(action, event: CalendarEvent) {
    const actionEl = this.patientService.parseStringToHTML(
      action.label
    ) as HTMLElement;
    const actionName = actionEl.getAttribute("value") as string;
    this.handleEvent(actionName, event.meta);
  }

  //////////////////////////////////////////////////

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date;
    }
  }


  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    
  }

  deleteEvent(eventToDelete: CalendarEvent) {
    // this.events = this.events.filter((event) => event !== eventToDelete);
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  async closeOpenMonthViewDay(newDate: Date) {
    this.activeDayIsOpen = false;

    await this.calculateMonthRange(new Date((newDate.getMonth() + 1) + "-01-" + newDate.getFullYear()));
    this.getAppointmentlist();
  }

  openVerticallyCentereddetale(addsecondsubsriber: any) {
    this.modalService.open(addsecondsubsriber, { centered: true, size: "md" });
  }

  cancelAppointment() {
    let reqData = {
      appointment_id: this.currentAppointmentId,
      cancelReason: this.resonText,
      status: 'REJECTED',
      cancelledOrAcceptedBy: this.userId,
    };


    this.doctorService.cancelSingleAppoinmentApi(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.modalService.dismissAll("close");
          this.toastr.success(response.message);
          // this.router.navigate(["/individual-doctor/appointment"]);
          this.getAppointmentlist()
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
  }


  doctorDetails(doctorId: any) {

    let param = { doctor_portal_id: doctorId };


    this.doctorService.doctorDetails(param).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        this.hospital_location = JSON.parse(
          JSON.stringify(result?.body?.data?.hospital_location)
        );

      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  allPatient() {
    this.doctorService.AllPatient().subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        if (result?.status) {
          this.patientList = result?.body;

        }

      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  filteredLocations: any[] = []; // This will hold the filtered data

  onLocationSelectionChange(event: any) {
    this.doctorLocationFilter = event

    this.getAppointmentlist();
  }

  onPatientSelectionChange(event: any) {
    this.patientLocationFilter = event

    this.getAppointmentlist();
  }
  handleSelectDateFilter(event: any) {
    let date = this.datePipe.transform(event.value, "YYYY-MM-dd");
    this.dateFilter = date;
    this.getAppointmentlist();
  }
  
  clearDateFilter() {
    this.dateFilter = "";
    this.getAppointmentlist();
  }

}
