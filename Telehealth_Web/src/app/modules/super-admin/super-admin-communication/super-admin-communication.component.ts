import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy ,HostListener} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from "@angular/forms";
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { CoreService } from "src/app/shared/core.service";
import intlTelInput from "intl-tel-input";
import { SuperAdminService } from "../../super-admin/super-admin.service";
import { IEncryptedResponse } from "src/app/shared/classes/api-response";
import { ToastrService } from "ngx-toastr";
import { ActivatedRoute, Router } from "@angular/router";
import { SuperAdminStaffResponse } from "../super-admin-staffmanagement/addstaff/addstaff.component.type";
import { WebSocketService } from "../../../shared/web-socket.service"
import { environment } from "src/environments/environment"
import { Subscription } from 'rxjs';
import { PatientService } from '../../patient/patient.service';
// import { InfiniteScrollModule } from "ngx-infinite-scroll";
import { AudioRecordingService } from 'src/app/shared/audio-recording.service';
import { DomSanitizer } from '@angular/platform-browser';
import FileSaver from 'file-saver'

export interface PeriodicElement {
  staffname: string;
  // username: string;
  role: string;
  phone: string;
  datejoined: string;
  staffImage: string;
  isOnline: boolean;
}
const ELEMENT_DATA: PeriodicElement[] = [];
@Component({
  selector: 'app-super-admin-communication',
  templateUrl: './super-admin-communication.component.html',
  styleUrls: ['./super-admin-communication.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SuperAdminCommunicationComponent implements OnInit, OnDestroy {

  // @ViewChild('scrollMe', { static: false }) private myScrollContainer!: ElementRef;

  // ngAfterViewChecked() {
  //   // Scroll to the bottom when the view is checked after changes
  //   this.scrollToBottom();
  // }

  // scrollToBottom(): void {
  //   try {
  //     this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
  //   } catch (err) {}
  // }

  dataSource = ELEMENT_DATA;
  userID: string = "";
  pageSize: number = 100;
  totalLength: number = 0;
  page: any = 1;
  staff_name: any = "";
  role: string = "";
  searchKey: any = "";
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

  attachmentFile: any;
  attachmentToUpload: any='';
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
  @ViewChild("scrollMe", { static: false })
  private myScrollContainer!: ElementRef;
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private _coreService: CoreService,
    private _superAdminService: SuperAdminService,
    private service: PatientService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private _webSocketService: WebSocketService,
    private audioRecordingService: AudioRecordingService,
    private ref: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
  ) {
    const userData = this._coreService.getLocalStorage("loginData");
    this.userID = userData._id;
    this.loggedInUserName = userData.fullName;

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
      formData.append("userId", this.userID);
      formData.append("docType", "chat_images");
      formData.append("multiple", "false");
      formData.append("docName", file);

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
      type:'Superadmin'
    }
    this._webSocketService.joinChatRoom(data);

    this._webSocketService.Roomcreated().subscribe((res: any) => {
      this.getRoomList(res.body._id);
    });

    this._webSocketService.groupRoomcreated().subscribe((res: any) => {
      this.getRoomList(res.body._id);
    });

    this._webSocketService.addMembersToRoom().subscribe((res: any) => {
      this.getRoomList(res.body._id);
    });

    this.getRoomList();

    this.groupForm = this.fb.group({
      groupName: ['', Validators.required],
      profile_pic: [""],
      members: this.fb.array([])
    });

  }


  // @HostListener("window:scroll", [])
  // onChatScroll() {
  //   const chatContainer = document.querySelector(".chat");
  //   if (chatContainer) {
  //     const isScrolledToBottom =
  //       chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 10;
  //     if (isScrolledToBottom) {
  //       this.changePage();
  //     }
  //   }
  // }

  // changePage() {
  //   // ... your code to change the page ...
  //   this.page++;

  //   // Fetch more chat messages using the new page number
  //   this.getAllmessages();
  // }
  
  // onWindowScroll() {
  //   // Check if the user has scrolled to the bottom of the page
  //   this.isScrolledToBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight;
  //   // If user has scrolled to the bottom, trigger the page change
  //   if (this.isScrolledToBottom) {
  //     this.changePage();
  //   }
  // }


  ngOnDestroy(): void {
    let data = {
      userId: this.userID,
      token: "Bearer " + localStorage.getItem("token"),
      type:'Superadmin'
    }
    this._webSocketService.leaveChatRoom(data);
  }

  get groupMembers() {
    return this.groupForm.get('members') as FormArray;
  }

  private getAllStaff() {
    let adminId;
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    let roleData = loginData.role;
    if (roleData == 'superadmin') {
      adminId = this.userID;
    } else {
      let adminData = JSON.parse(localStorage.getItem("adminData"));
      adminId = adminData.superadmin_id;
    }
    const params = {
      admin_id: adminId,
      page: this.page,
      limit: this.pageSize,
      role_id:this.role,
      searchKey: this.searchKey
    };

    this._superAdminService.getAllStaffforChat(params).subscribe({
      next: (result: IEncryptedResponse<SuperAdminStaffResponse>) => {
        const decryptedData = this._coreService.decryptObjectData(result);
        const data = [];
        for (const staff of decryptedData.data?.data) {
          data.push({
            staffname: staff.staff_name,
            staffImage: staff.staff_image,
            role: staff.role !== undefined ? staff.role.name : "",
            phone: staff.for_portal_user?.phone_number,

            datejoined: this._coreService.createDate(new Date(staff.createdAt)),
            id: staff.for_portal_user._id,
            is_locked: staff.for_portal_user?.lock_user,
            is_active: staff.for_portal_user?.isActive,
            isOnline: staff.for_portal_user?.isOnline
          });
        }

        this.totalLength = decryptedData.data?.totalCount;
        this.dataSource = data;

      },
      error: (err: ErrorEvent) => {

        this._coreService.showError("", "Staff Load Failed");
      },
    });
  }


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
      type:"Superadmin"
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
      type:'Superadmin'
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
      created_by_type: 'super-admin',
      type:'Superadmin'
    };
    this._webSocketService.addMemberToExistingGroup(params);
    this.closePopup();
    // this.handleroute(this.listData[0], true)
  }

  getRoomList(chatId: any = '') {
    const params = {
      // '0': this.userID,
      id: this.userID,
      searchQuery: this.searchQuery,
      token: "Bearer " + localStorage.getItem("token"),
      type:'Superadmin'
    };
    this._superAdminService.getRoomlistService(params).subscribe((res: any) => {
      const decryptedData = this._coreService.decryptObjectData({ data: res });
      if (decryptedData.status == true) {
        this.listData = decryptedData?.body;
        if (this.listData.length > 0) {
          if (chatId != '') {
            let data = this.listData.filter((ele: any) => {
              return ele._id == chatId
            })
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
    this.selectedreceiver = data._id;

    this.isOnline = (this.userID === data?.senderDetails?._id) ? data?.receiverDetails[0]?.isOnline : data?.senderDetails?.isOnline;
    let selectedreceiverID = [];

    let groupParticipant = data?.receiverDetails.map((data) => {
      return data.fullName === this.loggedInUserName ? "You" : data.fullName;
    });

    this.checkGroup = data?.isGroupChat;
    if (data.isGroupChat) {
      this.selectedrecieverimage = data?.profile_pic ? data?.profile_pic : "../../../../assets/img/GroupIcon.png";
    }
    else {
      this.selectedrecieverimage = data.receiverDetails[0]?.portaluserReceiverDetails[0]?.documentInfoReceiverDetails[0]?.receiverImage ? data.receiverDetails[0]?.portaluserReceiverDetails[0]?.documentInfoReceiverDetails[0]?.receiverImage : "../../../../assets/img/default_user.png"
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
      let headerName = (this.userID === data?.senderDetails?._id) ? data?.receiverDetails[0]?.fullName : data?.senderDetails?.fullName;
      let data2 = (this.userID === data?.senderDetails?._id) ? data?.senderDetails?.fullName : data?.receiverDetails[0]?.fullName;
      this.chatHeaderName = headerName;
      this.chatWithName = `Chat with ${data2}`
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
      created_by_type: 'super-admin',
      type: 'Superadmin'
    };
    
    if (hasAttachment) {
      // Proceed with attachment upload only if there is an attachment
      await this.uploadDocuments(this.attachmentToUpload).then((res: any) => {
        let imagetype = res.data[0].Key.split('.')[1];
        messageData.attachments = { type: imagetype, path: res.data[0].Key };
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
  //     created_by_type: 'super-admin',
  //     type:'Superadmin'
  //   };

  //   if (this.attachmentToUpload != '') {
  //     await this.uploadDocuments(this.attachmentToUpload).then((res: any) => {
  //       let imagetype = res.data[0].Key.split('.')[1]
  //       messageData.attachments = { type: imagetype, path: res.data[0].Key }
  //     });
  //   }

  //   this._webSocketService.sendChatMessage(messageData);
  //   this.attachmentToUpload = '';
  //   this.typeMessageForm.reset();
  //   this.removeAttachedImage();
  //   setTimeout(() => {
  //       this.scrollToBottom(); 
  //   }, 100);
  // }

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

  getAllmessages() {
    let params = {
      chatId: this.chatRoomID,
      page: this.page,
      limit: this.pageSize,
      loggedINId: this.userID
    };

    this._superAdminService.getAllMessagesService(params).subscribe((res) => {
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
    // this.imageObject.splice(0, this.imageObject.length);
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
    formData.append("userId", this.userID);
    formData.append("docType", "chat_images");
    formData.append("multiple", "false");
    formData.append("docName", file);

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

    this._superAdminService.clearAllMessages(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.getAllmessages()
    })
  }

  deleteSingleMessage(data:any){
    let params = {
      chatId:this.chatRoomID,
      deletedBy: this.userID,
      messageId:data._id
    };

    this._superAdminService.clearSingleMessages(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.getAllmessages()
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