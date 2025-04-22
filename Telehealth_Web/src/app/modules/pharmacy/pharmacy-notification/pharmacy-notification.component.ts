import { ActivatedRoute, Router } from '@angular/router';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/shared/auth.service';
import { CoreService } from 'src/app/shared/core.service';
import { PharmacyService } from '../pharmacy.service';
import { WebSocketService } from 'src/app/shared/web-socket.service';

@Component({
  selector: 'app-pharmacy-notification',
  templateUrl: './pharmacy-notification.component.html',
  styleUrls: ['./pharmacy-notification.component.scss']
})
export class PharmacyNotificationComponent implements OnInit {
  username: string;
  profile: string = "";
  staff_profile: string = "";

  sharingdata: any;
  isLoggedIn: boolean = true;
  userRole: any;
  staffName: any;
  staffProfileUrl: any;

  menuSelected: any = '';
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
  pageSize: number = 5;
  totalLength: number = 0;
  page: any = 1;
  constructor(private auth: AuthService, private _coreService: CoreService, private router: Router,
    private _webSocketService: WebSocketService,
    private _pharmacyService: PharmacyService,
    private route: ActivatedRoute,) { }

  ngOnInit(): void {
    this.getnotificationList();
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
        this.notificationlist = response?.body?.list;
        this.notiCount = response?.body?.count;
        this.isViewcount = response?.body?.isViewcount;
        this.totalLength= response?.body?.totalCount
      }
    }
    );
  }

  markReadById(data: any) {
    let params = {
      _id: data._id
    };
    this._pharmacyService.markReadNotificationById(params).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if(response.status){
        if(data?.notitype === "chat"){
          this.router.navigate(['/pharmacy/communication'], {
            queryParams: {
              type: data.chatId,
            },
          })
        }else if(data?.notitype === "medicine_availability_request"){
          this.router.navigate([`/pharmacy/medicinerequest/newavailability?orderId=${data.appointmentId}`]);
        }else if(data?.notitype === "order_request"){
          this.router.navigate([`/pharmacy/presciptionorder/neworder`],{
            queryParams: {       
              orderId:data.appointmentId
            }
          });
        }else if(data?.notitype === "medicine_price_request"){
          this.router.navigate([`/pharmacy/medicinepricerequest/newprice?orderId=${data.appointmentId}`]);
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
