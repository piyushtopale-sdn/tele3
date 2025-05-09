import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from "@angular/forms";
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { ActivatedRoute, Router } from "@angular/router";
import { WebSocketService } from "../../../shared/web-socket.service"
import { AudioRecordingService } from 'src/app/shared/audio-recording.service';
import { DomSanitizer } from '@angular/platform-browser';
import { IndiviualDoctorService } from '../indiviual-doctor.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';


@Component({
  selector: 'app-individual-doctor-communication',
  templateUrl: './individual-doctor-communication.component.html',
  styleUrls: ['./individual-doctor-communication.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class IndividualDoctorCommunicationComponent implements OnInit {

  dataSource:any [] = [];
  userID: string = "";
  pageSize: number = 0;
  totalLength: number = 0;
  page: any = 1;
  staff_name: any = "";
  role: string = "";
  searchKey: any = "";
  searchText: any = "";
  searchQuery: any = "";
  list: any = [];
  listData: any = [];
  chatRoomID: any;
  chatRoom: boolean;
  receiverID: any = [];
  userChat: any;
  typeMessageForm: FormGroup;
  messageData: any = [];
  messages: any;
  groupForm: any;
  chatHeaderName: any;
  selectedChatUserId: any;  //for saving selecteduser id 
  isSubmitted: boolean = false;
  latestMessages: any;
  loggedInUserName: any;
  filterByrole: any = "";
  currentUrl: any = [];

  attachmentFile: any;
  attachmentToUpload: any = '';
  currentIndex: any = -1;
  showFlag: any = false;
  selectedImage: string | ArrayBuffer | null = null;
  selectedreceiver: any = '';
  selectedreceiverID: any = [];
  selectedrecieverimage: any = '';

  isAudioRecording = false;
  isAudioSent = false;
  audioRecordedTime: any;
  audioBlobUrl: any;
  audioBlob: any;
  audioName: any;
  audioConf = { audio: true };
  audioBase64: string;

  attachmentType: any;

  newMembers: any[] = [];
  buttonTypeToOpenModal: any;
  idsToRemove:any = [];
  checkGroup: any;
  groupProfileImage: any = "";
  groupProfilePicFile: any = null;
  groupImage: any;
  showAllChatWindow : boolean = false;

  chatWithName: any;
  senderName: any;
  groupMember: any;
  status: boolean;
  isOnline: boolean;
  userRole: any;
  messageID_todelete: any;
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  private isUserScrollingUp: boolean = false;
  private previousScrollHeight: number = 0;
  disableSendButton:boolean = false;
  filteredList: any[] = [];
  constructor(
    private readonly router: Router,
    private readonly modalService: NgbModal,
    private readonly fb: FormBuilder,
    private readonly _coreService: CoreService,
    private readonly loader: NgxUiLoaderService,
    private readonly toastr: ToastrService,
    private readonly doctorService: IndiviualDoctorService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly _webSocketService: WebSocketService,
    private readonly audioRecordingService: AudioRecordingService,
    private readonly ref: ChangeDetectorRef,
    private readonly sanitizer: DomSanitizer,
  ) {
    const userData = this._coreService.getLocalStorage("loginData");
    this.userID = userData._id;
    this.loggedInUserName = userData?.fullName;
    this.userRole = userData.role  

    this._webSocketService.receiveNotification().subscribe((res: any) => {
      if(res.status){
        this.getRoomList();
      }
    });
    this._webSocketService.newMessageReceivedata().subscribe((data: any) => {     
       
      if (data?.chatId === this.chatRoomID) {
        if(data?.receiverID !== this.userID){
          this.messageData.push(data);
        }
      }
    });
    this._webSocketService.receivedMessageDeleteresponse().subscribe((data: any) => {      
      if (data.status === true) {
        this.closePopup();
        const { scrollTop, scrollHeight, offsetHeight } = this.chatContainer?.nativeElement ?? {};
        
        if ((scrollTop + offsetHeight) < scrollHeight - 100) { // User scrolled up
          this.isUserScrollingUp = true;
        } else {
          this.isUserScrollingUp = false;
        }
  
        if (data?.body?.chatId === this.chatRoomID) {
          this.getAllmessages();
        }
        this.getRoomList();
      }
    });

    this.typeMessageForm = this.fb.group({
      message: ['', []]
    })

    //--------------Audio Recording--------------
    this.audioRecordingService.recordingFailed().subscribe((res: any) => {
      this.toastr.error(res);
      this.isAudioRecording = false;
      this.ref.detectChanges();
    });
    this.audioRecordingService.getRecordedTime().subscribe((time) => {
      this.audioRecordedTime = time;
      this.ref.detectChanges();
    });
    this.audioRecordingService.getRecordedBlob().subscribe((data) => {
      this.audioBlob = data.blob;
      this.audioName = data.title;
      let file = new File([data.blob], data.title);
      let formData: any = new FormData();
      formData.append("userId", this.userID);
      formData.append("file", file);
      formData.append("docType", "pictures");
      formData.append("serviceType", "doctor");
      this.attachmentToUpload = formData;
      this.ref.detectChanges();
    });


  }

  //  Start chat modal
  openVerticallyCenteredstartchat(startchatcontent: any) {
    this.modalService.open(startchatcontent, { centered: true, size: 'md', windowClass: "start_chat", backdrop: false });
    this.getPatientList();
  }

  //  Create Group modal
  openVerticallyCenteredcreategroup(creategroupcontent: any, type: any) {
    this.buttonTypeToOpenModal = type;
    this.modalService.open(creategroupcontent, { centered: true, size: 'md', windowClass: "start_chat", backdrop: false });
    this.getPatientList();

  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  openVerticallyCenteredsecond(deleteMessage: any, data: any) {
    this.messageID_todelete = data?._id;
    this.modalService.open(deleteMessage, { centered: true, size: "sm" });
  }


  closePopup() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.searchText = "";
    this.status = false;
    this.receiverID = [];
    this.newMembers = [];
    return this.status

  }


  ngOnInit(): void {
    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl);
    this.activatedRoute.queryParams.subscribe((val: any) => {
      this.chatRoomID = val.type;
    });

    let data = {
      userId: this.userID,
      token: "Bearer " + localStorage.getItem("token"),
    }
    this._webSocketService.joinChatRoom_patient_doc(data);

    this._webSocketService.Roomcreated().subscribe((res: any) => {
      this.getRoomList(res?.body?._id,'room_created');
    });


    this.getRoomList();

    this.groupForm = this.fb.group({
      groupName: ['', Validators.required],
      profile_pic: [""],
      members: this.fb.array([])
    });

  }

  ngAfterViewInit() {
    this.chatContainer?.nativeElement.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, offsetHeight } = this.chatContainer.nativeElement;
      this.isUserScrollingUp = scrollTop + offsetHeight < scrollHeight - 50;
    });
  }
  
  ngAfterViewChecked() {
    this.scrollToBottomIfNeeded();
  }
  
  scrollToBottomIfNeeded(): void {
    if (this.chatContainer) {
      const {  scrollHeight } = this.chatContainer.nativeElement;
  
      // If user is scrolling up, do not scroll to the bottom
      if (this.isUserScrollingUp) {
        this.previousScrollHeight = scrollHeight; // Save current height for comparison
        return;
      }
  
      // Scroll to the bottom if new content is added (height changes)
      if (scrollHeight !== this.previousScrollHeight) {
        this.chatContainer.nativeElement.scrollTop = scrollHeight;
        this.previousScrollHeight = scrollHeight; // Update height
      }
    }
  }

  // ngOnDestroy(): void {
  //   let data = {
  //     userId: this.userID,
  //     token: "Bearer " + localStorage.getItem("token"),
  //   }
  //   this._webSocketService.leaveChatRoom_patient_doc(data);
  // }

  get groupMembers() {
    return this.groupForm.get('members') as FormArray;
  }

  getPatientList() {
    let reqData = {
      doctorId: this.userID,
      searchText: this.searchText,
      idsToRemove:this.idsToRemove,
      page: 1,
      limit: 100,
      sort: '',
      isSelf: true
    };

    this.doctorService.getPatientListAddedByDoctor(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });

      if (response.status) {
        const data = [];
        if (response?.body?.result > 0) {
          for (const staff1 of response?.body?.result) {
            let staff = JSON.parse(JSON.stringify(staff1));
              for (const ele of staff?.staffinfos) {
                data.push({
                  fullName: ele?.name,
                  profile_pic: ele?.profile_pic ? ele?.profile_pic : '../../../../assets/img/default_user.png',
                  isOnline: ele?.portalusers?.isOnline,
                  id: ele?.id,
                  role: ele?.role
                });
              }
            } 
          }
          let dataSource = response?.body?.result;
          if(this.listData.length > 0){
            this.removeMatchingUsers(this.listData,dataSource)
            }
          
          this.totalLength = response?.body?.totalRecords;
        }
      }, (error) => {
        console.error('Error fetching patient list:', error);
      });
  }

 
  handleSearchFilter(text: any) {
    this.searchText = text;
    this.getPatientList();

  }

  createRoom(data: any) {
    const params = {
      sender: this.userID,
      receiver: data?.portalUserId,
      token: "Bearer " + localStorage.getItem("token"),
    };

    this._webSocketService.createChatRoomFor_patient_doc(params);
    this.closePopup();
  }

  //Curently Not In Use
  checkstaff(data) {
    this.status = false;

    if (this.receiverID.length > 0) {
      const idExists = this.receiverID.some((ele: any) => ele === data.id);
      if (idExists) {
        this.status = true;
      }
    } else {
      this.status = false;
    }
    return this.status;
  }


 //Curently Not In Use
  addGroupMember(data: any) {
    const idIndex = this.receiverID.findIndex((ele: any) => ele === data.id);
    if (idIndex !== -1) {
      // ID exists, remove it
      this.receiverID.splice(idIndex, 1);

      // Add code to remove the member control from form control array
      const memberIndex = this.groupMembers.controls.findIndex(control => control.value.id === data.id);
      if (memberIndex !== -1) {
        this.groupMembers.removeAt(memberIndex);
      }
    } else {
      // ID doesn't exist, add it
      this.receiverID.push(data.id);

      // Add code to update the form control array
      const memberControl = this.fb.control(data);
      this.groupMembers.push(memberControl);
    }
  }

  //Curently Not In Use
  async createGroupRoom() {
    this.isSubmitted = true;
    if (this.groupForm.invalid || this.groupMembers.length < 2) {
      return;
    }

    if (this.groupProfilePicFile != null) {
      await this.uploadDocuments(this.groupProfilePicFile).then((res: any) => {
        this.groupForm.patchValue({
          profile_pic: res.data[0].Key,
        });
      });
    }
    this.isSubmitted = false;
    const params = {
      profile_pic: this.groupForm.get('profile_pic').value,
      receiver: this.receiverID,
      groupName: this.groupForm.get('groupName').value,
      sender: this.userID,
      isGroupChat: true,
      token: 'Bearer ' + localStorage.getItem('token'),
      type: 'Hospital'
    };
    this._webSocketService.createGroupChatRoom(params);
    this.closePopup();
  }
 //Curently Not In Use
  checkUser(data) {
    // return false
    let status = false;

    if (this.newMembers.length > 0) {
      const idExists = this.newMembers.some((ele: any) => ele === data.id);
      if (idExists) {
        status = true;
      }
    } else {
      status = false;
    }
    return status;
  }
  //Curently Not In Use
  addIndividualMemberForExistingGroup(data: any) {
    const idIndex = this.newMembers.indexOf(data.id);

    if (idIndex === -1) {
      // ID does not exist, add it to the array
      this.newMembers.push(data.id);
      // Add the corresponding form control
      const memberControl = this.fb.control(data);
      this.groupMembers.push(memberControl);
    } else {
      // ID exists, remove it from the array
      this.newMembers.splice(idIndex, 1);
      // Find and remove the corresponding form control
      const controlIndex = this.groupMembers.controls.findIndex((control: any) => control.value.id === data.id);
      if (controlIndex !== -1) {
        this.groupMembers.removeAt(controlIndex);
      }
    }
  }
  //Curently Not In Use
  addMemberToexistingGroup() {
    const params = {
      chatroomId: this.chatRoomID,
      newMembers: this.newMembers,
      senderID: this.userID,
      token: "Bearer " + localStorage.getItem("token"),
      notitype: "chat",
      message: `${this.loggedInUserName} has added you to the group ${this.chatHeaderName}`,
      created_by_type: 'hospital',
      type: 'Hospital'
    };
    this._webSocketService.addMemberToExistingGroup(params);
    this.closePopup();
  }

  getRoomList(chatId: any = '', type:any="") {
    const params = {
      id: this.userID,
      searchQuery: this.searchQuery,
      type:"doctor"      
    };
    
    this.doctorService.getRoomlistService(params).subscribe((res: any) => {
      const decryptedData = this._coreService.decryptObjectData({ data: res });

      if (decryptedData.status) {
        this.listData = decryptedData?.body;
        this.filteredList = [...this.listData];
        if (this.listData.length > 0) {
          if(this.listData?.length>0){
            this.listData.map((ele:any)=>{
             this.idsToRemove.push(ele.receiverID[0])
            })
          }else{
            this.idsToRemove = []
          }

          if (chatId != '') {
            this.listData.filter((ele: any) => {  
              return ele?._id == chatId
            })
       
          } else {
            // this.handleroute(this.listData[0], true)
          }

          if(type === 'room_created'){
            this.handleroute(this.listData[0], true);
          }
          if(this.showAllChatWindow){      
            this.removeUnreadCountAspertheChatId(this.chatRoomID);              
          }

        }
      } else {
        this._coreService.showError(decryptedData.message, "")
      }
    })
  }

  handleSearchFilterForRoom(event: any) {
    this.searchQuery = event.target.value;
    this.getRoomList();
  }

  async handleroute(data: any, openDiv: boolean) {
    this.selectedreceiver = data?._id;
    this.showAllChatWindow = true;

    this.isOnline = (this.userID === data?.senderDetails?._id) ? data?.receiverDetails[0]?.isOnline : data?.senderDetails?.isOnline;

    let groupParticipant = data?.receiverDetails.map((data) => {
      return data?.full_name === this.loggedInUserName ? "You" : data?.full_name;
    });


    this.checkGroup = data?.isGroupChat;
    if (data.isGroupChat) {
      this.selectedrecieverimage = data?.profile_pic ? data?.profile_pic : "../../../../assets/img/GroupIcon.png";
    }
    else {
      if (this.userID !== data?.senderDetails?._id) {
        this.selectedrecieverimage = data?.senderDetails?.profile_picture ? data?.senderDetails?.profile_picture : "../../../../assets/img/default_user.png";
      } else {
        this.selectedrecieverimage = data?.receiverDetails[0]?.profile_picture ? data?.receiverDetails[0]?.profile_picture : "../../../../assets/img/default_user.png";
      }
    }

    let recciverdata = data?.receiverDetails.map((data) => {
      return data._id
    })
    recciverdata.push(data.senderID);
    recciverdata.splice(recciverdata.indexOf(this.userID), 1);

    this.selectedreceiverID = recciverdata;

    this.chatRoom = openDiv;
    this.chatRoomID = data._id;
    this.latestMessages = data?.latestMessage?.message;
    if (data?.isGroupChat == true) {
      this.chatHeaderName = data?.groupName;
      this.chatWithName = `${groupParticipant}`;
    }
    else {
      let headerName = (this.userID === data?.senderDetails?._id) 
      ? (data?.receiverDetails[0]?.full_name + " (" + (data?.receiverDetails[0]?.mrn_number ? data?.receiverDetails[0]?.mrn_number : "")+ ")")
      : (data?.senderDetails?.full_name + " (" + (data?.senderDetails?.mrn_number ? data?.senderDetails?.mrn_number : "")+ ")");    
      let data2 = (this.userID === data?.senderDetails?._id) ? data?.senderDetails?.full_name : data?.receiverDetails[0]?.full_name;
      this.chatHeaderName = headerName;
      this.chatWithName = `Chat with ${this.loggedInUserName}`
      this.selectedChatUserId = (this.userID === data?.senderDetails?._id)  //Saving selected user's Id for gotoEmr
      ? data?.receiverDetails[0]?._id 
      : data?.senderDetails?._id;
    }
    await this.getAllmessages();

    if(this.listData.length>0){
     const newRecord = this.listData.find((ele:any)=>{
        return data?.receiverDetails[0]?._id === ele?.receiverDetails[0]?._id
      })
      if(newRecord?.disableChatOption){
        this.disableSendButton = true
      }else{
        this.disableSendButton = false
      }
    }
  }

  goToEMR(patientId: string) {                //Navigate to EMR for Selcted user
    if (!patientId) {
      console.error("No patient ID found!");
      return;
    }
  
    this.router.navigate([`/individual-doctor/patientmanagement/details/${patientId}`]);
  }
  

  async sendMessage() {
    this.isSubmitted = true;

    const messageValue = this.typeMessageForm.get('message').value;
    const hasMessage = messageValue && messageValue.trim() !== '';
    const hasAttachment = this.attachmentToUpload !== '';

    if (!hasMessage && !hasAttachment) {
      this.toastr.error("Please write a something or attach a file", "Error");
      return;
    }

    this.isSubmitted = false;

    let messageData = {
      chatId: this.chatRoomID,
      senderID: this.userID,
      receiverID: this.selectedreceiverID,
      message: hasMessage ? this.typeMessageForm.value.message : '',
      token: "Bearer " + localStorage.getItem("token"),
      attachments: null, // Initialize attachments to null
      notitype: `New Message from ${this.loggedInUserName}`,
      type:"Doctor",
      created_by_type:"doctor"
    };

    

    if (hasAttachment) {
      await this.uploadDocuments(this.attachmentToUpload).then((res: any) => {
        let imagetype = res?.data[0].split('.')[1];
        messageData.attachments = { type: imagetype, path: res?.data[0] };
      });
    }

    this._webSocketService.sendChatMessage(messageData);


    this.typeMessageForm.reset();
    await this.getAllmessages();   
    this.attachmentToUpload = '';
    this.typeMessageForm.reset();
    this.removeAttachedImage();
    this.scrollToBottomIfNeeded();
    this.getRoomList();
  }

  uploadDocuments(doc: FormData) {
    this.loader.start();
    return new Promise((resolve, reject) => {
      this.doctorService.uploadFileForPortal(doc).subscribe(
        (res) => {
          let response = this._coreService.decryptObjectData({ data: res });
            this.loader.stop();

          resolve(response);
        },
        (err) => {
          this.loader.stop();

          let errResponse = this._coreService.decryptObjectData({
            data: err.error,
          });

          this.toastr.error(errResponse.messgae);
        }
      );
    });
  }

  generateSignUrl(path) {
    let reqData = {
      path:path
    }
    return new Promise((resolve, reject) => {
      this.doctorService.generateSignUrl(reqData).subscribe(
        (res) => {
          let response = this._coreService.decryptObjectData({ data: res });

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

  getAllmessages(): Promise<any> {
    return new Promise((resolve, reject) => {
      let params = {
        chatId: this.chatRoomID,
        page: this.page,
        limit: this.pageSize,
        loggedINId: this.userID,
      };
  
      this.doctorService.getAllMessagesService(params).subscribe(
        (res) => {
          let encryptedData = { data: res };
          let response = this._coreService.decryptObjectData(encryptedData);
          setTimeout(() => {
            this.isUserScrollingUp = false; // allow scroll after reload
          }, 100); // let view update before reset
          if (response.status) {
            this.messageData = response?.body;   
            //Pranali - Mar 26         
            this.removeUnreadCountAspertheChatId(this.chatRoomID);           
            resolve(this.messageData); // Resolve the promise with the message data
          } else {
            this.messageData = [];
            // reject(response.message); // Reject the promise with an error message
            return(response.message);
          }
        },
        (error) => {
          reject(error); // Reject the promise with the error from the API
        }
      );
    });
  }


 async previewImage(path: string, type?: number) {
    await this.generateSignUrl(path).then((res: any) => {
      window.open(res.data, '_blank');    
     })
  }


  openFileSelector() {
    let element: HTMLElement = document.getElementsByClassName('file-upload')[0] as HTMLElement;
    element.click();
    // this.scrollToBottom();
  }

  fileChange(event: any) {
    const file = event.target.files[0];  
    if (!file) {
      this.toastr.error('No file selected');
      return;
    }

    // let allowedType = ['image/jpeg', 'image/jpg', 'image/png', 'audio/mp3', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    let allowedType = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
    if (allowedType.indexOf(file.type) != -1) {
      this.attachmentType = file.type;
    } else {
      this.attachmentFile = this.attachmentToUpload = '';
      this.toastr.error('File selected is not allowed');
    }
  
    let formData: any = new FormData();
    formData.append("userId", this.userID);
    formData.append("file", file);
    formData.append("docType", "pictures");
    formData.append("serviceType", "doctor");
  
    this.attachmentToUpload = formData;
  
    if (event.target.files && file) {
      let reader = new FileReader();
      reader.onload = (event: any) => {
        this.attachmentFile = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  
    this.attachmentType = file.type;
  }
  
  //Curently Not In Use
  async onGroupImageChange(event: any) {
    if (event.target.files.length > 0) {
      let file = event.target.files[0];
      let formData: any = new FormData();
      formData.append("userId", this.userID);
      formData.append("docType", "profile_pic");
      formData.append("multiple", "false");
      formData.append("docName", file);

      this.groupProfilePicFile = formData;

      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.groupProfileImage = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  deleteSingleMessage() {
    if (this.chatContainer) {
      const { scrollTop, scrollHeight, offsetHeight } = this.chatContainer.nativeElement;
      const isScrolledUp = (scrollTop + offsetHeight) < scrollHeight - 100;
  
      if (isScrolledUp) {
        this.isUserScrollingUp = true;
      } else {
        this.isUserScrollingUp = false;
      }
    }
  
    let params = {
      chatId: this.chatRoomID,
      deletedBy: this.userID,
      messageId: this.messageID_todelete,
      token: "Bearer " + localStorage.getItem("token"),
    };
    
    this._webSocketService.deleteMessage(params);
  }
  

  removeAttachedImage() {
    this.attachmentFile = undefined;
  }

  // onScrollDown() {
  // }

  // onScrollUp() {
  // }


  //------------Audio Recording Functions--------------

  startAudioRecording() {
    this.isAudioRecording = false;
    this.audioBlobUrl = null;
    if (!this.isAudioRecording) {
      this.isAudioRecording = true;
      this.audioRecordingService.startRecording();
    }
  }

  stopAudioRecording() {
    if (this.isAudioRecording) {
      this.audioRecordingService.stopRecording();
      this.isAudioRecording = false;
    }
  }

  abortAudioRecording() {
    if (this.isAudioRecording) {
      this.isAudioRecording = false;
      this.audioRecordingService.abortRecording();
    } else {
      this.isAudioRecording = false;
      this.audioBlobUrl = null;
      this.audioRecordingService.abortRecording();
    }
    this.audioBase64 = undefined;
  }


  async addBase64audio() {
    await this.handleAudioBlob(this.audioBlob).then((res: string) => {
      this.audioBase64 = res;
    });
  }

  clearAudioRecordedData() {
    this.audioBlobUrl = null;
  }

  downloadAudioRecordedData() {
    this._downloadFile(this.audioBlob, 'audio/mp3', this.audioName);
  }

  _downloadFile(data: any, type: string, filename: string): any {
    const blob = new Blob([data], { type: type });
    const url = window.URL.createObjectURL(blob);
    //this.video.srcObject = stream;
    //const url = data;
    const anchor = document.createElement('a');
    anchor.download = filename;
    anchor.href = url;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  handleAudioBlob(evt: any) {
    return new Promise((resolve) => {
      let f = evt; // FileList object
      let reader = new FileReader();
      reader.onload = (function (theFile) {
        return function (e) {
          let binaryData: any = e.target.result;
          let base64String = window.btoa(binaryData);
          resolve(base64String);
        };
      })(f);
      reader.readAsBinaryString(f);
    });
  }

  fixBinary(bin: any) {
    let length = bin.length;
    let buf = new ArrayBuffer(length);
    let arr = new Uint8Array(buf);
    for (let i = 0; i < length; i++) {
      arr[i] = bin.charCodeAt(i);
    }
    return buf;
  }

  getAudioBlob(base64: any) {
    return new Promise((resolve) => {
      let binary = this.fixBinary(atob(base64));
      let blob = new Blob([binary], { type: 'audio/mp3' });
      let url = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob))
      resolve(url);
    });
  }


  removeUnreadCountAspertheChatId(chatid:any){   
    
    const chatIndex = this.listData.findIndex((chat: any) => chat?._id === chatid);
    if (chatIndex !== -1 && this.listData[chatIndex].unreadCount > 0) {
      let data1 ={
        chatID : chatid,
        token: "Bearer " + localStorage.getItem("token")
      }      
      this._webSocketService.readMessageCount(data1);
      if(this.chatRoomID === chatid){
        this.listData[chatIndex].unreadCount = 0;      
      }
    }
  }
  removeMatchingUsers(listData:any = [], dataSource:any = []) {
    const allIDs = new Set();
  
    listData.forEach(item => {
      allIDs.add(item.senderID);
      if (Array.isArray(item.receiverID)) {
        item.receiverID.forEach(id => allIDs.add(id));
      } else {
        allIDs.add(item.receiverID);
      }
    });
  
    const filtered = dataSource.filter(item => !allIDs.has(item.portalUserId));    
    this.dataSource = filtered;
  }
  
  isWithinTwoHours(createdAt: string): boolean {
    const messageTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    const diffInMs = currentTime - messageTime;
    const twoHoursInMs = 2 * 60 * 60 * 1000;  
    return diffInMs < twoHoursInMs;
  }

  truncateMessage(message: string, wordLimit: number): string {
    const words = message.split(' ');
    if (words.length <= wordLimit) return message;
    return words.slice(0, wordLimit).join(' ') + '...';
  }

  handleSearchFilterForChatUser(searchText: string): void {
    const lowerSearch = searchText.toLowerCase().trim();  
    this.filteredList = this.listData.filter(item => {
      const senderName = item?.senderDetails?.full_name?.toLowerCase() || '';
      const receiverName = item?.receiverDetails?.[0]?.full_name?.toLowerCase() || '';
      return senderName.includes(lowerSearch) || receiverName.includes(lowerSearch);
    });
  }

  onNavigate(url: any): void {
    const menuitems = JSON.parse(localStorage.getItem("activeMenu"));
    if(menuitems){
      this.currentUrl = url;
  
      const matchedMenu = menuitems.find(
        (menu) => menu.route_path === this.currentUrl
      );
      this.router.navigate([url]).then(() => {
        this.doctorService.setActiveMenu(matchedMenu?.name);
      });
    }
  }

  shouldShowDate(index: number): boolean {
    if (index === 0) return true;  
    const currentDate = new Date(this.messageData[index].createdAt).toDateString();
    const previousDate = new Date(this.messageData[index - 1].createdAt).toDateString();
    return currentDate !== previousDate;
  }
  
}
