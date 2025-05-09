import { Component,  Input, OnInit, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { WebSocketService } from "src/app/shared/web-socket.service"
import { IndiviualDoctorService } from "../indiviual-doctor.service"
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-individual-doctor-header",
  templateUrl: "./individual-doctor-header.component.html",
  styleUrls: ["./individual-doctor-header.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class IndividualDoctorHeaderComponent implements OnInit {

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
  pageSize: number = 5;
  totalLength: number = 0;
  page: any = 1;
  chatNoti: any;
  constructor(
    private readonly auth: AuthService, 
    private readonly _coreService: CoreService, 
    private readonly modalService: NgbModal,
    private readonly doctorservice: IndiviualDoctorService, 
    private readonly _webSocketService: WebSocketService,
    private readonly router: Router) {
    this._coreService.SharingMenu.subscribe((res) => {
      if (res != "default") {
        this.menuSelected = res;
      } else {
        this.menuSelected =  localStorage.getItem("menuTitle")
      }
    });
  }

  ngOnInit(): void {


    if (this._coreService.getLocalStorage("loginData")) {
      let role = this._coreService.getLocalStorage("loginData")?.role;
      let adminData = JSON.parse(localStorage.getItem("adminData"));
      let loginData = JSON.parse(localStorage.getItem("loginData"));

      if (role === "INDIVIDUAL_DOCTOR") {
        this.doctorName = loginData?.fullName;
        this.doctorProfile = adminData?.profile_picture;
        this.doctorRole ='Doctor'       
        this.loginId = loginData._id
        this.getDoctorDetails();

      } 
      if (role === "INDIVIDUAL_DOCTOR_STAFF") {
        this.staff_Id = loginData._id
        this.getstaffdetails(this.staff_Id)
        this.doctorRole = 'Staff';

      }
      if (role === "INDIVIDUAL_DOCTOR_ADMIN") {
        this.doctorName = loginData?.fullName;
        this.doctorProfile = adminData?.profile_picture;
        this.doctorRole ='Admin'       
        this.loginId = loginData._id
        this.getDoctorDetails();

      } 
    }
    this.getRealTimeNotification();
    this.getnotificationdata();
  }



  logout() {
    this.doctorservice.userLogoutAPI().subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if(response.status){
        this._coreService.showSuccess("", response.message)
        this.auth.clearStore();
        window.location.href ="/individual-doctor/login";

      }     
    })   
  }

  redirectTo(data: any) {

    if (data?.notitype == "New Appointment" || data?.notitype == "Appointment" || data?.notitype == "Cancel Appointment" || data?.notitype == "Reshedule Appointment" || data?.notitype == "Appointment Reminder") {
      this.router.navigate(['/individual-doctor/appointment/appointmentdetails/' + data?.appointmentId])
    }
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getnotificationdata();
  }
  getnotificationdata() {
    if (JSON.parse(localStorage.getItem("loginData"))) {
      let reqData = {
        for_portal_user: JSON.parse(localStorage.getItem("loginData"))?._id,
        limit: this.pageSize,
        page: this.page,
      }
      this.doctorservice.getnotificationdate(reqData).subscribe((response) => {

        let responsedecrypt = this._coreService.decryptObjectData({ data: response })
        if (responsedecrypt.status) {
          this.isViewcount = responsedecrypt.body.isViewcount;
          if (this.isViewcount === 0) {
            this.notificationlist = [];
          } else {
            this.notificationlist = responsedecrypt.body.list;
          }
          this.notiCount = responsedecrypt.body.count;
        }
      })
    }
  }
  getDoctorDetails() {
    
    this.doctorservice.getDoctorBasicInfo(this.loginId).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.doctorProfile = response?.data?.result[0]?.profile_picture_signed_url;

      } else {
        this._coreService.showError("", response.message)
      }
    });
  }

  getstaffdetails(id: any) {
    let pararm = {
      hospitalStaffId: id,
    };

    this.doctorservice.getStaffDetails(pararm).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });     
           
        if (result.status) {
          this.doctorProfile = result?.body?.in_profile?.profile_picture
        this.doctorName = result?.body?.in_profile?.name;

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
       this.getnotificationdata();
    })
  }


  changeIsViewStatus() {
    if (this.notiCount > 0) {
      let data = {
        new: false,
        receiverId: JSON.parse(localStorage.getItem("loginData"))._id
      }
      this.doctorservice.updateNotificationStatus(data).subscribe({
        next: (res) => {
          let result = this._coreService.decryptContext(res);
          if (result.status) {
            this.notiCount = 0
          }
        },
        error: (err) => {

        }
      })
    }
  }

 

  markAllRead() {
    let params = {
      sender: JSON.parse(localStorage.getItem("loginData"))?._id,
    };
  
    this.doctorservice.markAllReadNotification(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
  
      if (response.status) {
        this.ncount = [];
        this.isViewcount = 0; 
        this.notificationlist = []; // Clear the notifications list
      }
    });
  }
  

  markReadById(data: any) {
    if (!data || !data._id) {
        console.error("Notification data is missing or undefined.");
        return;
    }

    let params = { _id: data._id };
    this.doctorservice.markReadNotificationById(params).subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);

        if (response.status) {
            if (
                (data.notitype === null && data.appointmentId) ||
                ["New Appointment", "Appointment", "Cancel Appointment",
                "Reshedule Appointment", "Appointment Approved", "Booked Appointment", "Appointment Reminder"]
                .includes(data.notitype)
            ) {
                this.router.navigate(['/individual-doctor/appointment/appointmentdetails/', data.appointmentId]);
            } 

            else if (data.notitype && data.notitype.includes("New Message From")) {  
                let chatId = data.chatId ?? data.content;  

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
        this.getRealTimeNotification();
        this.getnotificationdata();
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
  closePopup() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }

}


