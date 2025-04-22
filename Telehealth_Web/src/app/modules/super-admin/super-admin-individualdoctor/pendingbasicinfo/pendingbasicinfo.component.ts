import { SuperAdminIndividualdoctorService } from "./../../super-admin-individualdoctor.service";
import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute } from "@angular/router";
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { Router } from "@angular/router";
import { SuperAdminService } from "../../super-admin.service";

@Component({
  selector: "app-pendingbasicinfo",
  templateUrl: "./pendingbasicinfo.component.html",
  styleUrls: ["./pendingbasicinfo.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PendingbasicinfoComponent implements OnInit {
  superAdminId: any = "";
  doctorId: any = "";
  doctorDetails: any;
  availability: any = null;


  profileDetails: any;
  profileImage: any = "";

  availabilityArray: any;
  subscriptionPlans: any = [];
  locationData: any;
  inHospitalLocations: any = [];
  country: any = "";
  appointmenType: any = "ONLINE";
  selected: any = "ONLINE";
  team: any;
  locationList: any;
  selected_hospitalLocation: any = "";
  selectedData: any;
  feeDetails: any;
  verifyStatus: any;
  hospitalId: any;
  innerMenuPremission: any = [];
  loginrole: any;
  specialityValue: any;
  designation: any;
  title: any;
  slot_interval_time: any;
  unavaliabledate_time: any;
  categoriesValue: any;
  constructor(
    private modalService: NgbModal,
    private activatedRoute: ActivatedRoute,
    private doctorService: SuperAdminIndividualdoctorService,
    private coreService: CoreService,
    private toastr: ToastrService,
    private route: Router,
    private sadminService: SuperAdminService,
  ) {
    this.loginrole = this.coreService.getLocalStorage("adminData").role;
  }

  ngOnInit(): void {
    let paramId = this.activatedRoute.snapshot.paramMap.get("id");
    this.doctorId = paramId;
    let adminData = JSON.parse(localStorage.getItem("loginData"));
    this.superAdminId = adminData?._id;
    this.getDoctorDetails();

    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 300);
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission() {
    let userPermission = this.coreService.getLocalStorage("adminData").permissions;
    let menuID = sessionStorage.getItem("currentPageMenuID");
    if (userPermission) {

      let checkData = this.findObjectByKey(userPermission, "parent_id", menuID)
      if (checkData) {
        if (checkData.isChildKey == true) {
          var checkSubmenu = checkData.submenu;
          if (checkSubmenu.hasOwnProperty("pharmacy")) {
            this.innerMenuPremission = checkSubmenu['pharmacy'].inner_menu;
          }
        } else {
          var checkSubmenu = checkData.submenu;
          let innerMenu = [];
          for (let key in checkSubmenu) {
            innerMenu.push({ name: checkSubmenu[key].name, slug: key, status: true });
          }
          this.innerMenuPremission = innerMenu;
        }
      }
    }
  }

  giveInnerPermission(value) {
    if (this.loginrole === 'STAFF_USER') {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    } else {
      return true;
    }
  }


  getDoctorDetails() {
    this.doctorService.getDoctorDetails(this.doctorId).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });            
      
      if(response.status){
        this.profileDetails = response?.data?.result[0];
        this.specialityValue = response?.data?.specilizationValues;
        this.categoriesValue = response?.data?.categories;
        this.profileImage = response?.data?.result[0]?.profile_picture_signed_url;
        this.availabilityArray = response?.data?.availabilityArray;
        this.getDesignationList(response?.data?.result[0]?.designation)
        response?.data?.availabilityArray.forEach((element) => {
          // if (element.appointment_type === this.appointmenType) {
            this.slot_interval_time = element.slot_interval;
            this.unavaliabledate_time = element.unavailability_slot;
            this.arrangAvailability(element?.week_days);
            this.handleSelectAvailabilty();
          // }
        });
      }      
    });
  }

  getDesignationList(_id: any) {
    this.sadminService.getByIdDesignation(_id).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        this.designation = result?.body?.list[0]?.designation;

      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  closePopup() {
    this.modalService.dismissAll("close");
  }

  handleSelectAvailabilty() {
    let obj: any;
    this.appointmenType = 'ONLINE';

    this.availabilityArray.forEach((element) => {
      if (
        element.appointment_type === 'ONLINE'
      ) {
        this.arrangAvailability(element?.week_days);
      }
    });
  }


  arrangAvailability(weekArray: any) {
    let Sun = [];
    let Mon = [];
    let Tue = [];
    let Wed = [];
    let Thu = [];
    let Fri = [];
    let Sat = [];
    weekArray.forEach((element) => {
      let data = this.arrangeWeekDaysForPatch(element);
      Sun.push({
        start_time: data?.sun_start_time,
        end_time: data?.sun_end_time,
      });
      Mon.push({
        start_time: data?.mon_start_time,
        end_time: data?.mon_end_time,
      });
      Tue.push({
        start_time: data?.tue_start_time,
        end_time: data?.tue_end_time,
      });
      Wed.push({
        start_time: data?.wed_start_time,
        end_time: data?.wed_end_time,
      });
      Thu.push({
        start_time: data?.thu_start_time,
        end_time: data?.thu_end_time,
      });
      Fri.push({
        start_time: data?.fri_start_time,
        end_time: data?.fri_end_time,
      });
      Sat.push({
        start_time: data?.sat_start_time,
        end_time: data?.sat_end_time,
      });
    });

    let obj = {
      Sun: Sun,
      Mon: Mon,
      Tue: Tue,
      Wed: Wed,
      Thu: Thu,
      Fri: Fri,
      Sat: Sat,
    };
    this.availability = obj;
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  //  Approved modal
  openVerticallyCenteredapproved(approved: any) {
    this.modalService.open(approved, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
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


  arrangeWeekDaysForPatch(element: any) {
    let wkD = {
      sun_start_time:
        element.sun_start_time.slice(0, 2) +
        ":" +
        element.sun_start_time.slice(2, 4),

      sun_end_time:
        element.sun_end_time.slice(0, 2) +
        ":" +
        element.sun_end_time.slice(2, 4),

      mon_start_time:
        element.mon_start_time.slice(0, 2) +
        ":" +
        element.mon_start_time.slice(2, 4),

      mon_end_time:
        element.mon_end_time.slice(0, 2) +
        ":" +
        element.mon_end_time.slice(2, 4),

      tue_start_time:
        element.tue_start_time.slice(0, 2) +
        ":" +
        element.tue_start_time.slice(2, 4),

      tue_end_time:
        element.tue_end_time.slice(0, 2) +
        ":" +
        element.tue_end_time.slice(2, 4),

      wed_start_time:
        element.wed_start_time.slice(0, 2) +
        ":" +
        element.wed_start_time.slice(2, 4),

      wed_end_time:
        element.wed_end_time.slice(0, 2) +
        ":" +
        element.wed_end_time.slice(2, 4),

      thu_start_time:
        element.thu_start_time.slice(0, 2) +
        ":" +
        element.thu_start_time.slice(2, 4),

      thu_end_time:
        element.thu_end_time.slice(0, 2) +
        ":" +
        element.thu_end_time.slice(2, 4),

      fri_start_time:
        element.fri_start_time.slice(0, 2) +
        ":" +
        element.fri_start_time.slice(2, 4),

      fri_end_time:
        element.fri_end_time.slice(0, 2) +
        ":" +
        element.fri_end_time.slice(2, 4),

      sat_start_time:
        element.sat_start_time.slice(0, 2) +
        ":" +
        element.sat_start_time.slice(2, 4),

      sat_end_time:
        element.sat_end_time.slice(0, 2) +
        ":" +
        element.sat_end_time.slice(2, 4),
    };

    return wkD;
  }

  checkForExpiry = (expiry_date: any) => {
    let d = new Date();
    var g1 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    // (YYYY, MM, DD)
    let statusData;
    var g2 = new Date(expiry_date);
    if (g1.getTime() < g2.getTime()) statusData = "active";
    else if (g1.getTime() > g2.getTime()) statusData = "expired";

    // this.globalStatus = statusData;
    return statusData;
  };

  backpage() {
    this.route.navigate(["/super-admin/individualdoctor"]);
  }

  returnWithAmPm(data: any) {
    if (!data) return "Invalid time";
    let timeStr = data.toString(); 
    if (timeStr.length === 4) {
      return timeStr.slice(0, 2) + ":" + timeStr.slice(2, 4); 
    }
  
    return timeStr; 
  }
}
