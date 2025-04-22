import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { WebSocketService } from "src/app/shared/web-socket.service";
import { PatientService } from "../patient.service";

@Component({
  selector: 'app-patient-notification',
  templateUrl: './patient-notification.component.html',
  styleUrls: ['./patient-notification.component.scss']
})
export class PatientNotificationComponent implements OnInit {
  patientName: any = "";
  // private wesocketService:WebSocketService
  menuSelected: any = "";
  profileImage: any = "";
  isLoggedIn: any = false;
  ncount: any = [];
  notify: any;
  notificationCount: any;
  notificationListt: any;
  userID: string = "";
  notificationData: any;

  notificationlist: any = [];
  notiCount: number = 0;
  isViewcount: number = 0;
  notificationId: any;
  pageSize: number = 5;
  totalLength: number = 0;
  page: any = 1;
  constructor(private auth: AuthService,
    private _coreService: CoreService,
    private _webSocketService: WebSocketService,
    private router: Router,
    private service: PatientService,) { }

  ngOnInit(): void {
    this.getnotificationList();
  }

  getnotificationList() {
    let notifylist = {
      for_portal_user: JSON.parse(localStorage.getItem("loginData"))?._id,
      page: this.page,
      limit: this.pageSize,
    };

    this.service.getAllNotificationService(notifylist).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.notificationlist = response?.body?.list;
        this.notiCount = response?.body?.count;
        this.isViewcount = response?.body?.isViewcount;
        this.totalLength = response?.body?.totalCount;
      }
    }
   );
  }

  markReadById(data: any) {
    let params = {
      _id: data._id
    };
    this.service.markReadNotificationById(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response?.status) {
        if (data?.notitype == "New Appointment" || data?.notitype == "Appointment" || data?.notitype == "Cancel Appointment" || data?.notitype == "Reshedule Appointment" || data?.notitype == "Appointment Approved" || data?.notitype == "Appointment Rejected") {
          if(data?.created_by_type == 'doctor'){
            this.router.navigate(['/patient/myappointment/newappointment'],{
              queryParams:{
                appointmentId:data?.appointmentId
              }
            })
          }else{
            this.router.navigate([`/patient/myappointment/newappointment`],{
              queryParams: {       
                appointmentId:data?.appointmentId,
                portal_type:data?.created_by_type
              }
            })
          }
        }else if(data?.notitype == "Insurance Verified" || data?.notitype =="Amount Send"){
           if(data?.created_by_type === 'pharmacy'){
            this.router.navigate([`/patient/presciptionorder/neworder`],{
              queryParams: {       
                orderId:data?.appointmentId,
                pharmacyId:data?.created_by
              }
            })
           }else{
            this.router.navigate([`/patient/details-order-request`],{
              queryParams: {       
                orderId:data?.appointmentId,
                portal_id:data?.created_by,
                portal_type:data?.created_by_type
              }
            })
          }
        }else if(data?.notitype == "New Result Uploaded"){
          this.router.navigate([`/patient/complete-order-request`],{
            queryParams: {       
              orderId:data?.appointmentId,
              portal_id:data?.created_by,
              portal_type:data?.created_by_type
            }
          })
        }
      }
      this.ncount = [];
      this.getnotificationList();
    })
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getnotificationList();
  }
}
