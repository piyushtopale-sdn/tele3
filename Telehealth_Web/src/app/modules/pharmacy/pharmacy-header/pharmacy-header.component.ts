
import { ActivatedRoute, Router } from '@angular/router';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/shared/auth.service';
import { CoreService } from 'src/app/shared/core.service';
import { PharmacyService } from '../pharmacy.service';
import { WebSocketService } from 'src/app/shared/web-socket.service';


@Component({
  selector: 'app-pharmacy-header',
  templateUrl: './pharmacy-header.component.html',
  styleUrls: ['./pharmacy-header.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PharmacyHeaderComponent implements OnInit, OnDestroy {
  profileSubcription: Subscription;
  username: string;
  profile: string = "";
  staff_profile: string = "";

  @Input() details: any;
  sharingdata: any;
  isLoggedIn: boolean = true;
  userRole: any;
  staffName: any;
  staffProfileUrl: any;
  staffId: any;

  menuSelected: any = '';
  menuSubscription: Subscription;
  loginLogo: any = '';
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
  admin_id: any;
  pageSize: number = 0;
  page: any = 1;
  constructor(private auth: AuthService, private _coreService: CoreService, private router: Router,
    private _webSocketService: WebSocketService,
    private _pharmacyService: PharmacyService,
    private route: ActivatedRoute,) {


    if (this._coreService.getLocalStorage('loginData')) {
      this.isLoggedIn = true
      if (this._coreService.getLocalStorage('loginData').role === "PHARMACY_ADMIN") {

        let loginData = JSON.parse(localStorage.getItem("loginData"));
        this.username = loginData?.pharmacy_name;
        this.userRole = 'Pharmacy'
        this.admin_id = loginData?._id;
        this.getProfileDetails(this.admin_id)


      } else if (this._coreService.getLocalStorage('loginData').role === "PHARMACY_STAFF") {

        let adminData = JSON.parse(localStorage.getItem("adminData"));
        let loginData = JSON.parse(localStorage.getItem("loginData"));
        this.staffName = adminData?.staff_name;
        this.userRole = loginData?.role.replace(/_/g, ' ')
        this.staffId = loginData?._id
        this.getSpecificStaffDetails(this.staffId)

      }
    } 

    this.realTimeNotification();

    this.getRealTimeNotification();

  }
  realTimeNotification() {
    this._webSocketService.receivedNotificationInfo().subscribe((res: any) => {
      if (this._coreService.getLocalStorage('loginData')) {
        this.getnotificationList();
      }

    });
  }
  ngOnInit(): void {
    if (this._coreService.getLocalStorage('loginData')) {
      // this.getnotificationList();
    }
  }

  logout() {
    this._pharmacyService.logOutUserApi().subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this._coreService.showSuccess("", response.message)
        this.auth.logout("/pharmacy/login");
      }
    })
  }
  getSpecificStaffDetails(id) {
    try {

      let userId = id
      this._pharmacyService.getStaffDetails(id).subscribe((result: any) => {
        const staffDetails = this._coreService.decryptObjectData(result);
        let details = staffDetails.data.staffInfo[0];
        const documentInfo = staffDetails?.data?.documentURL
        this.profile = documentInfo
      })
    } catch (e) {
      throw e
    }
  }
  getProfileDetails(id) {

    let reqdata = {
      userId: id
    }
    this._pharmacyService.viewProfile(reqdata).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res }); 
      this.profile = response?.data?.adminData?.profile_picture_signed_url;
    });
  }

  ngOnDestroy(): void {


    if (this.profileSubcription) {
      this.profileSubcription.unsubscribe();
    }

    // this._coreService.SharingData.
  }


  getRealTimeNotification() {
    this._webSocketService.receiveNotification().subscribe((res: any) => {
      this.ncount.push(res)
      this.notify = this.ncount.length;
      this.getnotificationList();
    })
  }

  getnotificationList() {
    this.userID = this._coreService.getLocalStorage('loginData')?._id;
    let notifylist = {
      for_portal_user: this.userID,
      page: this.page,
      limit: this.pageSize,
    };
    this._pharmacyService.getAllNotificationService(notifylist).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.notificationlist = response.body.list;
        this.notiCount = response.body.count;
        this.isViewcount = response.body.isViewcount;
      }
    }
    );
  }

  changeIsViewStatus() {
    if (this.notiCount > 0) {
      let data = {
        new: false,
        receiverId: JSON.parse(localStorage.getItem("loginData"))?._id
      }
      this._pharmacyService.updateNotificationStatus(data).subscribe({
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
      sender: this._coreService.getLocalStorage('loginData')._id,
    };

    this._pharmacyService.markAllReadNotification(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.ncount = [];
      this.getRealTimeNotification();
      this.getnotificationList();
    })
  }

  markReadById(data: any) {
    let params = {
      _id: data._id
    };
    this._pharmacyService.markReadNotificationById(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        if (data?.notitype === "chat") {
          this.router.navigate(['/pharmacy/communication'], {
            queryParams: {
              type: data.chatId,
            },
          })
        } else if (data?.notitype === "medicine_availability_request") {
          // this.router.navigate([`/pharmacy/medicinerequest/newavailability?orderId=${data.appointmentId}`]);
          this.router.navigate([`/pharmacy/medicinerequest/newavailability`], { queryParams: { orderId: data.appointmentId } });
        } else if (data?.notitype === "order_request") {
          this.router.navigate([`/pharmacy/presciptionorder/neworder`], {
            queryParams: {
              orderId: data.appointmentId
            }
          });
        } else if (data?.notitype === "medicine_price_request") {
          // this.router.navigate([`/pharmacy/medicinepricerequest/newprice?orderId=${data.appointmentId}`]);
          this.router.navigate([`/pharmacy/medicinepricerequest/newprice`], {
            queryParams: {
              orderId: data.appointmentId
            }
          });
        }
      }
      this.ncount = [];
      this.getRealTimeNotification();
      this.getnotificationList();
    })
  }

}
