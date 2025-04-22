import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { WebSocketService } from "src/app/shared/web-socket.service"
import { IndiviualDoctorService } from "../indiviual-doctor.service"
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-individual-doctor-notification',
  templateUrl: './individual-doctor-notification.component.html',
  styleUrls: ['./individual-doctor-notification.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class IndividualDoctorNotificationComponent implements OnInit {

  doctorName: any = "";
  menuSelected = "";
  doctorProfile: any = "";
  @Input() doctor_name: string;
  isLoggedIn: boolean = true
  notificationlist: any = [];
  notiCount: number = 0;
  isViewcount: number = 0;
  doctorRole: any;
  loginId: any;
  staff_Id: any;
  ncount: any = [];
  notify: any;
  notificationCount: any;
  pageSize: number = 20;
  totalLength: number = 0;
  page: any = 1;
  userID:any;
  userRole: any;
  searchQuery: string = ''; // Stores search input
  listData: any[] = []; // Stores notifications

  constructor( private _coreService: CoreService,
     private doctorservice: IndiviualDoctorService,
     private route: ActivatedRoute,
    private router: Router) { 
      let loginData = JSON.parse(localStorage.getItem("loginData"));
      let adminData = JSON.parse(localStorage.getItem("adminData"));
  
      this.userRole = loginData?.role;
  
      if(this.userRole === "INDIVIDUAL_DOCTOR_STAFF"){
        this.userID = adminData?.in_hospital;
      }else{
        this.userID = loginData?._id;
  
      }
    }

  ngOnInit(): void {
    this.getnotificationdata();
    this.route.queryParams.subscribe(params => {
      if (params['chatId']) {
        this.getRoomList(params['chatId']);  // Load chat messages
      }
    });
  }

    getnotificationdata() {
    let reqData={
      for_portal_user:this.userID,
      limit: this.pageSize,
      page: this.page,
    }
    this.doctorservice.getnotificationdate(reqData).subscribe((response) => {

      let responsedecrypt = this._coreService.decryptObjectData({ data: response })      
      if (responsedecrypt.status) {
        this.notificationlist = responsedecrypt.body.list;
        this.notiCount = responsedecrypt.body.count;
        this.isViewcount = responsedecrypt.body.isViewcount;
        this.totalLength = responsedecrypt?.body.totalCount;
      }
    })
  }

  // markReadById(data:any){
  //   let params = {
  //     _id:data._id
  //   };
  //   this.doctorservice.markReadNotificationById(params).subscribe((res: any) => {
  //     let encryptedData = { data: res };
  //     let response = this._coreService.decryptObjectData(encryptedData);
  //     if(response.status){
  //       if (data.notitype == "New Appointment" || data.notitype == "Appointment" || data.notitype == "Cancel Appointment" || data.notitype == "Reshedule Appointment" || data.notitype == "Appointment Approved" || data?.notitype == "Booked Appointment") {
  //         this.router.navigate(['/individual-doctor/appointment/appointmentdetails/' + data.appointmentId])
  //       }else if (data.notitype == "chat") {
  //         this.router.navigate(['/individual-doctor/communication'], {
  //           queryParams: {
  //             type: data.chatId,
  //           }
  //         })
  //       }else{
  //         this.router.navigate(['/individual-doctor/notification'])
  //       }
  //     }
      
  //     this.ncount = [];
  //     this.getnotificationdata();
  //     // this.getnotificationList();
  //   })
  // }


  markReadById(data: any) {
    let params = { _id: data._id };

    this.doctorservice.markReadNotificationById(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
    
      if (response.status) {
        if (
          data.notitype === null && data.appointmentId ||
          ["New Appointment", "Appointment", "Cancel Appointment",
           "Reshedule Appointment", "Appointment Approved", "Booked Appointment"]
           .includes(data.notitype)
        ) {
          this.router.navigate(['/individual-doctor/appointment/appointmentdetails/', data.appointmentId]);
        } 
        
        else if (data.notitype && data.notitype.includes("New Message From")) {  
          let chatId = data.chatId || data.content; 
  
          if (chatId) {
            this.router.navigate(['/individual-doctor/communication'], {
              queryParams: { chatId: chatId }
            });
          }
        } 
        
        else {
          this.router.navigate(['/individual-doctor/notification']);
        }
      } else {
        console.warn("Failed to mark notification as read.");
      }
  
      this.ncount = [];
      this.getnotificationdata();
    });
  }
  
  

  getRoomList(chatId: any = '') {
    const params = {
      id: this.userID,
      searchQuery: this.searchQuery,
      type: "doctor"
    };
  
    this.doctorservice.getRoomlistService(params).subscribe((res: any) => {
      const decryptedData = this._coreService.decryptObjectData({ data: res });
  
      if (decryptedData.status == true) {
        this.listData = decryptedData?.body;
  
        if (this.listData.length > 0) {
          let chatData = this.listData.find((ele: any) => ele._id == chatId);
          if (chatData) {
            this.handleroute(chatData); // Open chat
          } else {
            console.warn("Chat ID not found in the list.");
          }
        }
      } else {
        this._coreService.showError(decryptedData.message, "");
      }
    });
  }
  handleroute(data: any) {
    if (data.notitype.includes("New Message From")) {  
      let chatId = data.chatId || data.content;  // Adjust if needed
  
      if (chatId) {
        this.router.navigate(['/individual-doctor/communication'], {
          queryParams: { chatId: chatId }
        });
      }
    } else {
      this.router.navigate(['/individual-doctor/notification']);
    }
  }
  
  
  

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getnotificationdata();
  }
}
