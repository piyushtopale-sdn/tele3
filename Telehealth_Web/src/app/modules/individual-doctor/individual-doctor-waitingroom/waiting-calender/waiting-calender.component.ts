import { Component, ViewEncapsulation,} from "@angular/core";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import { IndiviualDoctorService } from "src/app/modules/individual-doctor/indiviual-doctor.service";
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription, interval, map, Observable, Subject } from "rxjs";
import AgoraRTC from "agora-rtc-sdk-ng";
import { ContextMenuComponent} from "@perfectmemory/ngx-contextmenu";
import { WebSocketService } from "src/app/shared/web-socket.service";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";


@Component({
  selector: 'app-waiting-calender',
  templateUrl: './waiting-calender.component.html',
  styleUrls: ['./waiting-calender.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: true },
    },
  ],
})
export class WaitingCalenderComponent {


  loggedInUserName: any;
  patientDetails: any;
  appointmentDetails: any;
  patientSubscriberphoto: any;
  patientConfirmation: any;



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
  contextMenu: ContextMenuComponent;

  viewDate: Date = new Date();

  refresh: Subject<any> = new Subject();
  appointmentId: any = "";
  doctor_portal_id: any;
  isSubmitted: boolean = false;
  setDocToView: any = "";
  appointmentDate: any;
  appointmentTime: any;

  private subscription: Subscription;

  public dateNow = new Date();
  public dDay = new Date();
  milliSecondsInASecond = 1000;
  hoursInADay = 24;
  minutesInAnHour = 60;
  SecondsInAMinute = 60;

  public timeDifference: any;
  public secondsToDday: any;
  public minutesToDday: any;
  public hoursToDday: any;
  public daysToDday: any;

  disableCallButton: boolean = false;
  isCallInProgress = false;
  callButtonEnable:any = 0;
  showCallButtonNow: Boolean = true;

  constructor(
    private _coreService: CoreService,
    private toastr: ToastrService,
    private activatedRoute: ActivatedRoute,
    private _individualDoctor: IndiviualDoctorService,
    private websocket: WebSocketService,
    private superAdminServcie : SuperAdminService
  ) {
  }
  ngOnInit(): void {
    this.getGenralSetting_List();
    this.activatedRoute.queryParamMap.subscribe(queryParams => {

      this.appointmentId = queryParams.get("appointmentId");
    });

    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.doctor_portal_id = loginData?._id;
    this.loggedInUserName = loginData?.full_name;

    this.getAppointmentDetails();
    this.refresh.next(1);
    
  }

  async getAppointmentDetails() {

    this._individualDoctor.viewAppointmentDetails(this.appointmentId).subscribe(async (res) => {
      let response = await this._coreService.decryptObjectData({ data: res });
      this.appointmentDetails = response?.data?.appointmentDetails;
      this.appointmentDate = response?.data?.appointmentDetails?.consultationDate;
      this.appointmentTime = response?.data?.appointmentDetails?.consultationTime;
      this.patientDetails = response?.data?.patientDetails;
      this.patientSubscriberphoto = response?.data?.insuraceSubscriberphoto;
      this.patientConfirmation = response?.data?.appointmentDetails?.patientConfirmation
      
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
      }
      this.checkConsultationWindow();

    });


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
    // this.disableCallButton = true;
    this.subscription.unsubscribe();
    this.daysToDday = 0;
    this.hoursToDday = 0;
    this.minutesToDday = 0;
    this.secondsToDday = 0;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }


  callUser(type: string) {
    if (this.isCallInProgress) return; // Prevent multiple clicks
 
    this.isCallInProgress = true; // Disable the button
      setTimeout(() => {
        this.isCallInProgress = false; // Re-enable after a delay
    }, 10000);

    let mediaPermission;
    mediaPermission = { audio: true }; // By default, audio is required
    let videoAvailable = false; // Flag to track video device availability
    
    if (type == "video") {
      mediaPermission = { ...mediaPermission, video: true };
    }
  
    AgoraRTC.getDevices()
      .then(async (devices) => {
        let audioDevices, videoDevices;
  
        // Filter for audio devices
        audioDevices = devices.filter((device) => device.kind === "audioinput");
  
        // Check if there's at least one audio device
        if (audioDevices.length === 0) {
          this.toastr.error("No audio device detected. Please check your microphone.");
          throw new Error("No audio device found");
        }
  
        let selectedMicrophoneId = audioDevices[0].deviceId;
  
        // Filter for video devices (only if it's a video call)
        if (type == "video") {
          videoDevices = devices.filter((device) => device.kind === "videoinput");
          videoAvailable = videoDevices.length > 0; // Flag to check if video devices are available
  
          // If no video devices, allow joining the call without video
          if (!videoAvailable) {
            console.warn("No video device found, joining video call without video.");
          } else {
            let selectedCameraId = videoDevices[0].deviceId;
          }
        }
  
        // Now, proceed with the call if there's at least one audio device
        let roomid = this.appointmentId;
  
        const data = {
          loggedInUserId: this.doctor_portal_id ? this.doctor_portal_id : "",
          loggedInUserName: this.loggedInUserName,
          chatId: roomid,
          type: type,
          token: "Bearer " + localStorage.getItem("token"),
        };
  
        this.websocket.isCallStarted(true);
        this.websocket.callUser(data);
      })
      .catch((e) => {
        // If there's no audio device, show an error
        if (e.message !== "No audio device found") {
          this.toastr.error("Please check your camera and mic");
        }
      });
  }

  checkConsultationWindow() {
    if(this.showCallButtonNow === false){
      this.disableCallButton = true;
    }else{
      const [startTimeStr, endTimeStr] = this.appointmentTime.split("-");
      const startDateTime = new Date(`${this.appointmentDate}T${startTimeStr}`); // Start time
      const endDateTime = new Date(`${this.appointmentDate}T${endTimeStr}`); // End time
    
      const currentTime = new Date();
    
      const visibilityStartTime = new Date(startDateTime.getTime() - this.callButtonEnable * 60 * 1000); //before start
      const visibilityEndTime = new Date(startDateTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours after start
    
      if (currentTime >= visibilityStartTime && currentTime <= visibilityEndTime) {
        this.disableCallButton = true; // Enable the button
      } else if (currentTime < visibilityStartTime) {
        const timeToEnable = visibilityStartTime.getTime() - currentTime.getTime();
        setTimeout(() => {
          this.disableCallButton = true; // Enable the button before start
        }, timeToEnable);
      } else {
        this.disableCallButton = false; // Disable the button after 24 hours
      }
    }
  }

  calculateAge(dob: string): number {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  getGenralSetting_List() {
    let reqData ={
      role:"doctor"
    }
    this.superAdminServcie.getGeneralSetting(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);      
      if(response.status){  
        response?.body.map((ele)=>{
          if(ele?.settingName === 'callButtonEnable'){
            this.callButtonEnable = ele?.settingValue;       
          }else{
            this.showCallButtonNow = ele?.enableCallButton;            
          }
        })
      }
    });
  }
 
  get callButtonTooltip(): string {
    return Number(this.callButtonEnable) === 0
      ? 'Button will be enabled at the consultation start time.'
      : `Button will be enabled ${this.callButtonEnable} minutes before the consultation start time.`;
  }
}
