import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { WebSocketService } from "src/app/shared/web-socket.service"
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FourPortalService } from "../four-portal.service";

@Component({
  selector: 'app-four-portal-header',
  templateUrl: './four-portal-header.component.html',
  styleUrls: ['./four-portal-header.component.scss'],
  encapsulation: ViewEncapsulation.None,

})


export class FourPortalHeaderComponent implements OnInit {

  @ViewChild("info_popup") info_popup: ElementRef;
  userName: any = "";
  menuSelected = "";
  userProfile: any = "";
  @Input() user_Name: string;
  isLoggedIn: boolean = true
  notificationlist: any = [];
  notiCount: number = 0;
  isViewcount: number = 0;
  userRole: any;
  loginId: any;
  staff_Id: any;
  ncount: any = [];
  notify: any;
  notificationCount: any;
  route_type: string;
  userType: any;
  pageSize: number = 5;
  totalLength: number = 0;
  page: any = 1;
  constructor(private readonly auth: AuthService, private readonly _coreService: CoreService, private readonly modalService: NgbModal,private readonly route: ActivatedRoute,

    private readonly labRadioService: FourPortalService,private readonly _webSocketService: WebSocketService,
    private readonly router: Router) {
    this._coreService.SharingMenu.subscribe((res) => {
      if (res != "default") {
        this.menuSelected = res;
      } else {
        this.menuSelected = this._coreService.getLocalStorage("menuTitle");
      }
    });

    if (this._coreService.getLocalStorage("loginData")) {
      let role = this._coreService.getLocalStorage("loginData")?.role;
      let loginData = JSON.parse(localStorage.getItem("loginData"));
      let portal_type = localStorage.getItem("type");
      if (role === "INDIVIDUAL" || role === "ADMIN") {
        this.userName = loginData?.centre_name;
        this.userRole = loginData?.role
        this.userType = portal_type
        this.loginId = loginData._id
        this.getPortalDetails();
      }
      else if (role === "STAFF") {        
        this.userName = loginData?.full_name;
        this.staff_Id = loginData._id
        this.userRole = loginData?.role
        this.userType = loginData?.type
        this.getstaffdetails(this.staff_Id, this.userType)

      }
    }
    this.realTimeNotification();
    this.getRealTimeNotification();
  }


  realTimeNotification() {
    this._webSocketService.receivedNotificationInfo().subscribe((res: any) => {
      this.getnotificationList();

    
    });
  }

  ngAfterViewInit(): void {
    if (this._coreService.getLocalStorage("loginData")) {
      let loginData = JSON.parse(localStorage.getItem("loginData"));

      if (loginData.isFirstTime === 0) {
        this.openVerticallyCentereddetale(this.info_popup);
      }

    }

  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.route_type = params.get('path');     
    });

    this.getnotificationList();
  }
  logout() {
    this.labRadioService.logOutUserApi().subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this._coreService.showSuccess("", response.message);
        this.auth.logout(`/portals/login/${this.userType}`);
      }
    })
  }

  getPortalDetails() {
    let reqData ={
      id:this.loginId     
    }
    this.labRadioService.getProfileDetailsById(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      
      if (response.status) {
        this.userProfile = response?.data?.adminData?.profile_picture_signed_url;
      } else {
        this._coreService.showError("", response.message)
      }
    });
  }

  getstaffdetails(id: any, type:any) {
    let pararm = {
      staffId: id,
      type: type
    };

    this.labRadioService.getStaffDetails(pararm).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        if (result.status) {
          this.userProfile = result?.body?.in_profile?.profile_picture_signed_url;
        }

      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getRealTimeNotification() {
    this._webSocketService.receiveNotification().subscribe((res: any) => {
      this.ncount.push(res)
      this.notify = this.ncount.length;
      this.getnotificationList();
    })
  }

  getnotificationList() {
    if(JSON.parse(localStorage.getItem("loginData"))){
      
      let notifylist = {
        for_portal_user: JSON.parse(localStorage.getItem("loginData"))?._id,
        page: this.page,
        limit: this.pageSize,
      };
      
      this.labRadioService.getAllNotificationService(notifylist).subscribe((res) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
        if(response.status)
       {
        this.isViewcount = response.body.isViewcount;
        if (this.isViewcount === 0) {
          this.notificationlist = [];
        } else {
          this.notificationlist = response.body.list;
        }
        this.notiCount = response.body.count;

       }
      }
      );
    }
  }

  changeIsViewStatus(){
    if(this.notiCount>0)
    {
    let data={
      new:false,
      receiverId:JSON.parse(localStorage.getItem("loginData"))._id
    }
    this.labRadioService.updateNotificationStatus(data).subscribe({
      next:(res)=>{
        let result = this._coreService.decryptContext(res);
        if(result.status){
          this.notiCount=0
          this._coreService.showSuccess(result.message,'');
        }
      },
      error:(err)=>{

      }
    })
  }
  }

  markAllRead(){
    let params = {
      sender:  JSON.parse(localStorage.getItem("loginData"))?._id,
    };

    this.labRadioService.markAllReadNotification(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if(response.status){
        this.ncount = [];
        this.getRealTimeNotification();
        this.getnotificationList();
        this.isViewcount = 0; 
        this.notificationlist = []; 
      }
    })
  }

    markReadById(data: any) {
    if (!data._id) {
      console.error("Notification data is missing or undefined.");
      return;
    }
  
    let params = { _id: data._id };
    this.labRadioService.markReadNotificationById(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
  
      if (response.status) {
        if (
          (data.notitype === null && data.appointmentId) ||
          [
            "New Appointment", "Appointment", "Cancel Appointment",
            "Reshedule Appointment", "Appointment Approved", "Appointment Rejected",
            "Booked Appointment", "Appointment Reminder"
          ].includes(data.notitype)
        ) {
          
         this.router.navigate([`/portals/manage-result/${this.userType}/lab-details/` + data?.appointmentId]);

        } 
        else if (data?.notitype.includes("New Message From")) {  
          let chatId = data.chatId ?? data.content;  
  
          if (chatId) {
            this.router.navigate([`/portals/communication/${this.userType}`], {
              queryParams: { type: chatId }
            });
          }
        } 
        else if (
          ["Order Request", "order request", "Amount Send", "Insurance Verified", "Order Cancelled", "Order Confirmed"]
          .includes(data?.notitype)
        ) {
          this.router.navigate([`/portals/order-request/${this.userType}/new-order-details`], {
            queryParams: {
              orderId: data?.appointmentId
            }
          });
        } 
        else {
          this.router.navigate([`/portals/notification/${this.userType}`]);
        }
      } else {
        console.warn("Failed to mark notification as read.");
      }
  
      this.ncount = [];
      this.getRealTimeNotification();
      this.getnotificationList();
    });
  }

  routeToProfile(){    
    this.router.navigate([`portals/viewProfile/${this.userType}`])
  }
  openVerticallyCentereddetale(info_popup: any) {

    this.modalService.open(info_popup, {
      centered: false, // Centering is set to false
      size: "lg",
      windowClass: 'left-aligned-modal'
    });
  }
}


