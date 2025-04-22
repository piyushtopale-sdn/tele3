
import { Component, Input, OnInit, TemplateRef, ViewEncapsulation, ChangeDetectionStrategy, ViewChild } from '@angular/core';

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
} from 'date-fns';

import { map, Observable, Subject } from 'rxjs';

import {
  CalendarDayViewBeforeRenderEvent,
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarMonthViewDay,
  CalendarView,
  CalendarWeekViewBeforeRenderEvent,
} from 'angular-calendar';

import { EventColor } from 'calendar-utils';
import { ContextMenuComponent, ContextMenuService } from '@perfectmemory/ngx-contextmenu';
import { DatePipe } from '@angular/common';
import { PatientService } from '../../patient.service';
import { CoreService } from 'src/app/shared/core.service';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { FourPortalService } from 'src/app/modules/four-portal/four-portal.service';


const colors: Record<string, EventColor> = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3',
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF',
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA',
  },
};

interface OfficeTime {
  dayStartHour: string;
  dayStartMinute: string;
  dayEndHour: string;
  dayEndMinute: string;
}
@Component({
  selector: 'app-calender',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calender.component.html',
  styleUrls: [
    './calender.component.scss',
    './angular-calendar.css',
  ],
  encapsulation: ViewEncapsulation.None
})


export class CalenderComponent implements OnInit {
  isOpen = false;
  contextMenu: ContextMenuComponent;
  contextMenuPosition = { x: '0', y: '0' };
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




  @Input() openDayEventsTemplate: TemplateRef<any>;






  events: Observable<Array<CalendarEvent>>;

  activeDayIsOpen: boolean = false;
  // handleEvent: any;
  // isOpen:false
  trigger: any
  userID: any;
  contextmenu = false;
  contextmenuX = 0;
  contextmenuY = 0;
  resonText: any;
  @ViewChild('cancelappointmentcontent', { static: false }) cancelappointmentcontent: any;

  consulation_filter: any = '';
  appointment_filter: any = 'ALL';
  startDate: any = ""
  endDate: any = ""
  currentDate: Date = new Date();
  currentMonthStartDate: string = "";
  currentMonthEndDate: string = "";
  portal_type: any;
  constructor(
    private contextMenuService: ContextMenuService,
    private date: DatePipe,
    private patientService: PatientService,
    private _coreService: CoreService,
    private router: Router,
    private fourPortalService : FourPortalService,
    private modalService: NgbModal) {
    const userData = this._coreService.getLocalStorage("loginData");
    this.userID = userData._id;
    this.calculateMonthRange(this.currentDate);

  }
  calculateMonthRange(currentDate) {
    this.currentMonthStartDate = moment(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)).format("YYYY-MM-DD");
    const nextMonth = currentDate.getMonth() + 1;
    const nextYear = currentDate.getFullYear() + (nextMonth === 12 ? 1 : 0);
    this.currentMonthEndDate = moment(new Date(nextYear, nextMonth % 12, 0)).format("YYYY-MM-DD");
  }
  ngOnInit(): void {
    this.appointmentList().subscribe();
    this.refresh.next(1);
  }

  ngAfterViewInit() {
    // this.appointmentList();
  }


  addEvent(event: any, type: any): void {

    let id = this.currentAppointmentId;
    // var appStaff = this.isClientLogin ? this.currentStaff : parseInt(this.currentLoginUserId);

    switch (type) {
      // case '1':

      //     this.openDialogBookAppointment(parseInt(this.currentLoginUserId), this.currentLoginUserId, true)
      //     break;

      case '2':
        if (this.portal_type === undefined) {
          this.router.navigate([`/patient/myappointment/newappointment`], {
            queryParams: {
              appointmentId: id
            }
          })
        }else{
          this.router.navigate([`/patient/myappointment/newappointment`],{
            queryParams :{
              appointmentId :id,
              portal_type:this.portal_type
            }
          })
        }

        break;
      case '3':
        if (this.portal_type === undefined) {
          this.router.navigate([`/patient/myappointment/newappointment`], {
            queryParams: {
              appointmentId: id
            },
            state: {
              mode: 'CALENDER'
            }
          })
        }else{
          this.router.navigate([`/patient/myappointment/newappointment`],{
            queryParams :{
              appointmentId :id,
              portal_type:this.portal_type
            },
            state: {
              mode: 'CALENDER'
            }
          })
        }
       

        // })
        // this.router.navigate(['/insurance/entercode'], {
        //   state: {
        //     mobile: this.signUpForm.value.mobile,
        //     country_code: this.selectedCountryCode,
        //     mode: medium,
        //     email: this.signUpForm.value.email,
        //     userId: this.userId,
        //     component:'signup',
        //     companyName:this.signUpForm.value.insuranceName,
        //   }
        // });
        // this.openDialogRecheduleAppointment(appStaff, appStaff.toString(), false)
        break;
      case '4':

        this.openVerticallyCenteredcancelappointmentcontent(this.cancelappointmentcontent);

        break;
      //   case '5':
      //     const modalPopup = this.appointmentDailog.open(SetReminderComponent, {
      //       hasBackdrop: true,
      //       data: { appointmentId: id },
      //     });

      //     modalPopup.afterClosed().subscribe((result) => {
      //       if (result === "save") this.fetchEvents();
      //     });
      //     break;

      case '6':
        if (this.portal_type === undefined) {
          this.router.navigate([`/patient/myappointment/newappointment`], {
            queryParams: {
              appointmentId: id
            },
            state: {
              mode: 'REMAINDER_CALENDER'
            }
          })
        }else{
          this.router.navigate([`/patient/myappointment/newappointment`],{
            queryParams :{
              appointmentId :id,
              portal_type:this.portal_type
            },
            state: {
              mode: 'REMAINDER_CALENDER'
            }
          })
        }
      
        break;
      //   case '7':

      //     this.addNewCallerService
      //       .getOTSessionByAppointmentId(id)
      //       .subscribe((response) => {
      //         if (response.statusCode == 200) {
      //           this.createAddPersonModel(
      //             id,
      //             response.data.id
      //           );
      //         }
      //       });
      //     break;


    }

  }



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

  appointmentList(): Observable<any> {

    let data = {
      patient_portal_id: this.userID,
      status: this.appointment_filter,
      consultation_type: this.consulation_filter,
      date: this.currentMonthStartDate,
      to_date: this.currentMonthEndDate,
      page: 1,
      limit: 0
    }
    return (this.events = this.patientService.patientAppointmentList(data).pipe(
      map(
        (res: any) => {

          let data = this._coreService.decryptObjectData({ data: res })
          let responsData = data.data.data;
          return (responsData || []).map((res: any, index: number) => {
            let iscancel = '';
            let action = [];
            if (res.status == "New" || res.status == "Upcoming" || res.status == "Today") {
              action = this.sendAllAction([{
                icon:
                  '<span class="material-icons material-icons-delete" title="Delete" style="color:#d00;">cancel</span>', // '<i class="fa fa-fw fa-trash" title="Delete"></i>',
                name: "Deleted",
              }])
            }

            let req = {
              consultation_date: res.consultation_date,
              consultation_time: res.consultation_time,
              consultation_type: res.consultation_type,
              in_fee_management: res.in_fee_management,
            }


            this.checkForCancelation(req).subscribe(respo => {
              iscancel = respo;
            })


            let consulatation_date = moment(res?.consultation_date).format('YYYY-MM-DD');

            let consulatation_start_time = res?.consultation_time?.split('-')[0];
            let consulatation_end_time = res?.consultation_time?.split('-')[1];

            let start_date_time = consulatation_date + 'T' + consulatation_start_time + ':00';
            let end_date_time = consulatation_date + 'T' + consulatation_end_time + ':00';

            let appointmentObj = {
              statusName: res.status,
              startDateTime: start_date_time,
              endDateTime: end_date_time,
              patientName: res.patient_name,
              doctorName: res.doctor_name,
              appointmentId: res.appointment_id,
              cancelTime: iscancel,
              portal_type: res.portal_type
            }

            let title = `${res.consultation_time} ${res.patient_name}`;

            const eventObj: CalendarEvent = {
              title: title, //timeRange + appointmentObj.patientName,
              start: new Date(start_date_time),
              end: new Date(end_date_time),
              color: {
                primary: 'brown',
                secondary: 'red', // (bgColor && bgColor.color) || "#93ee93" //appointmentObj.color
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
            }

            return eventObj;
          })


          // this.refresh.next();

        }





      )
    )
    )
  }

  sendAllAction(actions: any) {

    return actions.map((obj) => {

      const icn = obj.icon as string;
      const [s1, ...s2Array] = icn.split(' ');
      const iconStr = [s1, 'value="' + obj.name + '"', s2Array].join(' ');
      obj.icon = iconStr.split(',').join(' ');


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

  // eventTimesChanged({
  //   event,
  //   newStart,
  //   newEnd,
  // }: CalendarEventTimesChangedEvent): void {
  //   this.events = this.events.map((iEvent) => {
  //     if (iEvent === event) {
  //       return {
  //         ...event,
  //         start: newStart,
  //         end: newEnd,
  //       };
  //     }
  //     return iEvent;
  //   });
  //   this.handleEvent('Dropped or resized', event);
  // }

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    // if (this.isRequestFromPatientPortal) {
    //   return null;
    // }

    // const appointmentObj: AppointmentModel = {
    //   ...event.meta,
    //   startDateTime: newStart,
    //   endDateTime: newEnd,
    // };
    // let msg = "You can not edit timing once payment done.";
    // this.translate.get(msg).subscribe((data) => msg = data);
    // this.notifierService.notify("error", msg);
    // this.dialogService
    //   .confirm("Are you sure you want to move appointment?")
    //   .subscribe((result: any) => {
    //     if (result == true) {
    //       //this.handleMoveAppointmentClick(appointmentObj);
    //     }
    //   });
  }

  isDayOpened(day: number): boolean {
    return this.showAllEventDaysArray.includes(day) ? true : false;
  }

  monthEvntsToolTip(appointmentTitle) {
    return '<div class="month-title-tip-view"> ' + appointmentTitle + ' </div>';
  }

  // handleEvent(msg: any, event: CalendarEvent) {
  // }

  deleteEvent(eventToDelete: CalendarEvent) {
    // this.events = this.events.filter((event) => event !== eventToDelete);
  }

  getBgClass(index: number): string {
    return index % 2 == 0 ? 'evenCellColor' : 'oddCellColor';
  }

  monthViewActionCliked(action, event: CalendarEvent) {
    const actionEl = this.patientService.parseStringToHTML(action.label) as HTMLElement;
    const actionName = actionEl.getAttribute("value") as string;
    this.handleEvent(actionName, event.meta)
  }


  setView(view: CalendarView) {
    this.view = view;
  }

  async closeOpenMonthViewDay(newDate: Date) {
    this.activeDayIsOpen = false;

    await this.calculateMonthRange(new Date((newDate.getMonth() + 1) + "-01-" + newDate.getFullYear()));
    this.appointmentList().subscribe();
    this.refresh.next(1);
  }



  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  public onContextMenu($event: any, selectedEvent: CalendarEvent = null, rescheduleDate: null | Date = null): void {

    // if (rescheduleDate && this.isWaitingRoomScreen) {
    //   this.isRescheduleShow = this.isBoolingDateAvailable(rescheduleDate);
    // }

    // // To enable or disable the new appointment option from menu.
    // if (!isNullOrUndefined(rescheduleDate)) {
    //   if (this.IsPreviousDate(rescheduleDate))
    //     this.hideNewappointment = true;
    //   else
    //     this.hideNewappointment = false;
    // } else if (this.isDayView || this.isWeekView) {
    //   if (this.IsPreviousDate(this.apptObj.startDateTime))
    //     this.hideNewappointment = true;
    //   else
    //     this.hideNewappointment = false;
    // } else {
    //   this.hideNewappointment = false;
    // }

    this.appointId = ($event.target.className.toLowerCase().indexOf("cal-event") == 0 ||
      $event.target.className.toLowerCase().indexOf("appt-blk") == 0
      || $event.target.className.toLowerCase().indexOf("month-event-txt-s") == 0) ? 1 : 0;
    if ($event.target.className.indexOf("material-icons") != 0 && $event.target.className.indexOf("cal-event-title") != 0) {

      this.contextMenuService.show.next({
        anchorElement: $event.target,
        // Optional - if unspecified, all context menu components will open
        contextMenu: this.contextMenu,
        event: <any>$event,
        item: 5

      });

      // checking for cancelled in content menu  

      if (selectedEvent && selectedEvent.meta) {
        if ((selectedEvent.meta.statusName == 'New'
          || selectedEvent.meta.statusName == 'Upcoming'
          || selectedEvent.meta.statusName == 'Today')) {
          if (selectedEvent.meta.cancelTime) {
            this.cancelledId = 1;
          } else {
            this.cancelledId = 0;
          }

        } else {
          this.cancelledId = 0;
        }
        // checking rescheduling in content menu
        if (selectedEvent.meta.statusName == 'Upcoming' || selectedEvent.meta.statusName == 'Today') {
          this.rescheduledId = 1;
          this.setRemainderId = 1;
        } else {
          this.rescheduledId = 0;
          this.setRemainderId = 0;
        }




        // localStorage.setItem('apptId', selectedEvent.meta.patientAppointmentId);
        this.currentAppointmentId = selectedEvent.meta.appointmentId;
        this.portal_type = selectedEvent.meta.portal_type
        // this.currentStaff = selectedEvent.meta.appointmentStaffs != null ? selectedEvent.meta.appointmentStaffs[0].staffId : 0
        // this.currentNotes = selectedEvent.meta.notes;
        // if (selectedEvent.meta.statusName.toLowerCase() == 'pending') {
        //   this.isPending = true;
        // }
        // else {
        //   this.isPending = false;
        // }
      }

      //   if (selectedEvent && selectedEvent.end) {

      //     var curDate = this.date.transform(new Date(), 'yyyy-MM-dd HH:mm:ss a');
      //     var selDate = this.date.transform(selectedEvent.start, 'yyyy-MM-dd HH:mm:ss a');
      //     if (selDate < curDate) {
      //       this.isvalidDate = false;
      //     }
      //     else {
      //       this.isvalidDate = true;
      //     }
      //   }


      $event.preventDefault();
      $event.stopPropagation();
    }

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
  beforeWeekViewRender(e: CalendarWeekViewBeforeRenderEvent) {
    // this.isDayView = false;
    // this.isWeekView = true;
    // this.isMonthView = false;
    // e.hourColumns.forEach((obj) => {
    //   obj.hours.forEach((h) => {
    //     h.segments.forEach((s) => {
    //       const slotInfo = {
    //         start: s.date,
    //         end: addMinutes(s.date, 59),
    //       };
    //       // const isAvailableForWRResche = this.isBoolingDateAvailable(slotInfo.start);

    //       let cssClass = "";
    //       if (this.checkAvailability(slotInfo) && !this.isPatientScheduler) {
    //         cssClass = "available-bg-color";
    //       }
    //       // if(isAvailableForWRResche){
    //       //   cssClass = cssClass + " is-available-cell-week-re";
    //       // }
    //       s.cssClass = cssClass;
    //     });
    //   });
    // });
  }
  beforeDayViewRender(e: CalendarDayViewBeforeRenderEvent) {
    // this.isDayView = true;
    // this.isWeekView = false;
    // this.isMonthView = false;
    // e.body.hourGrid.forEach((h) => {
    //   h.segments.forEach((s) => {
    //     const slotInfo = {
    //       start: s.date,
    //       end: addMinutes(s.date, 59),
    //     };
    //     let cssClass = "";
    //     if (this.checkAvailability(slotInfo) && !this.isPatientScheduler) {
    //       cssClass = "available-bg-color";
    //     }
    //     s.cssClass = cssClass;
    //   });
    // });
  }

  eventClicked(event: CalendarEvent): void {

  }

  closeShowAllEvents(day: number) {
    const index: number = this.showAllEventDaysArray.indexOf(day);
    if (index !== -1) {
      this.showAllEventDaysArray.splice(index, 1);
    }

  }

  handleEvent(type: string, event: any) {

    this.currentAppointmentId = event.appointmentId;
    this.portal_type = event.portal_type
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
    // localStorage.removeItem('apptId');

    // localStorage.setItem('apptId',appointmentObj.appointmentId.toString());
    // this.currentAppointmentId = appointmentObj.appointmentId;
    // this.currentPatientId = appointmentObj.patientId
    // this.isClientLogin
    // {
    //   this.currentStaff = appointmentObj.currentStaffid
    // }
    switch (type.toUpperCase()) {
      //   case "EDITED":
      //     this.schedulerService
      //       .getAppointmentDetails(appointmentObj.appointmentId)
      //       .subscribe((response: any) => {
      //         if (response.statusCode === 200) {
      //           const appointmentObj: AppointmentModel = response.data;
      //           this.createModel(appointmentObj, true);
      //         } else {
      //           this.createModel(null, true);
      //         }
      //       });
      //     break;
      case "DELETED":

        this.openVerticallyCenteredcancelappointmentcontent(this.cancelappointmentcontent);
        // this.handleDeleteAppoitnment();
        break;
      // case "APPT":
      //   break;


      //   case "CANCEL":
      //     this.createCancelAppointmentModel(appointmentObj.appointmentId);
      //     break;
      //   case "ADDNEWPERSON":
      //     this.addNewCallerService
      //       .getOTSessionByAppointmentId(appointmentObj.appointmentId)
      //       .subscribe((response) => {
      //         if (response.statusCode == 200) {
      //           this.createAddPersonModel(
      //             appointmentObj.appointmentId,
      //             response.data.id
      //           );
      //         }
      //       });
      //     break;
      //   case "UNDOCANCEL":
      //     this.schedulerService
      //       .unCancelAppointment(appointmentObj.appointmentId)
      //       .subscribe((response: any) => {
      //         if (response.statusCode === 200) {
      //           let msg = response.message;
      //           this.translate.get(msg).subscribe((data) => msg = data);
      //           this.notifierService.notify("success", msg);
      //           this.fetchEvents();
      //         } else {
      //           let msg = response.message;
      //           this.translate.get(msg).subscribe((data) => msg = data);
      //           this.notifierService.notify("error", msg);
      //         }
      //       });
      //     break;
      //   case "CREATESOAPNOTE":
      //   case "VIEWSOAPNOTE":
      //     // if (appointmentObj.isBillable)
      //     // this.router.navigate(["/web/encounter/soap"], {
      //     //   queryParams: {
      //     //     apptId: appointmentObj.appointmentId,
      //     //     encId: appointmentObj.patientEncounterId,
      //     //   },
      //     // });
      //     this.router.navigate(["/web/waiting-room/" + appointmentObj.appointmentId]);
      //     // else
      //     //   this.router.navigate(["/web/encounter/non-billable-soap"], {
      //     // queryParams: {
      //     //   apptId: appointmentObj.appointmentId,
      //     //   encId: appointmentObj.patientEncounterId
      //     // }
      //     // });
      //     break;
      //   case "APPROVE":
      //     const appointmentData = {
      //       id: appointmentObj.appointmentId,
      //       status: "APPROVED",
      //     };
      //     this.schedulerService
      //       .updateAppointmentStatus(appointmentData)
      //       .subscribe((response: any) => {
      //         if (response.statusCode === 200) {
      //           let msg = response.message;
      //           this.translate.get(msg).subscribe((data) => msg = data);
      //           this.notifierService.notify("success", msg);
      //           this.fetchEvents();
      //         } else {
      //           let msg = response.message;
      //           this.translate.get(msg).subscribe((data) => msg = data);
      //           this.notifierService.notify("error", msg);
      //         }
      //       });
      //     break;
      //   case "VIDEOCALL":
      //     this.router.navigate(["/web/waiting-room/" + appointmentObj.appointmentId]);
      //   // this.router.navigate(["/web/encounter/video-call"], {
      //   //   queryParams: {
      //   //     apptId: appointmentObj.appointmentId,
      //   //   },
      //   // });
      //   case "ONLYVIDEOCALL":
      //     this.encounterService
      //       .getTelehealthSessionForInvitedAppointmentId(
      //         appointmentObj.appointmentId
      //       )
      //       .subscribe((response) => {
      //         if (response.statusCode == 200) {
      //           var otSession = this.commonService.encryptValue(
      //             JSON.stringify(response.data)
      //           );
      //           localStorage.setItem("otSession", otSession);
      //           this.commonService.videoSession(true);
      //         }
      //       });
      //   case "CHAT":

      //     this.commonService.loginUser.subscribe((response: any) => {
      //       if (response.access_token) {
      //         var chatInitModel = new ChatInitModel();
      //         chatInitModel.isActive = true;
      //         chatInitModel.AppointmentId = appointmentObj.appointmentId;
      //         chatInitModel.UserId = response.data.userID;
      //         if (this.isClientLogin) {
      //           chatInitModel.UserRole = response.data.users3.userRoles.userType;
      //         } else {
      //           chatInitModel.UserRole = response.data.userRoles.userType;
      //         }
      //         //chatInitModel.UserRole = response.data.userRoles.userType;
      //         this.appService.CheckChatActivated(chatInitModel);
      //         // this.getAppointmentInfo(
      //         //   chatInitModel.AppointmentId,
      //         //   chatInitModel.UserRole
      //         // );
      //         this.textChatService.setAppointmentDetail(
      //           chatInitModel.AppointmentId,
      //           chatInitModel.UserRole
      //         );
      //         this.textChatService.setRoomDetail(
      //           chatInitModel.UserId,
      //           chatInitModel.AppointmentId
      //         );
      //       }
      //     });
      //     break;
      default:
        break;
    }
  }

  handleDeleteAppoitnment() {

  }

  openVerticallyCenteredcancelappointmentcontent(
    cancelappointmentcontent: any
  ) {
    this.modalService.open(cancelappointmentcontent, {
      centered: true,
      size: "md",
    });
  }

  openVerticallyCentereddetale(addsecondsubsriber: any) {
    // this.appointmentId = appointmentId;
    this.modalService.open(addsecondsubsriber, { centered: true, size: "md" });
  }

  cancelAppointment() {

    if(this.portal_type === undefined){
      let dataToPass = {
        appointment_id: this.currentAppointmentId,
        cancelReason: this.resonText,
        status: "REJECTED",
        cancelledOrAcceptedBy: this.userID,
        type: "patient"
      }
  
      this.patientService.cancelAppointment(dataToPass).subscribe((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res })
        this.modalService.dismissAll()
        this._coreService.showSuccess(data.message, '');
        this.refresh.next(1);
      })
    }else{
      let reqData = {
        appointment_id: this.currentAppointmentId,
        cancelReason: this.resonText,        
        cancelledOrAcceptedBy: this.userID,
        status: "REJECTED",
        cancel_by: "patient"
      };
      this.fourPortalService.fourPortal_cancel_approved_appointment(reqData).subscribe((res: any) => {
        let data = this._coreService.decryptObjectData({ data: res })
        this.modalService.dismissAll()
        this._coreService.showSuccess(data.message, '');
        this.refresh.next(1);
      })
    }

  
  }


  hourSegmentClicked(event: any): void {

    // if (!this.schedulerPermissions.SCHEDULING_LIST_ADD) {
    //   return null;
    // }

    // const slotInfo = {
    //   start: event.date,
    //   end: addMinutes(event.date, 59),
    // };

    // this.notifierService.hideAll();
    // this.apptObj = new AppointmentModel();
    // this.apptObj.startDateTime = slotInfo.start;
    // this.apptObj.endDateTime = addMinutes(slotInfo.start, 60);

  }

  createModel(appointmentModal: any, type: any) {

    // const selectedOfficeClients = !this.isPatientScheduler                //todayss
    //   ? this.officeClients.filter(obj =>
    //     this.selectedOfficeClients.includes(obj.id)
    //   )
    //   : [{ id: this.patientSchedulerId, value: "" }];
    // const selectedOfficeLocations = !this.isPatientScheduler
    //   ? this.officeLocations.filter(obj =>
    //     this.selectedOfficeLocations.includes(obj.id)
    //   )
    //   : [{ id: this.currentLocationId, value: "" }];
    // const modalPopup = this.appointmentDailog.open(SchedulerDialogComponent, {
    //   hasBackdrop: true,
    //   data: {
    //     appointmentData: appointmentModal || new AppointmentModel(),
    //     selectedOfficeLocations: selectedOfficeLocations,
    //     selectedOfficeStaffs: this.officeStaffs.filter(obj =>
    //       this.selectedOfficeStaffs.includes(obj.id)
    //     ),
    //     selectedOfficeClients,
    //     isPatientScheduler: this.isPatientScheduler,
    //     isRequestFromPatientPortal: this.isRequestFromPatientPortal,
    //     isNew: type
    //   }
    // });
    // modalPopup.afterClosed().subscribe(result => {
    //   if (result === "SAVE") this.fetchEvents();
    // });
  }

  createCancelAppointmentModel(appointmentId: number) {
    // const modalPopup = this.appointmentDailog.open(
    //   CancelAppointmentDialogComponent,
    //   {
    //     hasBackdrop: true,
    //     data: appointmentId,
    //   }
    // );

    // modalPopup.afterClosed().subscribe((result) => {
    //   if (result === "SAVE") this.fetchEvents();
    // });
  }
  createAddPersonModel(appointmentId: number, sessionId: number) {

    // const modalPopup = this.appointmentDailog.open(AddNewCallerComponent, {
    //   hasBackdrop: true,
    //   data: { appointmentId: appointmentId, sessionId: sessionId },
    // });

    // modalPopup.afterClosed().subscribe((result) => {
    //   if (result === "save") this.fetchEvents();
    // });
  }

  isBoolingDateAvailable(reqDate: Date): boolean {

    if (this.bookingAvailableDates && this.bookingAvailableDates.length > 0) {
      const dateStr = format(reqDate, "YYYY-MM-DD");
      return this.bookingAvailableDates.some(x => x == dateStr) ? true : false;
    } else {
      return false;
    }

  }

  toDateString(date) {
    return this.date.transform(new Date(date), 'dd');
  }

  handleConsulationType(event: any) {
    this.consulation_filter = event;
    this.appointmentList().subscribe();
  }

  handleAppointmentType(event: any) {
    this.appointment_filter = event;
    this.appointmentList().subscribe();
  }

  // public onDateChange(data: MatDatepickerInputEvent<Date>): void {
  //   this.startDate = moment(data.value).format("DD-MM-YYYY")
  //   this.appointmentList().subscribe();
  // }

  public checkForCancelation(appointmentData: any): Observable<any> {

    return new Observable(observer => {

      let isAbleToCancel = false;
      let counsultationDate = appointmentData?.consultation_date;
      let consultationTimeHour =
        appointmentData?.consultation_time?.split(":")[0];
      let consultationTimeMinute = appointmentData?.consultation_time
        ?.split(":")[1]
        ?.split("-")[0];
      let counsultationDateAndTime = `${counsultationDate}T${consultationTimeHour}:${consultationTimeMinute}:00`;

      let cancelationDays;
      let cancelationHours;

      if (appointmentData?.consultation_type === "Online") {
        cancelationDays =
          appointmentData?.in_fee_management?.online?.cancelPolicy?.noofDays;
        cancelationHours =
          appointmentData?.in_fee_management?.online?.cancelPolicy?.noofHours;
      } else if (appointmentData?.consultation_type === "Home Visit") {
        cancelationDays =
          appointmentData?.in_fee_management?.home_visit?.cancelPolicy?.noofDays;
        cancelationHours =
          appointmentData?.in_fee_management?.home_visit?.cancelPolicy?.noofHours;
      } else {
        cancelationDays =
          appointmentData?.in_fee_management?.f2f?.cancelPolicy?.noofDays;
        cancelationHours =
          appointmentData?.in_fee_management?.f2f?.cancelPolicy?.noofHours;
      }

      let totalHoursPolicy = cancelationDays * 24 + cancelationHours;

      const currentTime = new Date();
      const targetDate = new Date(counsultationDateAndTime);
      const timeDiff = targetDate.getTime() - currentTime.getTime();

      const totalHoursForAppointment = Math.floor(timeDiff / (1000 * 60 * 60));

      if (totalHoursForAppointment > totalHoursPolicy) {
        isAbleToCancel = true;
      } else {
        isAbleToCancel = false;
      }
      observer.next(isAbleToCancel);
    })


  }

}
