import { IndiviualDoctorService } from "../../../individual-doctor/indiviual-doctor.service";
import { CoreService } from "src/app/shared/core.service";
import { ActivatedRoute } from "@angular/router";
import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
@Component({
  selector: "app-retaildoctordetails",
  templateUrl: "./retaildoctordetails.component.html",
  styleUrls: ["./retaildoctordetails.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class RetaildoctordetailsComponent implements OnInit {
  currentRate = 1;
  loginuser_id: any = "";
  doctor_portal_id: any = "";
  doctordetailsData: any = {};
  doctor_availability: any[] = [];
  hospital_location: any[] = [];
  location_id: any = "";
  appointment_type = "";
  doctorRating_Reviwe: any[] = [];
  ratingCount: any = {};
  getAverage: any = {};
  comment: any = "";
  rating: any;
  notAvalible: any = 1;
  doctorAvailableTimeSlot: any[] = [];
  dateForSlot: any = new Date();
  weekDaySlot: any;
  doctor_rating: any;
  reletedDoctorList: any[] = [];
  doctorId: any = "";
  selectedIndex: number = 0;

  pathologyTests:any = [];
  updatedPathologyTests:any = [];

  @ViewChild("loginRequiredWarningModal", { static: false }) loginRequiredWarningModal: any;
  @ViewChild("loginRequiredWarningModalRating", { static: false }) loginRequiredWarningModalRating: any;

  constructor(
    private _IndiviualDoctorService: IndiviualDoctorService,
    private _CoreService: CoreService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) {
    const userData = this._CoreService.getLocalStorage("loginData");
    this.loginuser_id = userData?._id;
  }

  notlogin() {
    this.toastr.error("please login first ");
  }

  ngOnInit(): void {
    window.scroll({
      top: 0,
    });

    this.doctor_portal_id = this.activatedRoute.snapshot.paramMap.get("id");

    this.doctorDetails();

    let tabIndex = parseInt(sessionStorage.getItem("tabIndex"));
    this.selectedIndex = tabIndex;

  }

  handelReviweRating(data: any) {
    if (data.comment) {
      this.comment = data.comment.target.value;
    }
  }

  accepted_insurance_company: any[] = [];
  doctorDetails() {
    let param = { doctor_portal_id: this.doctor_portal_id };

    this._IndiviualDoctorService.doctorDetails(param).subscribe({
      next: (res) => {
        let result = this._CoreService.decryptObjectData({ data: res });

        this.pathologyTests = result.body.pathology_tests;

        const groupedTests = {};

        this.pathologyTests.forEach(test => {
          if (!groupedTests[test.typeOfTest]) {
            groupedTests[test.typeOfTest] = [];
          }
          groupedTests[test.typeOfTest].push(test.nameOfTest);
        });

        this.updatedPathologyTests = Object.keys(groupedTests).map(typeOfTest => {
          return {
            typeOfTest,
            nameOfTests: groupedTests[typeOfTest]
          };
        });


        this.doctorId = result?.body?.data?.doctor_portal_id;
        this.accepted_insurance_company =
          result?.body?.accepted_insurance_company;
          
        this.doctordetailsData = result?.body?.data;
        this.doctor_availability = result.body?.data?.in_availability;
        //this.doctor_availability = result.body?.data?.hospital_location;

        this.hospital_location = result?.body?.data?.hospital_location;
        
        this.appointment_type =
          result?.body?.data?.in_availability[0]?.appointment_type;
        this.location_id = result.body?.data?.in_availability[0]?.location_id;
        this.doctor_rating = result.body?.doctor_rating;
        this.getDoctorRaviweandRating();
        this.doctorAvailableSlot();
        this.weekdaybyloaction(this.location_id, this.appointment_type);
        this.relatedDoctorsList();

      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  weekdaybyloaction(_id: any, type: string) {
  
    // Filter the doctor_availability array based on _id and type
    let weekday = this.doctor_availability.filter(
      (ele) => {
        const matchCondition = ele.location_id === _id && ele.appointment_type === type;
        if (matchCondition) {
        }
        return matchCondition;
      }
    );
  
    // Access the first matching element's week_days array
    this.weekDaySlot = weekday[0]?.week_days[0];
  }
  
  typeSelect(type: any) {

    this.appointment_type = type.type;

    this.weekdaybyloaction(this.location_id, this.appointment_type);
  }
  public onSelection(data: any) {
    if (data.date) {
      this.dateForSlot = new Date(data.date).toISOString();
    } else if (data.type) {
      this.appointment_type = data.type;
    } else {
      this.location_id = data.locationid;
    }

    this.doctorAvailableSlot();
  }
  createOppintment(data: any) {
    if (!this.loginuser_id) {
      this.modalService.open(this.loginRequiredWarningModal, {
        centered: true,
        size: "lg",
        windowClass: "order_medicine",
      });
      // this.toastr.error("please login first ");
    } else {
      this.router.navigate(["/patient/homepage/retailappointmentdetail"], {
        queryParams: data,
      });
    }
  }
  // reviwe and rating get and post
  getDoctorRaviweandRating() {
    let param = {
      // portal_user_id: this.doctor_availability[0]?.for_portal_user,
      portal_user_id: this.doctorId,
      page: 1,
      limit: 10,
      reviewBy: 'patient'
    };

    this._IndiviualDoctorService.getDoctorReviweAndRating(param).subscribe({
      next: (res) => {
        let result = this._CoreService.decryptObjectData({ data: res });
        // this.doctorRating_Reviwe = result?.body?.ratingArray
        this.ratingCount = result?.body?.ratingCount;
        this.getAverage = parseFloat(
          result?.body?.getAverage?.average_rating
        ).toFixed(1);
        let data = [];
        for (let reviwe of result?.body?.ratingArray) {
          data.push({
            rating: reviwe.rating,
            comment: reviwe.comment,
            patientName: reviwe.patientName,
            date: this._CoreService.createDate(new Date(reviwe.createdAt))
              ? this._CoreService.createDate(new Date(reviwe.createdAt))
              : "NA",
            firsttlatterofname: this.getShortName(
              reviwe.patientName ? reviwe.patientName : "shivam"
            ),
          });
        }
        this.doctorRating_Reviwe = data;

      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  getShortName(fullName: any) {

    return fullName?.full_name
      .split(" ")
      .map((n) => n[0])
      .join("");
  }
  //  Review modal
  openVerticallyCenteredreview(reviewcontent: any) {
    this.modalService.open(reviewcontent, {
      centered: true,
      size: "md",
      windowClass: "review",
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
  postRatingAndReviwe() {
    const userData = this._CoreService.getLocalStorage("loginData");
    if (!userData) {
      this.modalService.open(this.loginRequiredWarningModalRating, {
        centered: true,
        size: "lg",
        windowClass: "order_medicine",
      });
      // this._CoreService.showError("Please login first", " ")
      return
    }

    let pararm = {
      for_portal_user: this.doctor_availability[0].for_portal_user,

      patient_login_id: this.loginuser_id,
      rating: this.currentRate,
      comment: this.comment,
      reviewBy: 'patient',
      reviewTo: 'doctor'
    };

    this._IndiviualDoctorService.DoctorReviweandRating(pararm).subscribe({
      next: (res) => {
        let result = this._CoreService.decryptObjectData({ data: res });
        this.toastr.success(result.message);
        this.getDoctorRaviweandRating();
        this.closePopup();
      },

      error: (err) => {
        console.log(err);
      },
    });
  }
  closePopup() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }
  doctorAvailableSlot() {
    let param = {
      locationId: this.location_id,
      appointmentType: this.appointment_type,
      timeStamp: this.dateForSlot,
      doctorId: this.doctor_availability[0]?.for_portal_user,
    };

    // let param = { "locationId": "63d3cb116ef0c91c772e4627", "appointmentType": "ONLINE", "timeStamp": "2023-02-17T10:00:00.000Z", "doctorId": "63e0bc33f15a27adc67cc733" }
    this._IndiviualDoctorService.doctorAvailableSlot(param).subscribe({
      next: (res) => {
        let result = this._CoreService.decryptObjectData({ data: res });
        this.doctorAvailableTimeSlot = result.body.allGeneralSlot;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  relatedDoctorsList() {
    let param = {
      speciality: this.doctordetailsData?.speciality_id,
      current_doctor_id: this.doctor_portal_id,
      limit: 3,
    };

    this._IndiviualDoctorService.relatedDoctors(param).subscribe({
      next: (res) => {
        let result = this._CoreService.decryptObjectData({ data: res });
        this.reletedDoctorList = result.data.result;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  adjustRatingStar(rating) {
    let roundedNum = Math.floor(rating);
    return roundedNum;
  }
  public handleBtnClick() {
    localStorage.setItem("status","true")
    this.modalService.dismissAll();
    this.router.navigate(["/patient/login"]);
  }

  redirectRetaildoctordetail(_id: any) {
    const url = `/patient/homepage/retaildoctordetail/${_id}`;
    window.location.href = url;
  }

  formatTime(time) {
    // Check if time is defined and has four digits
    if (time && /^\d{4}$/.test(time)) {
      const hours = parseInt(time.substring(0, 2), 10);
      const minutes = time.substring(2);
  
      if (hours >= 0 && hours <= 11) {
        // Convert to 12-hour format with AM
        const period = "AM";
        const formattedMinutes = minutes || "00";
        return `${hours}:${formattedMinutes} ${period}`;
      } else if (hours >= 12 && hours <= 23) {
        // Convert to 12-hour format with PM
        const formattedHours = hours === 12 ? 12 : hours - 12;
        const period = "PM";
        const formattedMinutes = minutes || "00";
        return `${formattedHours}:${formattedMinutes} ${period}`;
      }
    }
  
    return time; // Return the original time if it doesn't match the expected format
  }
  

  getDirection(direction : any) {
    if (!direction)
    {
      this.toastr.error("Location coordinates not found")
      return 
    }
    const lat = direction[1];
    const lng = direction[0];
    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(mapUrl, "_blank");
    
  }

}
