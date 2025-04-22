import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from "@angular/forms";
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { CoreService } from "src/app/shared/core.service";
import intlTelInput from "intl-tel-input";
import { IEncryptedResponse } from "src/app/shared/classes/api-response";
import { ToastrService } from "ngx-toastr";
import { ActivatedRoute, Router } from "@angular/router";
import { WebSocketService } from "../../../shared/web-socket.service"
import { environment } from "src/environments/environment"
import { Subscription } from 'rxjs';
import { PatientService } from '../../patient/patient.service';
import { AudioRecordingService } from 'src/app/shared/audio-recording.service';
import { DomSanitizer } from '@angular/platform-browser';
import FileSaver from 'file-saver'
import { SuperAdminStaffResponse } from "src/app/modules/super-admin/super-admin-staffmanagement/addstaff/addstaff.component.type";
import { FourPortalService } from '../four-portal.service';

export interface PeriodicElement {
  staffname: string;
  staffImage
  role: string;
  phone: string;
  datejoined: string;
  isOnline: boolean;
}
const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: 'app-four-portal-communication',
  templateUrl: './four-portal-communication.component.html',
  styleUrls: ['./four-portal-communication.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FourPortalCommunicationComponent implements OnInit {

 
  dataSource = ELEMENT_DATA;
  userID: string = "";
  pageSize: number = 100;
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
  getmessage: void;
  typeMessageForm: FormGroup;
  messageData: any = [];
  messages: any;
  groupForm: any;
  minAllowedUsers: number = 2;
  chatHeaderName: any;
  isSubmitted: boolean = false;
  latestMessages: any;
  loggedInUserName: any;
  filterByrole: any = "";

  attachmentFile: any;
  attachmentToUpload: any = '';
  imageObject: Array<object> = [];
  currentIndex: any = -1;
  showFlag: any = false;
  baseUrl: any = environment.apiUrl;
  selectedImage: string | ArrayBuffer | null = null;
  selectedreceiver: any = '';
  selectedreceiverID: any = [];
  selectedrecieverimage: any = '';

  isAudioRecording = false;
  isAudioSent = false;
  audioRecordedTime;
  audioBlobUrl;
  audioBlob;
  audioName;
  audioConf = { audio: true };
  audioBase64: string;

  attachmentType: any;
  groupNmaeInputblock: boolean = false;

  newMembers: any[] = [];
  buttonTypeToOpenModal: any;

  checkGroup: any;
  groupProfileImage: any = "";
  groupProfilePicFile: any = null;
  groupImage: any;
  private Getchatmessage: Subscription = Subscription.EMPTY;
  private newMessageReceivedata: Subscription = Subscription.EMPTY;
  private Roomcreated: Subscription = Subscription.EMPTY;
  private groupRoomcreated: Subscription = Subscription.EMPTY;
  private addMembersToRoom: Subscription = Subscription.EMPTY;

  chatWithName: any;
  senderName: any;
  groupMember: any;
  status: boolean;
  isOnline: boolean;
  userRole: any;
  userlistForChat: any = [];
  adminId: any;
  messageID_todelete: any;
  portalType: any;
  @ViewChild("scrollMe", { static: false })
  private myScrollContainer!: ElementRef;
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private _coreService: CoreService,
    private toastr: ToastrService,
    private activatedRoute: ActivatedRoute,
    private _webSocketService: WebSocketService,
    private audioRecordingService: AudioRecordingService,
    private ref: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private fourportalservice: FourPortalService
  ) {
    const userData = this._coreService.getLocalStorage("loginData");
    this.userID = userData?._id;
    this.loggedInUserName = userData?.full_name;
    this.userRole = userData?.role;
    this.portalType = userData?.type;
    const adminData = this._coreService.getLocalStorage("adminData");
    this.adminId = adminData?.creatorId;

    this._webSocketService.newMessageReceivedata().subscribe((data: any) => {
      this.messageData.push(data);
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
      var file = new File([data.blob], data.title);
      let formData: any = new FormData();
      // formData.append("userId", this.userID);
      // formData.append("docType", "chat_images");
      // formData.append("multiple", "false");
      // formData.append("docName", file);

      formData.append("portal_user_id", this.userID);
      formData.append("docType", "chat_images");
      formData.append("multiple", "false");
      formData.append("documents", file);
      formData.append("portalType",this.portalType)

      this.attachmentToUpload = formData;
      // this.audioBlobUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(data.blob));
      //this.addBase64audio();
      this.ref.detectChanges();
    });


  }

  //  Start chat modal
  openVerticallyCenteredstartchat(startchatcontent: any) {
    this.modalService.open(startchatcontent, { centered: true, size: 'md', windowClass: "start_chat", backdrop: false });
    this.getAllStaff();
  }

  //  Create Group modal
  openVerticallyCenteredcreategroup(creategroupcontent: any, type: any) {
    this.buttonTypeToOpenModal = type;
    this.modalService.open(creategroupcontent, { centered: true, size: 'md', windowClass: "start_chat", backdrop: false });
    this.getAllStaff();

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

  openVerticallyCenteredsecondDelete(deleteAllMessages: any) {
    this.modalService.open(deleteAllMessages, { centered: true, size: "sm" });
  }

  closePopup() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.status = false;
    this.receiverID = [];
    this.newMembers = [];
    this.groupForm.reset();
    return this.status

  }

  scrollToBottom(): void {
 
    try {
      this.myScrollContainer.nativeElement.scrollTop =
        this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  // isScrolledToBottom = false;
  ngOnInit(): void {

    this.activatedRoute.queryParams.subscribe((val: any) => {
      this.chatRoomID = val.type;
    });

    let data = {
      userId: this.userID,
      token: "Bearer " + localStorage.getItem("token"),
      type: this.portalType
    }
    this._webSocketService.joinChatRoom(data);

    this._webSocketService.Roomcreated().subscribe((res: any) => {
      this.getRoomList(res?.body?._id);
    });

    this._webSocketService.groupRoomcreated().subscribe((res: any) => {
      this.getRoomList(res?.body?._id);
    });

    this._webSocketService.addMembersToRoom().subscribe((res: any) => {
      this.getRoomList(res?.body?._id);
    });

    this.getRoomList();

    this.groupForm = this.fb.group({
      groupName: ['', Validators.required],
      profile_pic: [""],
      members: this.fb.array([])
    });

  }

  ngOnDestroy(): void {
    let data = {
      userId: this.userID,
      token: "Bearer " + localStorage.getItem("token"),
      type: this.portalType
    }
    this._webSocketService.leaveChatRoom(data);
  }

  get groupMembers() {
    return this.groupForm.get('members') as FormArray;
  }

  private getAllStaff() {
    const params = {
      loggedInId: this.userID,
      // page: this.page,
      // limit: this.pageSize,
      searchText: this.searchText,
      role: this.filterByrole,
      adminId: this.adminId ? this.adminId : this.userID,
      portalType:this.portalType
    };

    this.fourportalservice.getAllFourPortalChatUser(params).subscribe({
      next: (result: IEncryptedResponse<SuperAdminStaffResponse>) => {
        const staffDetails = this._coreService.decryptObjectData({
          data: result,
        });

        const data = [];
        if (staffDetails?.body?.length > 0) {
          for (const staff1 of staffDetails?.body) {
            let staff = JSON.parse(JSON.stringify(staff1));
              data.push({
                staffname: staff?.name,
                staffImage: staff?.profile_pic ? staff?.profile_pic : '../../../../assets/img/default_user.png',
                isOnline: staff?.portalusers?.isOnline,
                id: staff?.id,
                role: staff?.role
            });
          }
        }
        this.dataSource = data;
        this.totalLength = staffDetails?.body?.length;
      },
    });
  }

  // handlePageEvent(data: any) {
  //   this.page = data.pageIndex + 1;
  //   this.pageSize = data.pageSize;
  //   this.getAllStaff();
  // }

  handleSearchFilter(event: any) {
    this.searchKey = event.target.value;
    this.getAllStaff();
  }

  createRoom(data: any) {
    const params = {
      sender: this.userID,
      receiver: data.id,
      // loggedINUserId: this.userID,
      token: "Bearer " + localStorage.getItem("token"),
      type: this.portalType,
      role:data?.role
    };
    this._webSocketService.createChatRoom(params);
    this.closePopup();
    // this.getRoomList();
  }

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
  
  // addGroupMember(data: any) {
  //   const idExists = this.receiverID.some((ele: any) => ele === data.id);
  //   if (!idExists) {
  //     this.receiverID.push(data.id);

  //     // Add the following code to update the form control array
  //     const memberControl = this.fb.control(data);
  //     this.groupMembers.push(memberControl);
  //   }
  // }

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
      type: this.portalType
    };
    this._webSocketService.createGroupChatRoom(params);
    this.closePopup();
  }

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

  addMemberToexistingGroup() {
    const params = {
      chatroomId: this.chatRoomID,
      newMembers: this.newMembers,
      senderID: this.userID,
      token: "Bearer " + localStorage.getItem("token"),
      notitype: "chat",
      message: `${this.loggedInUserName} has added you to the group ${this.chatHeaderName}`,
      created_by_type: this.portalType,
      type: this.portalType
    };
    this._webSocketService.addMemberToExistingGroup(params);
    this.closePopup();
    // this.handleroute(this.listData[0], true)
  }

  getRoomList(chatId: any = '') {
    const params = {
      id: this.userID,
      searchQuery: this.searchQuery,
      token: "Bearer " + localStorage.getItem("token"),
      type: this.portalType
    };
    this.fourportalservice.getRoomlistService(params).subscribe((res: any) => {
      const decryptedData = this._coreService.decryptObjectData({ data: res });
      if (decryptedData.status == true) {
        this.listData = decryptedData?.body;
        if (this.listData?.length > 0) {
          if (chatId != '') {
            let data = this.listData?.filter((ele: any) => {
              return ele?._id == chatId
            });
            this.handleroute(data[0], true)
          } else {
            this.handleroute(this.listData[0], true)
          }
        }
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      } else {
        this._coreService.showError(decryptedData.message, "")
      }
    })
  }

  handleSearchFilterForRoom(event: any) {
    this.searchQuery = event.target.value;
    this.getRoomList();
  }

  handleroute(data: any, openDiv: boolean) {
    this.selectedreceiver = data?._id;

    this.isOnline = (this.userID === data?.senderDetails?._id) ? data?.receiverDetails[0]?.isOnline : data?.senderDetails?.isOnline;
    let selectedreceiverID = [];

    let groupParticipant = data?.receiverDetails.map((data) => {
      return data.full_name === this.loggedInUserName ? "You" : data.full_name;
    });

    this.checkGroup = data?.isGroupChat;

    if (data?.isGroupChat) {
      this.selectedrecieverimage = data?.profile_pic ? data?.profile_pic : "../../../../assets/img/GroupIcon.png";
    }
    else {
      if(this.userID !== data?.senderDetails?._id){
        this.selectedrecieverimage = data?.senderDetails?.profile_picture ? data?.senderDetails?.profile_picture : "../../../../assets/img/default_user.png";
      }else{
        this.selectedrecieverimage = data?.receiverDetails[0]?.profile_picture ? data?.receiverDetails[0]?.profile_picture : "../../../../assets/img/default_user.png";
      }
    }

    let recciverdata = data?.receiverDetails.map((data) => {
      return data._id
    })
    recciverdata.push(data?.senderID);
    recciverdata.splice(recciverdata.indexOf(this.userID), 1);

    this.selectedreceiverID = recciverdata;

    this.chatRoom = openDiv;
    this.chatRoomID = data?._id;
    this.latestMessages = data?.latestMessage?.message;
    if (data?.isGroupChat == true) {
      this.chatHeaderName = data?.groupName;
      this.chatWithName = `${groupParticipant}`;
    }
    else {
      let headerName = (this.userID === data?.senderDetails?._id) ? data?.receiverDetails[0]?.full_name : data?.senderDetails?.full_name;
      let data2 = (this.userID === data?.senderDetails?._id) ? data?.senderDetails?.full_name : data?.receiverDetails[0]?.full_name;
      this.chatHeaderName = headerName;
      this.chatWithName = `Chat with ${this.loggedInUserName}`
    }
    this.getAllmessages();
  }

  async sendMessage() {
    this.isSubmitted = true;
  
    // const hasMessage = this.typeMessageForm.get('message').value.trim() !== '';
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
      notitype: "chat",
      created_by_type: this.portalType,
      type: this.portalType
    };
    
    if (hasAttachment) {
      // Proceed with attachment upload only if there is an attachment
      await this.uploadDocuments(this.attachmentToUpload).then((res: any) => {
        let imagetype = res?.data[0]?.url.split('.')[1]
        messageData.attachments = { type: imagetype, path: res?.data[0]?.url }
      });
    }
  
    this._webSocketService.sendChatMessage(messageData);
    this.attachmentToUpload = '';
    this.typeMessageForm.reset();
    this.removeAttachedImage();

    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  }

  // async sendMessage() {
  //   let messageData = {
  //     chatId: this.chatRoomID,
  //     senderID: this.userID,
  //     receiverID: this.selectedreceiverID,
  //     message: this.typeMessageForm.value.message,
  //     token: "Bearer " + localStorage.getItem("token"),
  //     attachments: this.attachmentFile,
  //     notitype: "chat",
  //     created_by_type: this.portalType,
  //     type: this.portalType
  //   };


  //   if (this.attachmentToUpload != '') {
  //     await this.uploadDocuments(this.attachmentToUpload).then((res: any) => {
  //       // messageData.attachments=res.data[0].Key
  //       let imagetype = res?.data[0]?.url.split('.')[1]
  //       messageData.attachments = { type: imagetype, path: res?.data[0]?.url }
  //     });
  //   }

  //   this._webSocketService.sendChatMessage(messageData);
  //   this.attachmentToUpload = '';
  //   this.typeMessageForm.reset();
  //   this.removeAttachedImage();
  // }

  uploadDocuments(doc: FormData) {
    return new Promise((resolve, reject) => {
      this.fourportalservice.uploadFileForPortal(doc).subscribe(
        (res) => {
          let response = this._coreService.decryptObjectData({data:res});
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

  getAllmessages() {
    let params = {
      chatId: this.chatRoomID,
      page: this.page,
      limit: this.pageSize,
      loggedINId: this.userID
    };

    this.fourportalservice.getAllMessagesService(params).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.messageData = response?.body;
      }
      else {
        // this._coreService.showError(response.message, "")
        this.messageData = []
      }
    })
  }

  showLightbox(index) {
    this.currentIndex = index;
    this.showFlag = true;
  }

  closeEventHandler() {
    this.showFlag = false;
    this.currentIndex = -1;
  }

  previewImage(path: any, type?: any) {
    let title: string;
    if (type != 1) {
      path = path;
      title = path.split('upload').slice(-1)[0].slice(1);
    }
    let obj = {image: path, title: title};
    this.imageObject = []; // Fix: Use array assignment to clear the imageObject array
    this.imageObject.push(obj);
    this.showLightbox(0);
  }

  downloadPDF(path: any, pdfName: any) {
    let obj = { image: path, title: pdfName };
    FileSaver.saveAs(obj.image, obj.title);
  }

  openFileSelector() {
    let element: HTMLElement = document.getElementsByClassName('file-upload')[0] as HTMLElement;
    element.click();
    // this.scrollToBottom();
  }

  openFileSelector1() {
    let element: HTMLElement = document.getElementsByClassName('file-upload1')[0] as HTMLElement;
    element.click();
    // this.scrollToBottom();
  }

  fileChange(event: any) {
    const file = event.target.files[0];
    // this.attachmentToUpload = file;
    let formData: any = new FormData();
    formData.append("portal_user_id", this.userID);
    formData.append("docType", "chat_images");
    formData.append("multiple", "false");
    formData.append("documents", file);
    formData.append("portalType",this.portalType)

    this.attachmentToUpload = formData;
    if (event.target.files && file) {
      let reader = new FileReader();
      reader.onload = (event: any) => {
        this.attachmentFile = event.target.result;
      };
      reader.readAsDataURL(file);
    }
    let allowedType = ['image/jpeg', 'image/jpg', 'image/png', 'audio/mp3', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedType.indexOf(file.type) != -1) {
      this.attachmentType = file.type;
    } else {
      this.attachmentFile = this.attachmentToUpload = '';
      this.toastr.error('File selected is not allowed');
    }
  }

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

  deleteAllmessages() {
    let params = {
      chatId: this.chatRoomID,
      deletedBy: this.userID
    };

    this.fourportalservice.clearAllMessages(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if(response?.status){
        this.closePopup();
        this.getAllmessages();
      }
    })
  }

  deleteSingleMessage(){
    let params = {
      chatId:this.chatRoomID,
      deletedBy: this.userID,
      messageId:this.messageID_todelete
    };

    this.fourportalservice.clearSingleMessages(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if(response?.status){
        this.closePopup();
        this.getAllmessages();
      }
    })
  }

  removeAttachedImage() {
    this.imageObject = this.attachmentFile = undefined;
  }

  onScrollDown() {
  }

  onScrollUp() {
  }


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

}
