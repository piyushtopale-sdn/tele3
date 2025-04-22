import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CoreService } from "../core.service";
import { WebSocketService } from "src/app/shared/web-socket.service";
import { IndiviualDoctorService } from "../../modules/individual-doctor/indiviual-doctor.service";

@Component({
  selector: "app-external-video-call",
  templateUrl: "./external-video-call.component.html",
  styleUrls: ["./external-video-call.component.scss"],
})

export class ExternalVideoCallComponent implements OnInit {
  appointment_id: any = "";
  loggedInUserName: any = "";
  portaltype = "doctorguest";
  callby = "external";
  roomName = "";
  response: any = "";
  details;
  startcall: any = false;
  authToken: any = "";
  portal_type = "";
  showBox = false;
  
  constructor(
    private coreservice: CoreService,
    private doctorservice: IndiviualDoctorService,
    private websocket: WebSocketService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.activatedRoute.queryParams.subscribe((param: any) => {
      let res = atob(param['id']);
      this.appointment_id = res;
      this.portal_type = param['portal'] ? param['portal'] : "";
    });
  }

  joincall() {
    if (this.loggedInUserName != "") {
      this.doctorservice.createGuestUser(this.loggedInUserName).subscribe(async (res) => {
          let guestresponse = await this.coreservice.decryptObjectData({ data: res });
          if (guestresponse.status) {
            // sessionStorage.setItem("guesttoken",)
            this.doctorservice
              .viewAppointmentDetailsbyroomname(this.appointment_id, guestresponse?.body.token, this.portal_type)
              .subscribe(
                async (res) => {
                  let response = await this.coreservice.decryptObjectData({
                    data: res,
                  });
                  localStorage.setItem("token", guestresponse?.body.token);
                  this.roomName = response?.data?.roomdetails?.roomName
                  this.details = {
                    name: this.loggedInUserName,
                    ownname: this.loggedInUserName,
                    image: "",
                    chatId: this.appointment_id,
                    roomName: this.roomName,
                    token: guestresponse?.body.token,
                    authtoken: this.authToken,
                    type: "video",
                    isGroup: true,
                    loggedInUserId: guestresponse?.body._id,
                    portal_type: this.portal_type
                  };
                  this.startcall = true;
                })
          } else {
            this.coreservice.showError("Please Enter Name", "");
          }
        });
    } else {
      this.coreservice.showError("Please Enter Name", "");
    }
  }

  ngOnInit(): void {
    this.doctorservice
      .viewAppointmentCheck(this.appointment_id, this.portal_type)
      .subscribe((res) => {
        if (res.status) {
          this.showBox = true;
        } else {
          this.showBox = false
        }
      }, (err) => {
        this.showBox = false
      });
  }
}
