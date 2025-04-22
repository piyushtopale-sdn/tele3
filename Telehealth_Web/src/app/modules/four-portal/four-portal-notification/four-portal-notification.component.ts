import { Component, OnInit} from "@angular/core";
import { Router } from "@angular/router";
import { CoreService } from "src/app/shared/core.service";
import { FourPortalService } from "../four-portal.service";

@Component({
  selector: 'app-four-portal-notification',
  templateUrl: './four-portal-notification.component.html',
  styleUrls: ['./four-portal-notification.component.scss']
})
export class FourPortalNotificationComponent implements OnInit {

  userName: any = "";
  menuSelected = "";
  userProfile: any = "";
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
  constructor( private _coreService: CoreService,  private fouePortalService: FourPortalService,  private router: Router) { 

    let type = localStorage.getItem("type");
    this.userType = type;
  }

  ngOnInit(): void {
    this.getnotificationList();
  }

  getnotificationList() {
    let notifylist = {
      for_portal_user: JSON.parse(localStorage.getItem("loginData"))?._id,
      page: this.page,
      limit: this.pageSize,
    };
    
    this.fouePortalService.getAllNotificationService(notifylist).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);      
      if(response.status)
     {
      this.notificationlist=response.body.list;
      this.notiCount = response.body.count;
      this.isViewcount = response.body.isViewcount; 
      this.totalLength = response.body.totalCount; 
     }
    }
    );
  }


  // markReadById(data:any){
  //   let params = {
  //     _id:data?._id
  //   };
  //   this.fouePortalService.markReadNotificationById(params).subscribe((res: any) => {
  //     let encryptedData = { data: res };
  //     let response = this._coreService.decryptObjectData(encryptedData);

  //     if (response.status) {
  //       if (data?.notitype == 'chat') {
  //          this.router.navigate([`/portals/communication/${this.userType}`], {
  //          queryParams: {
  //          type: data.chatId
  //         }
  //       })
  //       }else if(data?.notitype == "New Appointment" || data?.notitype == "Appointment" || data?.notitype == "Cancel Appointment" || data?.notitype == "Reshedule Appointment" || data?.notitype == "Appointment Approved" || data?.notitype == "Appointment Rejected" || data?.notitype == "Booked Appointment"){

  //         this.router.navigate([`/portals/appointment/${this.userType}/appointment-details/`+ data?.appointmentId])

  //       }else if(data?.notitype == "Order Request" || data?.notitype == "order request" || data?.notitype == "Amount Send" || data?.notitype == "Insurance Verified" || data?.notitype == "Order Cancelled" || data?.notitype == "Order Confirmed"){
  //         this.router.navigate([`/portals/order-request/${this.userType}/new-order-details`],{
  //           queryParams:{
  //             orderId:data?.appointmentId
  //           }
  //         })
  //       }else{
  //         this.router.navigate([`/portals/notification/${this.userType}`])
  //       }
  //     }

  //     this.ncount = [];
  //     this.getnotificationList();
  //   })
  // }


  markReadById(data: any) {
    if (!data || !data._id) {
      console.error("Notification data is missing or undefined.");
      return;
    }
  
    let params = { _id: data._id };
    this.fouePortalService.markReadNotificationById(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
  
      if (response.status) {
        let notifyType = data?.notitype || ""; // Ensure notifyType is not null or undefined
        let appointmentId = data?.appointmentId;
  
        if (
          !notifyType || // If notifyType is empty/null/undefined, still proceed
          ["New Appointment", "Appointment", "Cancel Appointment", "Reschedule Appointment", 
           "Appointment Approved", "Appointment Rejected", "Booked Appointment"]
          .includes(notifyType)
        ) {
          if (this.userType === "Radiology") {
            this.router.navigate([`/portals/manage-result/${this.userType}/radio-details/${appointmentId}`]);
          } 
          else if (this.userType === "Laboratory") {
            this.router.navigate([`/portals/manage-result/${this.userType}/lab-details/${appointmentId}`]);
          }
        } 
        else {
          this.router.navigate([`/portals/notification/${this.userType}`]);
        }
      }
  
      // Refresh notification count and list
      this.ncount = [];
      this.getnotificationList();
    });
  }
  
  
  

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getnotificationList();
  }
}
