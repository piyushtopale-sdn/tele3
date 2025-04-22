import { Component, ElementRef, OnInit, Renderer2, TemplateRef, ViewChild, Input, ViewEncapsulation, HostListener } from '@angular/core';
import { WebSocketService } from "src/app/shared/web-socket.service"
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { BehaviorSubject, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { IndiviualDoctorService } from '../../modules/individual-doctor/indiviual-doctor.service';
import { environment } from "src/environments/environment"
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { CoreService } from '../core.service';
import { PatientService } from '../../modules/patient/patient.service'
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
export interface IRtc {
  client: IAgoraRTCClient,
  localAudioTrack: IMicrophoneAudioTrack,
  localVideoTrack: ICameraVideoTrack
}
export interface IUser {
  uid: number;
  name?: string;
}
@Component({
  selector: 'app-video-calling',
  templateUrl: './video-calling.component.html',
  styleUrls: ['./video-calling.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class VideoCallingComponent implements OnInit {
  private callStartedSubscribe: Subscription = Subscription.EMPTY;
  private openCallerPopup: Subscription = Subscription.EMPTY;
  private notifyCall: Subscription = Subscription.EMPTY;
  private openCallingDialog: Subscription = Subscription.EMPTY;
  private callStatusSubscription: Subscription = Subscription.EMPTY;
  private callReceiveddSubscribe: Subscription = Subscription.EMPTY;
  private ringingStarted: Subscription = Subscription.EMPTY;
  private callPicked: Subscription = Subscription.EMPTY;
  private endCallSubscription: Subscription = Subscription.EMPTY;
  private participantLeft: Subscription = Subscription.EMPTY;
  private closeRingerDialogSubscribe: Subscription = Subscription.EMPTY;
  private muteSubscriptionHandle: Subscription = Subscription.EMPTY;
  private subscriptions: Subscription[] = [];
  private userSubscription: Subscription = Subscription.EMPTY;
  @Input() loggedInUserName: string;
  @Input() portaltype: string;
   @ViewChild('chatBody') private chatBody!: ElementRef;
   userScrolledUp: boolean = false;
   private previousScrollHeight: number = 0;
  baseUrl: any = environment.apiUrl;
  dialogDetails: any = {};
  isCallingStarted: boolean = false;
  isCallReceived: boolean = false;
  isCallPickedByAnyone: boolean = false;
  isRingingStarted: boolean = false;
  setTimeOutTime: any = 20000;
  //Timer
  hours: number;
  mins: number;
  seconds: number;
  isAudioMuted: boolean = false;
  isVideoMuted: boolean = false;
  remoteParticipants: number = 0;
  activeRoomParticipantsData: any = [];
  isCallRecieved: boolean = false;
  dialogRef: any;
  loggedInUserId: any;
  caller: boolean;
  isJoining: boolean;
  //Agora RTC
  rtc: IRtc = {
    client: null,
    localAudioTrack: null,
    localVideoTrack: null,
  };
  localTracks = {
    videoTrack: null,
    audioTrack: null
  };
  audio = new Audio();
  audioSetTime: any;
  connectingAudio = new Audio();
  connectingAudioSetTime: any;
  showMuteOptions: boolean = false;
  callStatus: string;
  remoteUsers: IUser[] = [];
  updateUserInfo = new BehaviorSubject<any>(null);
  ringingStartedAudio = new Audio();
  ringingStartedAudioSetTime: any;
  clearTimeOutVar: any;
  timeoutId: any;
  activerole = '';
  appointmentId: any = {};
  videocall: any = "videocall";
  assessmentsList: any
  message: any;
  allmessages: any = [];
  patientId: any = {}
  showchat: any = true;
  showvideo: any = true;
  userType: any;
  form: FormGroup;
  portalType: any = "";
  @Input() callby: any = '';
  @Input() roomName: any = '';
  @Input() details: any = '';
  submitting: boolean = false;
  showMessageCount = 0;
  openedWindow:Window = null
  uid: any;
  constructor(private webSocketService: WebSocketService, private ngxLoader: NgxUiLoaderService,
    private readonly renderer: Renderer2, private doctoreservice: IndiviualDoctorService
    , private toastr: ToastrService, private dialog: MatDialog, private modalService: NgbModal, private route: Router, private router: ActivatedRoute, private coreservice: CoreService, private patientservice: PatientService,

    private formBuilder: FormBuilder
  ) {

  }
  @ViewChild('callingDialog', { static: true }) callingDialog: TemplateRef<any>;
  @ViewChild('localVideo') localVideo: ElementRef;
  @ViewChild('remoteVideo') remoteVideo: ElementRef;
  @ViewChild('groupDialog', { static: true }) groupDialog: TemplateRef<any>;

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });

    if (this.callby == 'external') {
      this.loggedInUserId = this.details.loggedInUserId
    } else {
      let loginData = JSON.parse(localStorage.getItem("loginData"));
      this.loggedInUserId = loginData._id
      this.activerole = loginData.role;
      this.userType = loginData?.type

      localStorage.removeItem("opencall");
      localStorage.removeItem("type");
    }

    let data = JSON.parse(localStorage.getItem("loginData"));
    if (data?.type != undefined) {
      this.portalType = data?.type
    }


    if (localStorage.getItem("opencall") != null) {
      console.log("opencall ----------146");
      
      this.endCall('');
    }

    if (this.callby != '') {
      this.dialogDetails = this.details;
      this.isCallReceived = true;
      this.isCallPickedByAnyone = true;
      this.startCall();
    }

    this.webSocketService.connect();

    AgoraRTC.setLogLevel(4);
    this.callStartedSubscribe = this.webSocketService.callStartedSubscribe().subscribe((res: any) => {
      this.isCallingStarted = res;
    });

    if (this.userType !== undefined) {
      let req = {
        room: this.loggedInUserId,
        portal_type: this.userType
      }
      this.webSocketService.joinRoom(req)
    } else {
      this.webSocketService.joinRoom({ room: this.loggedInUserId })
    }

    this.openCallerPopup = this.webSocketService.openCallerPopup().subscribe((res: any) => {
      if (res.messageID == 200) {
        this.webSocketService.addDialogDetails(res.data.userData);
        this.webSocketService.changeCallingStatus('Calling');
      }
    });

    this.notifyCall = this.webSocketService.notifyCall().subscribe((res: any) => {
      if (res.messageID == 200) {
        if (!this.isCallReceived) {
          this.dialogDetails = res.data.userData;

          this.dialogRef = this.dialog.open(this.callingDialog, {
            panelClass: 'videocallingclass',
            disableClose: true,
          });
          this.playAudio();
          this.clearTimeOutVar = setTimeout(() => { this.dialogRef.close(); this.clearAllSetTimeOut(); this.initializeLocalVariables(); }, this.setTimeOutTime);
          this.appointmentId = this.dialogDetails.chatId
          const ringStartedData = {
            chatId: this.dialogDetails.chatId,
            senderId: this.loggedInUserId,
            roomName: this.dialogDetails.roomName,
            authtoken: "Bearer " + localStorage.getItem("token"),
            portal_type: this.dialogDetails?.portal_type
          };
          this.webSocketService.ringingStart(ringStartedData);
          this.isVideoMuted = false;
        } else {
          this.toastr.info(`Call from ${res.data.userData.name}`, '', { timeOut: 3000 });
        }
      }
    });

    this.openCallingDialog = this.webSocketService.openCallingDialog().subscribe((res: any) => {
      this.dialogDetails = res;
      this.caller = true;

      if (this.isCallingStarted) {
        this.dialogRef = this.dialog.open(this.callingDialog, {
          panelClass: 'common-modal-padding',
          disableClose: true,
        });
        this.playConectingAudio();
        this.clearTimeOutVar = setTimeout(() => { 
        this.dialogRef.close(); 
        this.clearAllSetTimeOut(); 
        this.initializeLocalVariables(); 
        this.clearConnectingTimeOut(); 
        this.clearRingingTimeOut(); 
        console.log("225 -----------------");
        
        this.endCall('')
        this.webSocketService.callMissed(this.dialogDetails);
      }, 
        this.setTimeOutTime);
      }

      this.isVideoMuted = false;
    });

    this.callStatusSubscription = this.webSocketService.callStatusSubscription().subscribe((res: any) => {
      this.callStatus = res;
    });

    this.callReceiveddSubscribe = this.webSocketService.callReceiveddSubscribe().subscribe((res: any) => {
      this.isCallReceived = res;
    });

    this.ringingStarted = this.webSocketService.ringingStarted().subscribe((res: any) => {
      if (this.isCallingStarted && res.roomName == this.dialogDetails.roomName && !this.isRingingStarted) {
        this.isRingingStarted = true;
        this.clearConnectingTimeOut();
        this.ringingStartedAudioFun();
        this.webSocketService.changeCallingStatus('Ringing');
      }
    });

    this.callPicked = this.webSocketService.callPicked().subscribe((res: any) => {
      this.isCallPickedByAnyone = true;
      this.startCall();
    });

    this.webSocketService.newMessageReceived().subscribe((data: any) => {
      if (data.room == this.loggedInUserId && this.dialogDetails.chatId == data.chatId) {
        this.allmessages.push({ message: data.message, createdAt: data.createdAt, type: data.type });
        this.showMessageCount = data.unread_count;
      }
    });

    this.subscriptions = [this.callStartedSubscribe, this.userSubscription, this.openCallerPopup, this.notifyCall, this.openCallingDialog, this.callStatusSubscription, this.callReceiveddSubscribe, this.ringingStarted, this.callPicked];
    this.endCallSubscribe();
    this.participantLeftSubscribe();
    this.closeRingerDialog();
    this.muteSubscription();
    this.scrollToBottomIfNeeded();       

  }

  playAudio() {
    this.audio.src = '../../../../assets/audio/ringer.mp3';
    this.audio.autoplay = true;
    this.audio.load();
    this.audioSetTime = setTimeout(() => { this.playAudio(); }, 8000);
  }

  playConectingAudio() {
    this.connectingAudio.src = '../../../assets/audio/connecting.mp3';
    this.connectingAudio.autoplay = true;
    this.connectingAudio.load();
    this.connectingAudioSetTime = setTimeout(() => { this.playConectingAudio(); }, 2000);
  }

  closeRingerDialog() {
    this.closeRingerDialogSubscribe = this.webSocketService.closeRingerDialogSubscribe().subscribe((res: any) => {
      if (res.roomName == this.dialogDetails.roomName) {
        if (this.dialogRef && !this.isCallReceived) {
          this.dialogRef.close();
          this.clearAllSetTimeOut();
          this.initializeLocalVariables();
        }
      }
    });
    this.subscriptions.push(this.closeRingerDialogSubscribe);
  }

  muteSubscription() {
    this.muteSubscriptionHandle = this.webSocketService.muteSubscription().subscribe((res: any) => {
   
        if (res.roomName == this.dialogDetails.roomName) {
          if (this.dialogDetails.type == 'video') {
            let trackName = res.identity;
            if (trackName) {
              let element = document.getElementsByClassName('video-' + trackName)[0];
              let imgElement = document.getElementsByClassName('img-identity-' + trackName)[0];
              if (element) {
                if (res.isVideoMuted) {
                  element.classList.contains('d-none') ? '' : element.classList.add('d-none');
                  imgElement.classList.contains('d-none') ? imgElement.classList.remove('d-none') : '';
                } else {
                  element.classList.contains('d-none') ? element.classList.remove('d-none') : '';
                  imgElement.classList.contains('d-none') ? '' : imgElement.classList.add('d-none');
                }
              }
            }
          }
          if (this.dialogDetails.type == 'audio' || this.dialogDetails.type == 'video') {
            let trackName = res.identity;
            if (trackName) {
              let element = document.getElementsByClassName('mic-' + trackName)[0];
              if (element) {
                if (res.isAudioMuted) {
                  element.classList.remove('fa-microphone');
                  element.classList.add('fa-microphone-slash');
                } else {
                  element.classList.remove('fa-microphone-slash');
                  element.classList.add('fa-microphone');
                }
              }
            }
          }
        }
  
    });
    this.subscriptions.push(this.muteSubscriptionHandle);
  }

  async endCallSubscribe() {
    this.endCallSubscription = this.webSocketService.endCall().subscribe(async (res: any) => {
      if (res.roomName == this.dialogDetails.roomName) {

        if (this.dialogRef) {
          this.dialogRef.close();
          this.rtc.localVideoTrack?.close();
          this.rtc.localAudioTrack?.close();
          await this.rtc.client?.leave();

          this.localTracks.videoTrack = null;
          this.localTracks.audioTrack = null;
          clearTimeout(this.timeoutId)
          this.webSocketService.changeCallingStatus('');
          // this.isCallPickedByAnyone=false;
          this.isVideoMuted = false;
          this.isAudioMuted = false;
          this.isCallPickedByAnyone = false;
          this.isCallingStarted = false;
          this.isCallReceived = false;
          this.allmessages = [];
          this.showchat = true;
          this.showvideo = true;
          // this.ngOnInit();
          localStorage.removeItem("type");
          // localStorage.removeItem("dialogdetails")
          if (localStorage.getItem("role") == "individual-doctor") {

            let reqData = {
              appointment_id: this.dialogDetails.chatId,
              columnData: {
                // status: "COMPLETED",
                callstatus: "DONE",
              }
            };

            this.doctoreservice.updateConsultation(reqData).subscribe(
              (res) => {
                let response = this.coreservice.decryptObjectData({ data: res });
                if (response.status) {
                  this.modalService.dismissAll("close");               
                }
              },
              (err) => {
                let errResponse = this.coreservice.decryptObjectData({
                  data: err.error,
                });
                this.toastr.error(errResponse.message);
              }
            );
          }
          localStorage.removeItem("opencall")
          localStorage.removeItem("callStatus");
        }
        
        if (this.isCallReceived || this.isCallingStarted) {
        this.clearRingingTimeOut();
        }
        this.clearRingingTimeOut();
        this.clearAllSetTimeOut();
        this.clearConnectingTimeOut();
        this.initializeLocalVariables();
        //PT - Feb 19
        // setTimeout(() => {
        //   window.location.reload()
        // }, 500);
      }
    });
    this.subscriptions.push(this.endCallSubscription);
  }


  participantLeftSubscribe() {
    this.participantLeft = this.webSocketService.participantLeft().subscribe((res: any) => {
      if (res.roomName == this.dialogDetails.roomName) {
        let participantSid;
        for (const key of Object.keys(this.activeRoomParticipantsData)) {
          if (this.activeRoomParticipantsData[key].identity == res.identity) {
            participantSid = this.activeRoomParticipantsData[key].uid;
          }
        }
        if (this.activeRoomParticipantsData && this.activeRoomParticipantsData.hasOwnProperty(participantSid)) {
          this.getParticipantName(res.identity);
          this.remoteParticipants--;
          delete (this.activeRoomParticipantsData[participantSid]);
          this.checkActiveUsers();
        }
      }
    });
    this.subscriptions.push(this.participantLeft);
  }

  clearAllSetTimeOut() {
    this.audio.pause();
    clearTimeout(this.clearTimeOutVar);
    clearTimeout(this.audioSetTime);
  }

  clearRingingTimeOut() {
    this.ringingStartedAudio.pause();
    this.isRingingStarted = false;
    clearTimeout(this.ringingStartedAudioSetTime);
  }

  ringingStartedAudioFun() {
    this.ringingStartedAudio.src = '../../../../assets/audio/ringer.mp3';
    this.ringingStartedAudio.autoplay = true;
    this.ringingStartedAudio.load();
    this.ringingStartedAudioSetTime = setTimeout(() => { this.ringingStartedAudioFun(); }, 8000);
  }

  clearConnectingTimeOut() {
    this.connectingAudio.pause();
    clearTimeout(this.connectingAudioSetTime);
  }

  muteAudio() {
    if (!this.isAudioMuted) {
      this.isAudioMuted = true;
      this.rtc.localAudioTrack.setMuted(true);
    } else {
      this.isAudioMuted = false;
      this.rtc.localAudioTrack.setMuted(false);
    }
    const data = { roomName: this.dialogDetails.roomName, userId: this.loggedInUserId, isAudioMuted: this.isAudioMuted, isVideoMuted: this.isVideoMuted, authtoken: "Bearer " + localStorage.getItem("token"), portal_type: this.dialogDetails.portal_type };
    this.webSocketService.muteTrack(data);
  }

  endCall(type = '') {
    localStorage.removeItem("callStatus");
    if (type == 'caller') {
      localStorage.setItem('type', type);
    }
    // if(this.openedWindow && !this.openedWindow.closed){
    //   this.openedWindow.close();
    //   this.openedWindow = null;
    // }
    // console.log("endCall ----------475");
    this.clearRingingTimeOut();
    this.webSocketService.endCallEmit({ roomName: this.dialogDetails.roomName, loggedInUserId: this.loggedInUserId, authtoken: "Bearer " + localStorage.getItem("token"), portal_type: this.dialogDetails.portal_type });
  }
  @HostListener('window:beforeunload', ['$event'])
  handleRefresh(event: Event) {
    // Get the current URL path
    const currentUrl = window.location.pathname;
  
    // Get navigation entries
    const navigationEntries = window.performance.getEntriesByType('navigation');
    const navigationEntry = navigationEntries[0] as PerformanceNavigationTiming;
  
    // Check if the page is being refreshed and the URL matches
    if (navigationEntry?.type === 'reload' && currentUrl === '/individual-doctor/appointment') {
      event.preventDefault(); // Optional, can be used to block the default refresh
      if(this.isCallingStarted){
        console.log("492 --------------");
        
        this.endCall();
      }
    }
  }  


  initializeLocalVariables() {
    this.isCallRecieved = false;
    this.caller = false;
    this.webSocketService.isCallReceived(false);
    this.webSocketService.isCallStarted(false);
  }

  joinCall(parameter = '') {
    this.webSocketService.changeCallingStatus('Connecting...');
    this.webSocketService.isCallReceived(true);
    let mediaPermission;
    mediaPermission = { audio: true };
    if (this.dialogDetails.type == 'video') {
      mediaPermission = { ...mediaPermission, video: true };
    }
    if (!this.isCallPickedByAnyone) {
      this.dialogDetails.uid = this.generateUid();
      this.dialogDetails.userId = this.loggedInUserId;
      this.webSocketService.callPickEmit(this.dialogDetails);
    } else {
      this.startCall();
    }
  }

  async startCall() {
    if (this.isCallingStarted) {
      this.clearRingingTimeOut();
    }
    if (this.isCallReceived || this.isCallingStarted) {
      await this.getAccessToken().then(async (response: any) => {
        if (this.callby == '') {
          this.dialogRef.close();
        }
        localStorage.setItem("callStatus",'true')

        let res = await this.coreservice.decryptObjectData({ data: response });
        this.clearAllSetTimeOut();

        if (res.status) {
          this.connect(res.body?.token, res.body?.uid);
          this.uid = res.body?.uid;
          if (localStorage.getItem("opencall") == null) {
            localStorage.setItem("opencall", "call")
          }

          this.dialogRef = this.dialog.open(this.groupDialog, { panelClass: 'groupcalldiolog', disableClose: true });
          this.hours = this.mins = this.seconds = 0;

          if (!this.isCallingStarted) {
            this.webSocketService.closeRingerDialog({ loggedInUserId: this.loggedInUserId, roomName: this.dialogDetails.roomName });
          }

        } else {
          this.toastr.error(res.message);
        }

      });
    } else {
      if (this.dialogRef && !this.isCallReceived) {
      }
    }
  }

  async connect(token: any, uid: any) {
    try {
      // Get devices
      const devices = await AgoraRTC.getDevices();
      this.isJoining = true;
  
      // Filter for audio devices
      const audioDevices = devices.filter((device) => device.kind === "audioinput");
      if (!audioDevices.length) {
        throw new Error("No audio input devices found. Please check microphone permissions.");
      }
      const selectedMicrophoneId = audioDevices[0].deviceId;
  
      // Create microphone audio track
      this.rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true,
        ANS: true,
      });
  
      // Handle video devices if the call type is 'video'
      if (this.dialogDetails.type === 'video') {
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        if (videoDevices.length === 0) {
          // console.log("No video input devices found. Camera will be off.");
          // Video is not available, we allow the user to join without the video track
          this.rtc.localVideoTrack = null;  // No video track
        } else {
          const selectedCameraId = videoDevices[0].deviceId;
    
          // Create camera video track if video device is available
          this.rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
            cameraId: selectedCameraId,
            optimizationMode: "detail",
            encoderConfig: {
              width: 1280,     // Desired width
              height: 720,     // Desired height
              frameRate: 30,   // Frame rate
            },
          });
        }
      }
    
      // Ensure the dialogDetails and roomName are valid
      if (!this.dialogDetails || !this.dialogDetails.roomName) {
        throw new Error("Invalid room name. Unable to join the channel.");
      }
  
      // console.log(this.dialogDetails, "dialogDetails_roomName____________");
  
      // Prepare options and start the call
      const options = {
        appId: environment.appIds,
        channel: this.dialogDetails.roomName,
        token: token,
        uid: uid
      };
  
      await this.startBasicCall(options);
    } catch (e) {
      // Catch and handle all errors
      this.toastr.error("Something went wrong: " + (e.message || e));
      console.error("Error in connect function:", e);
    }
  }

  // async connect(token: any, uid: any) {
  //   AgoraRTC.getDevices().then(async (devices) => {
  //     this.isJoining = true;
  //     let audioDevices, videoDevices;
  //     var selectedMicrophoneId, selectedCameraId
  //     audioDevices = devices.filter(function (device) {
  //       return device.kind === "audioinput";
  //     });

  //     selectedMicrophoneId = audioDevices[0].deviceId;
  //     this.rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
  //       AEC: true,
  //       ANS: true,
  //     });

  //     if (this.dialogDetails.type == 'video') {
  //       videoDevices = devices.filter(function (device) {
  //         return device.kind === "videoinput";
  //       });

  //       selectedCameraId = videoDevices[0].deviceId;
  //       this.rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
  //         cameraId: selectedCameraId,
  //         // encoderConfig: "720p",
  //         optimizationMode: "detail",
  //         encoderConfig: {
  //           width: 1280,     // Desired width
  //           height: 720,     // Desired height
  //           frameRate: 30,   // Frame rate
  //         },
  //       });
  //     }

  //     return Promise.all([
  //       this.rtc
  //     ]);
  //   }).then(res => {
  //     let options = { appId: environment.appIds, channel: this.dialogDetails.roomName, token: token, uid: uid };
  //     this.startBasicCall(options);

  //   }).catch(e => {
  //     this.toastr.error('Something went wrong', e);
  //   });
  // }

  async startBasicCall(options) {
    // this.rtc.client = await AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    this.rtc.client = await AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
    await this.rtc.client.join(options.appId, options.channel, options.token, options.uid).then(() => {

      this.publishLocalTRacks();
      this.isJoining = false;
      this.calculateCallDuration();
      this.publishedRemoteTracks();

    }).catch(e => {
      this.toastr.error('Something went wrong', e);
    
      
      this.endCall();
    });
  }

  publishLocalTRacks() {
    this.localTracks.audioTrack = this.rtc.localAudioTrack;
    this.localTracks.videoTrack = this.rtc.localVideoTrack;
    let dataTracks = [this.localTracks.audioTrack, ...(this.localTracks.videoTrack) ? [this.localTracks.videoTrack] : []];

    this.attachLocalTrack();
    this.rtc.client.publish(dataTracks);
  }
  private attachLocalTrack() {
    (this.rtc.localVideoTrack) ? this.rtc.localVideoTrack.play('localVideo') : '';
  }

  private calculateCallDuration() {
    let timer: string = "";
    this.timeoutId = setTimeout(() => {
      this.seconds++;
      if (this.seconds > 59) {
        this.mins++;
        this.seconds = 0;
        if (this.mins > 59) {
          this.mins = 0;
          this.hours++;
        }
      }
      //Format time
      if (this.hours > 0) {
        timer += (this.hours < 10) ? '0' + this.hours : this.hours;
        timer += ':';
      }
      timer += (this.mins < 10) ? '0' + this.mins : this.mins;
      timer += ':';
      timer += (this.seconds < 10) ? '0' + this.seconds : this.seconds;
      this.webSocketService.changeCallingStatus(timer);
      this.calculateCallDuration();
    }, 1000);
  }

  muteVideo() {
    if (!this.isVideoMuted) {
      this.isVideoMuted = true;
      this.rtc.localVideoTrack.setMuted(true);
    } else {
      this.isVideoMuted = false;
      this.rtc.localVideoTrack.setMuted(false);
    }
    const data = { roomName: this.dialogDetails.roomName, userId: this.loggedInUserId, isAudioMuted: this.isAudioMuted, isVideoMuted: this.isVideoMuted, authtoken: "Bearer " + localStorage.getItem("token") };
    this.webSocketService.muteTrack(data);
  }

  publishedRemoteTracks() {
    this.rtc.client.on("user-published", async (user, mediaType) => {
      await this.rtc.client.subscribe(user, mediaType);
      if (mediaType === "video") {
        this.attachRemoteTrack(mediaType, user);
      }
      if (mediaType === "audio") {
        this.attachRemoteTrack(mediaType, user);
      }
    });

    this.rtc.client.on("user-unpublished", user => {
    });

    this.rtc.client.on("user-left", user => {      
      this.remove(user);
    });

    this.rtc.client.on("user-joined", (user) => {
      let id = user.uid;
      this.remoteUsers.push({ 'uid': +id });
      this.updateUserInfo.next(id);
    });
  }

  private getParticipantDetails(identity: string) {
    const data = { roomName: this.dialogDetails.roomName, identity: identity };
    this.doctoreservice.getParticipantDetails(data).subscribe(async (response: any) => {
      let res = await this.coreservice.decryptObjectData({ data: response });

      if (res.status) {
        let nameElement = document.getElementsByClassName('username-' + res.body?.userIdentity)[0];
        if (nameElement) {
          nameElement.innerHTML = res.body?.userName;
        }
        let imgElement = document.getElementsByClassName('img-identity-' + res.body?.userIdentity)[0];
        if (imgElement) {
          imgElement.setAttribute('src', res.body?.userImage ? this.baseUrl + res.body?.userImage : "../../../assets/img/default_user.png");
        }
        this.addParticipantName(res.body?.userIdentity, res.body?.userName);

      } else {
        let nameElement = document.getElementsByClassName('username-' + identity)[0];
        if (nameElement) {
          nameElement.innerHTML = this.dialogDetails.name;
        }
      }
    });
  }

  private addParticipantName(identity: string, name: string) {
    for (const key of Object.keys(this.activeRoomParticipantsData)) {
      if (this.activeRoomParticipantsData[key].identity == identity) {
        this.activeRoomParticipantsData[key].participantName = name;
      }
    }
  }

  openchatdiv() {
    if (this.showchat) {
      this.showchat = false;
      this.showvideo = false;
    }
    else {
      this.showchat = true;
      this.showvideo = true;
    }

    this.doctoreservice.updateUnreadMessage(this.dialogDetails.chatId, this.loggedInUserId, 'Bearer ' + localStorage.getItem("token")).subscribe((res) => {
      this.showMessageCount = 0;
    });
  }

  private attachRemoteTrack(track: any, user: any) {
    this.remoteParticipants = 0;
    let dataTrack = 0;

    this.rtc.client.remoteUsers.forEach((element) => {
      dataTrack++;
      this.activeRoomParticipantsData[element.uid] = { uid: element.uid, identity: element.uid, participantName: '' };
    });
    this.remoteParticipants = dataTrack;

    if (this.dialogDetails.type === 'video') {
      if (track == 'video') {
        if (document.getElementsByClassName('sid-' + user.uid).length == 0) {
          const div = this.renderer.createElement('div');
          const img = this.renderer.createElement('img');
          if (!this.dialogDetails.isGroup) {
            this.renderer.setAttribute(img, 'src', this.dialogDetails.image ? this.baseUrl + this.dialogDetails.image : "../../../assets/img/default_user.png");
          } else {
            this.renderer.setAttribute(img, 'src', "../../../assets/img/default_user.png");
          }
          this.renderer.addClass(img, 'img-fluid');
          this.renderer.addClass(img, 'd-none');
          this.renderer.addClass(img, 'img-' + user.uid);
          this.renderer.addClass(img, 'img-identity-' + user.uid);
          this.renderer.appendChild(div, img);
          const videoBox = this.renderer.createElement('div');
          this.renderer.addClass(videoBox, 'video_box');
          this.renderer.addClass(videoBox, 'video-' + user.uid);
          this.renderer.addClass(div, 'user');
          this.renderer.addClass(div, 'sid-' + user.uid);
          this.renderer.addClass(div, 'identity-' + user.uid);
          this.renderer.setProperty(videoBox, 'id', 'remote-video-' + user.uid);
          // this.renderer.appendChild(videoBox, element);
          this.renderer.appendChild(div, videoBox);
          const userBtn = this.renderer.createElement('div');
          this.renderer.addClass(userBtn, 'user-buttons');
          //getting anchor data
          const anchor = this.getUserNameOption(user);
          this.renderer.appendChild(userBtn, anchor);
          this.renderer.appendChild(div, userBtn);
          this.renderer.appendChild(this.remoteVideo.nativeElement, div);
        }
        user.videoTrack.play('remote-video-' + user.uid);
        if (this.dialogDetails.isGroup) {
          this.getParticipantDetails(user.uid);
        } else {
          this.addParticipantName(user.uid, this.dialogDetails.name);
        }
      } else {
        const audioBox = this.renderer.createElement('div');
        this.renderer.addClass(audioBox, 'audio_box');
        this.renderer.addClass(audioBox, 'audio-' + user.uid);
        this.renderer.setProperty(audioBox, 'id', 'remote-audio-' + user.uid);
        user.audioTrack.play('remote-audio-' + user.uid);
      }
    }

    if (this.dialogDetails.type === 'audio') {
      if (track == 'audio') {
        const div = this.renderer.createElement('div');
        const img = this.renderer.createElement('img');
        if (!this.dialogDetails.isGroup) {
          this.renderer.setAttribute(img, 'src', this.dialogDetails.image ? this.baseUrl + this.dialogDetails.image : "../../../assets/img/default_user.png");
        } else {
          this.renderer.setAttribute(img, 'src', "../../../assets/img/default_user.png");
        }
        this.renderer.addClass(img, 'img-fluid');
        this.renderer.addClass(img, 'img-' + user.uid);
        this.renderer.addClass(img, 'img-identity-' + user.uid);
        this.renderer.appendChild(div, img);
        const audioBox = this.renderer.createElement('div');
        this.renderer.addClass(audioBox, 'audio_box');
        this.renderer.addClass(audioBox, 'audio-' + user.uid);
        this.renderer.addClass(div, 'user');
        this.renderer.addClass(div, 'sid-' + user.uid);
        this.renderer.addClass(div, 'identity-' + user.uid);
        this.renderer.setProperty(audioBox, 'id', 'remote-audio-' + user.uid);
        this.renderer.appendChild(div, audioBox);
        const userBtn = this.renderer.createElement('div');
        this.renderer.addClass(userBtn, 'user-buttons');
        const anchor = this.getUserNameOption(user);
        this.renderer.appendChild(userBtn, anchor);
        this.renderer.appendChild(div, userBtn);
        this.renderer.appendChild(this.remoteVideo.nativeElement, div);
        user.audioTrack.play('remote-audio-' + user.uid);
        if (this.dialogDetails.isGroup) {
          this.getParticipantDetails(user.uid);
        } else {
          this.addParticipantName(user.uid, this.dialogDetails.name);
        }
      }
    }
  }

  private getUserNameOption(user: any) {
    const anchor = this.renderer.createElement('a');
    this.renderer.addClass(anchor, 'userName');
    const span = this.renderer.createElement('span');
    this.renderer.addClass(span, 'username-' + user.uid);
    // if(!this.dialogDetails.isGroup){
    // const text = this.renderer.createText(this.dialogDetails.name);
    // this.renderer.appendChild(span, text);
    // }
    this.renderer.appendChild(anchor, span);
    const btnDiv = this.renderer.createElement('div');
    this.renderer.addClass(btnDiv, 'flt_btn');
    const btn = this.renderer.createElement('button');
    this.renderer.addClass(btn, 'btn');
    const mic = this.renderer.createElement('i');
    this.renderer.addClass(mic, 'fas');
    this.renderer.addClass(mic, 'fa-microphone');
    this.renderer.addClass(mic, 'mic-' + user.uid);
    this.renderer.appendChild(btn, mic);
    this.renderer.appendChild(btnDiv, btn);
    this.renderer.appendChild(anchor, btnDiv);
    return anchor;
  }

  remove(participant: any) {
    if (this.activeRoomParticipantsData && this.activeRoomParticipantsData.hasOwnProperty(participant.uid)) {
      this.getParticipantName(participant.uid);
      this.remoteParticipants--;
      delete (this.activeRoomParticipantsData[participant.uid]);
      this.checkActiveUsers();
    }
  }
  private checkActiveUsers() {

    if (Object.keys(this.activeRoomParticipantsData).length == 0 && localStorage.getItem('role') != 'individual-doctor') {
      console.log("942 --------------");
      this.endCall();
    }
  }

  private getParticipantName(id: string): void {
    let elemMatch;
    for (const key of Object.keys(this.activeRoomParticipantsData)) {
      if (this.activeRoomParticipantsData[key].identity == id) {
        elemMatch = this.activeRoomParticipantsData[key];
      }
    }
    this.toastr.info(`${(elemMatch.participantName != "") ? elemMatch.participantName : this.dialogDetails.name}  left`, '', { timeOut: 3000 });
    let divElement = document.getElementsByClassName('identity-' + id)[0];
    if (divElement) {
      divElement.remove();
    }
  }

  getAccessToken() {
    return new Promise((resolve) => {
      const data = { roomName: this.dialogDetails.roomName, loginname: this.dialogDetails.ownname, chatId: this.dialogDetails.chatId, authtoken: "Bearer " + localStorage.getItem("token"), loggedInUserId: this.loggedInUserId, uid: this.generateUid(), portal_type: this.dialogDetails.portal_type };
      this.doctoreservice.getAccessToken(data).subscribe(async (res) => {
        resolve(res);
      });
    });
  }

  generateUid() {
    const length: number = 5;
    const randomNo = (Math.floor(Math.pow(10, length) + Math.random() * 9 * Math.pow(10, length)));
    return randomNo;
  }

  getAssessmentList() {
    let reqData = {
      appointmentId: this.dialogDetails.chatId,
    };
    this.patientservice.getAssessmentList(reqData).subscribe((res) => {
      let response = this.coreservice.decryptObjectData({ data: res });
      if (response.status) {
        if (response?.body != null) {
          this.assessmentsList = response?.body?.assessments;
        }
      }
    });

  }


  // patient-profile
  viewprofilepopup() {
    this.ngxLoader.start();
    this.doctoreservice.viewAppointmentDetails(this.dialogDetails.chatId).subscribe((res) => {
      let response = this.coreservice.decryptObjectData({ data: res });
      this.patientId = {
        appointmentId: this.dialogDetails.chatId,
        patientId: response?.data?.patientDetails?.patient_id,
        openbyvideo: true
      };

      const patientId = response?.data?.patientDetails?.patient_id;
      const appointmentId = this.dialogDetails.chatId;
      const showAddButtton = true
      if (patientId && appointmentId) {
        const url = `/individual-doctor/patientmanagement/details/${patientId}?appointmentId=${appointmentId}&&showAddButtton=${showAddButtton}`;
        this.openedWindow = window.open(url, '_blank');
      }
      this.ngxLoader.stop();
      setTimeout(() => {
        const closeButton = document.querySelector('.viewprofile .close-button');
        if (closeButton instanceof HTMLElement) {
          closeButton.focus(); // Programmatically move focus
        }
      }, 0);

    });
  }

  // Utility function to reset focus to the previously focused element
  resetFocus() {
    const lastFocusedElement = document.activeElement as HTMLElement;
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }
  //  Approved modal
  openVerticallyCenteredstop(stop: any) {
    this.modalService.open(stop, {
      centered: true,
      size: "md",
      windowClass: "stop_consultation",
      backdrop: "static",
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

  openmodal() {
    this.dialog.open(this.groupDialog, { panelClass: 'groupcalldiolog', disableClose: true });
  }

  async sendMessage() {        
    if (this.message.trim() !== '') {
    if ((this.message == undefined || this.message == '')) {
      this.toastr.error('Please type a message to continue.');
      return;
    }

    this.allmessages.push({ message: this.message, createdAt: new Date(), type: "sender" });
    let read = false;
    this.webSocketService.sendMessage({
      message: this.message, createdAt: new Date(), type: "recieve"
      , senderId: this.loggedInUserId, chatId: this.dialogDetails.chatId, authtoken: 'Bearer ' + localStorage.getItem("token"), portal_type: this.dialogDetails.portal_type
    });
    this.message = "";
    this.scrollToBottomIfNeeded();
  }
  }



  closePopup() {
    this.form.reset();
    this.modalService.dismissAll('close');
  }

  closeChatPopup() {
    this.showchat = true;
    this.showvideo = true;
    this.doctoreservice.updateUnreadMessage(this.dialogDetails.chatId, this.loggedInUserId, 'Bearer ' + localStorage.getItem("token")).subscribe((res) => {
      this.showMessageCount = 0;
    });
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      // Add logic to send the file to the server or display it in the chat
    }
  }
  
  ngAfterViewInit() {
    // Add a scroll event listener to detect manual scrolling
    this.chatBody?.nativeElement.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, offsetHeight } = this.chatBody.nativeElement;
      // Check if the user is not at the bottom
      this.userScrolledUp = scrollTop + offsetHeight < scrollHeight - 50;
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottomIfNeeded();
  }
  
  scrollToBottomIfNeeded(): void {
    if (this.chatBody) {
      const { scrollTop, scrollHeight, offsetHeight } = this.chatBody.nativeElement;
  
      // If user is scrolling up, do not scroll to the bottom
      if (this.userScrolledUp) {
        this.previousScrollHeight = scrollHeight; // Save current height for comparison
        return;
      }
  
      // Scroll to the bottom if new content is added (height changes)
      if (scrollHeight !== this.previousScrollHeight) {
        this.chatBody.nativeElement.scrollTop = scrollHeight;
        this.previousScrollHeight = scrollHeight; // Update height
      }
    }
  }
  
}

