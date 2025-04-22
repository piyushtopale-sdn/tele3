import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { WebSocketService } from "src/app/shared/web-socket.service";
import { PatientService } from "../patient.service";
import { FormControl } from "@angular/forms";


interface Pokemon {
  value: string;
  viewValue: string;
}

interface PokemonGroup {
  disabled?: boolean;
  name: string;
  pokemon: Pokemon[];
}
@Component({
  selector: "app-patient-header",
  templateUrl: "./patient-header.component.html",
  styleUrls: ["./patient-header.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PatientHeaderComponent implements OnInit {

  pokemonControl = new FormControl('');
  pokemonGroups: PokemonGroup[] = [
    {
      name: 'Dental',
      pokemon: [
        { value: 'dental_appointment', viewValue: 'Appointment Claim' },
        { value: 'dental_order', viewValue: 'Order Claim' },
      ],
    },
    {
      name: 'Optical',
      pokemon: [
        { value: 'optical_appointment', viewValue: 'Appointment Claim' },
        { value: 'optical_order', viewValue: 'Order Claim' },
      ],
    },
    {
      name: 'Laboratory-Imaging',
      pokemon: [
        { value: 'lab_img_appointment', viewValue: 'Appointment Claim' },
        { value: 'lab_img_order', viewValue: 'Order Claim' },
      ],
    },
    {
      name: 'Paramedical-Professions',
      pokemon: [
        { value: 'para_appointment', viewValue: 'Appointment Claim' },
        { value: 'para_order', viewValue: 'Order Claim' },
      ],
    },
    
  ];

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
  @Input() patient_name: string;
  patient_id: any;
  constructor(
    private auth: AuthService,
    private _coreService: CoreService,
    private _webSocketService: WebSocketService,
    private router: Router,
    private service: PatientService,) {
    this._coreService.SharingMenu.subscribe((res) => {
      if (res != "default") {
        this.menuSelected = res;
      } else {
        this.menuSelected = this._coreService.getLocalStorage("menuTitle");
      }
    });
    this.realTimeNotification();
  }
  realTimeNotification() {
    this._webSocketService.receivedNotificationInfo().subscribe((res: any) => {
      this.getnotificationList();

    });
  }

  ngOnInit(): void {
    let profileData = JSON.parse(localStorage.getItem("profileData"));
    this.patient_id = profileData?.for_portal_user

    if (profileData) {
      this.patientName = profileData?.first_name + " " + profileData?.last_name;
      this.getPersonalDetails();
      this.getnotificationList();

    } else {
      let profileData = JSON.parse(sessionStorage.getItem("adminData"));
      this.patientName = profileData?.first_name + " " + profileData?.last_name;
    }
    let role = this._coreService.getLocalStorage("loginData")?.role;
    if (role) {
      this.isLoggedIn = true;

    }
  }

  logout() {
    this.auth.logout();
  }
  getPersonalDetails() {
    let params = {
      patient_id: this.patient_id,
    };
    this.service.viewPaientPersonalDetails(params).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.profileImage = response?.body?.personalDetails?.profile_pic_signed_url;
      } else {
        this._coreService.showError("", response.message)
      }

    });
  }
  handleRouting(routingFor: any = "") {
    if (routingFor === "Doctor") {
      this.router.navigate(["/patient/homepage/retaildoctor"]);
    } else if (routingFor === "Dental") {
      this.router.navigate(["/patient/homepage/list/Dental"]);
    } else if (routingFor === "Optical") {
      this.router.navigate(["/patient/homepage/list/Optical"]);
    } else if (routingFor === "Laboratory-Imaging") {
      this.router.navigate(["/patient/homepage/list/Laboratory-Imaging"]);
    } else if (routingFor === "Paramedical-Professions") {
      this.router.navigate(["/patient/homepage/list/Paramedical-Professions"]);
    } else if (routingFor === 'pharmacy') {
      this.router.navigate(["/patient/homepage/retailpharmacy"]);
    } else if (routingFor === 'Hospital') {
      this.router.navigate(["/patient/homepage/retailhospital"])
    }    
  }

  // getRealTimeNotification() {
  //   this._webSocketService.receiveNotification().subscribe((res: any) => {
  //     this.ncount.push(res)
  //     this.notify = this.ncount.length;
  //     this.getnotificationList();
  //   })
  // }

  getnotificationList() {
    if(JSON.parse(localStorage.getItem("loginData"))){
      let notifylist = {
        for_portal_user: JSON.parse(localStorage.getItem("loginData"))._id,
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
        }
      }
      );
    }
  }

  changeIsViewStatus() {
    if (this.notiCount > 0) {
      let data = {
        new: false,
        receiverId: JSON.parse(localStorage.getItem("loginData"))._id
      }
      this.service.updateNotificationStatus(data).subscribe({
        next: (res) => {
          let result = this._coreService.decryptContext(res);
          if (result.status) {
            this.notiCount = 0
            this._coreService.showSuccess(result.message, '');
          } else {
            // this._coreService.showError(result.error,'');
          }
        },
        error: (err) => {

        }
      })
    }
  }

  markAllRead() {
    let params = {
      sender: JSON.parse(localStorage.getItem("loginData"))._id,
    };

    this.service.markAllReadNotification(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.ncount = [];
      // this.getRealTimeNotification();
      this.getnotificationList();
    })
  }

  markReadById(data: any) {
    let params = {
      _id: data._id
    };
    this.service.markReadNotificationById(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        if ( data?.notitype == 'Booked Appointment' || data?.notitype == "New Appointment" || data?.notitype == "Appointment" || data?.notitype == "Cancel Appointment" || data?.notitype == "Reshedule Appointment" || data?.notitype == "Appointment Approved" || data?.notitype == "Appointment Rejected") {
          if(data?.created_by_type == 'INDIVIDUAL_DOCTOR' || data?.created_by_type == 'doctor' || data?.created_by_type == 'HOSPITAL_DOCTOR'){
            this.router.navigate(['/patient/myappointment/newappointment'],{
              queryParams:{
                appointmentId:data?.appointmentId
              }
            })
          } else {
            this.router.navigate([`/patient/myappointment/newappointment`], {
              queryParams: {
                appointmentId: data?.appointmentId,
                portal_type: data?.created_by_type
              }
            })
          }
        } else if (data?.notitype == "Insurance Verified" || data?.notitype == "Amount Send") {
          if (data?.created_by_type === 'pharmacy') {
            this.router.navigate([`/patient/presciptionorder/neworder`], {
              queryParams: {
                orderId: data?.appointmentId,
                pharmacyId: data?.created_by
              }
            })
          } else {
            this.router.navigate([`/patient/details-order-request`], {
              queryParams: {
                orderId: data?.appointmentId,
                portal_id: data?.created_by,
                portal_type: data?.created_by_type
              }
            })
          }
        } else if (data?.notitype == "New Result Uploaded") {
          this.router.navigate([`/patient/complete-order-request`], {
            queryParams: {
              orderId: data?.appointmentId,
              portal_id: data?.created_by,
              portal_type: data?.created_by_type
            }
          })
        }else if(data?.notitype == "Appointment Reminder"){
          this.router.navigate([`/patient/waitingroom/calender`], {
            queryParams: {
              appointmentId: data?.appointmentId
            }
          })
        }
      }
      this.ncount = [];
      this.getnotificationList();
    })
  }

}
