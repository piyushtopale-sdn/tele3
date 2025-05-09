import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormControl,
  AbstractControl,
} from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { MatStepper } from "@angular/material/stepper";
import * as moment from "moment";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { IndiviualDoctorService } from '../../../../individual-doctor/indiviual-doctor.service';
import { DatePipe } from "@angular/common";
import { DateAdapter } from '@angular/material/core';
@Component({
  selector: "app-availability",
  templateUrl: "./availability.component.html",
  styleUrls: ["./availability.component.scss"],
})
export class AvailabilityComponent implements OnInit {
  @Output() fromChild = new EventEmitter<string>();
  @Input() public mstepper: MatStepper;
  @Output() callParent = new EventEmitter<void>();

  timeInterval = [
    { label: '5 min', value: '5' },
    { label: '10 min', value: '10' },
    { label: '15 min', value: '15' },
    { label: '20 min', value: '20' },
    { label: '25 min', value: '25' },
    { label: '30 min', value: '30' },
    { label: '35 min', value: '35' },
    { label: '40 min', value: '40' },
    { label: '45 min', value: '45' },
    { label: '50 min', value: '50' },
    { label: '55 min', value: '55' },
    { label: '60 min', value: '60' },

  ]
  hospitalId: any = "";
  hospitalName: any = "";
  availabilityFormOnline: any = FormGroup;
  availabilityFormHomeVisit: any = FormGroup;
  availabilityFormClinic: any = FormGroup;
  isSubmitted: any = false;
  seletectedLocation: any = "";
  selectedLocationId: any = "";
  pageForAdd: any = true;
  availability: any;
  doctorId: any = "";
  getLoactionData: any;

  stepper: any;
  passToChild: any = {};

  onlineExitingIds: any = '';
  f2fExistingIds: any = '';
  homeVisitExistingIds: any = '';
  shouldContinue: boolean = true;
  profileResponse: any;

  constructor(
    private toastr: ToastrService,
    private service: IndiviualDoctorService,
    private sadminService: SuperAdminService,
    private coreService: CoreService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private loader: NgxUiLoaderService,
    private router: Router,
    private datepipe : DatePipe,
    private dateAdapter: DateAdapter<Date>,
  ) {
    this.availabilityFormOnline = this.fb.group({
      weekDays: this.fb.array([]),
      availability: this.fb.array([]),
      unAvailability: this.fb.array([]),
      bookingSlot: ["", [Validators.required]],
    });

    this.availabilityFormHomeVisit = this.fb.group({
      weekDays: this.fb.array([]),
      availability: this.fb.array([]),
      unAvailability: this.fb.array([]),
      bookingSlot: ["", [Validators.required]],
    });

    this.availabilityFormClinic = this.fb.group({
      weekDays: this.fb.array([]),
      availability: this.fb.array([]),
      unAvailability: this.fb.array([]),
      bookingSlot: ["", [Validators.required]],
    });
  }
  fromParent: any;
  ngOnInit(): void {
    this.fromParent = this.mstepper;    
    let paramId = this.activatedRoute.snapshot.paramMap.get("id");
    if (paramId === null) {
      this.pageForAdd = true;
      this.addNewWeek("all");
      this.addNewAvailabilty("all");
      this.addNewUnAvailabilty("all");
      let getId = sessionStorage.getItem("doctorId");
      this.doctorId = getId;      
      this.stepper = this.mstepper;
    } else {
      this.pageForAdd = false;
      this.doctorId = paramId;
      this.getDoctorDetails(this.mstepper);
    }
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    let adminData = JSON.parse(localStorage.getItem("adminData"));
    this.hospitalId = loginData?._id;
    this.hospitalName = adminData?.hospital_name;
  }

  getDoctorDetails(fromParent: any) {
    let response = fromParent?.response;
    this.profileResponse = fromParent?.response?.result
    this.stepper = fromParent?.mainStepper;
    this.availability = response?.data?.availabilityArray;
    this.patchValues(this.availability);
  }p

  patchValues(element: any) {
    let onlineMode: any = {};
    let homeVistMode: any = {};
    let clinicMode: any = {};

    this.onlineExitingIds = '';
    this.homeVisitExistingIds = '';
    this.f2fExistingIds = '';

    if (element.length != 0) {
      this.clearHnadler();
      element?.forEach((data) => {

        onlineMode = data;
        this.onlineExitingIds = data?._id;

      });

      //online mode
      if (Object.keys(onlineMode).length != 0) {
        onlineMode?.week_days.forEach((element) => {
          this.addNewWeek("online");
        });
        onlineMode?.unavailability_slot.forEach((element) => {
          this.addNewUnAvailabilty("online");
        });

        let arrangedWeekDaysOnline = [];
        let arrangedUnAvlOnline = [];

        onlineMode.week_days.forEach((element) => {
          let obj = this.arrangeWeekDaysForPatch(element);
          arrangedWeekDaysOnline.push(obj);
        });


        onlineMode.unavailability_slot.forEach((element) => {
          let obj = this.arrangeUnavlAndAvlForPatch({
            start_time: element.start_time,
            end_time: element.end_time,
          });
          arrangedUnAvlOnline.push({
            date: element.date,
            start_time: obj.start_time,
            end_time: obj.end_time,
          });
        });

        this.availabilityFormOnline.patchValue({
          weekDays: arrangedWeekDaysOnline,
          unAvailability: arrangedUnAvlOnline,
          bookingSlot: onlineMode?.slot_interval,
        });
      } else {
        this.addNewWeek("online");
        this.addNewUnAvailabilty("online");
      }


    } else {
      this.availabilityFormOnline.reset();

      this.clearHnadler();
      this.addNewWeek("online");
      this.addNewUnAvailabilty("online");
    }

  }
  clearHnadler() {
    this.weekDaysOnline.clear();


    this.availabilityOnline.clear();


    this.unAvailabilityOnline.clear();

  }
  saveAvailability() {
    this.isSubmitted = true;
    if (
      this.availabilityFormOnline.invalid
    ) {
      window.scroll({
        top: 0,
      });
      this.toastr.error("Please fill all required fields")
      return;
    }
    this.isSubmitted = false;
    let weekArrayOnline: any = [];
    let avlOnline = [];
    let unAvlOnline = [];

    this.availabilityFormOnline.value.weekDays.forEach((element) => {
      let obj = this.arrangeWeekDaysForRequest(element);
      if (this.shouldContinue) {
        weekArrayOnline.push(obj);
      } else {
        return
      }
    });

    this.availabilityFormOnline.value.availability.forEach((element) => {
      let time = this.arranageUnavAndAvlForRequest({
        start_time: element.start_time,
        end_time: element.end_time,
      });

      avlOnline.push({
        date: element.date,
        start_time: time.start_time,
        end_time: time.end_time,
      });
    });

    this.availabilityFormOnline.value.unAvailability.forEach((element) => {
      let time = this.arranageUnavAndAvlForRequest({
        start_time: element.start_time,
        end_time: element.end_time,
      });
    
      let date = this.formatDate(element.date);
        unAvlOnline.push({
          date: date,
          start_time: time.start_time,
          end_time: time.end_time,
        });
      }
    );

    //-------------Online Type--------------------------
    let appointmenTypeOnline = {
      week_days: weekArrayOnline,
      unavailability_slot: unAvlOnline,
      slot_interval: this.availabilityFormOnline.value.bookingSlot,
      existingIds: this.onlineExitingIds
    };

    let doctorAvailabilityArray = [
      appointmenTypeOnline,
    ];
    this.loader.start();

    let reqData = {
      doctor_availability: doctorAvailabilityArray,
      portal_user_id: this.doctorId,
      
    };

    if (this.shouldContinue === true) {
      this.service.doctorAvailability(reqData).subscribe(
        (res) => {
          let response = this.coreService.decryptObjectData({ data: res });
          if (response.status) {
            this.loader.stop();
            this.toastr.success(response.message);
            this.callParent.emit()

            // if (isNext === 'yes') {
            if (this.pageForAdd) {
              this.fromChild.emit("availabilty");
            } else {
              this.stepper.next();
            }
            // }

          } else {
            this.loader.stop();
          }
        },
        (err) => {
          let errResponse = this.coreService.decryptObjectData({
            data: err.error,
          });
          this.loader.stop();
          this.toastr.error(errResponse.message);
        }
      );
    } else {
      this.loader.stop();
      this.toastr.error("Week Days Start time should not be greater than end time!")
      this.shouldContinue = true
    }
  }
  //--------------Form Array Handling------------------------
  //-------week days--------------1)
  weekDaysValidation(index, validationFor: any = "") {
    let abc: any;

    if (validationFor === "OnlineForm") {
      abc = this.availabilityFormOnline.get("weekDays") as FormArray;
    } else if (validationFor === "HomeVisitForm") {
      abc = this.availabilityFormHomeVisit.get("weekDays") as FormArray;
    } else {
      abc = this.availabilityFormClinic.get("weekDays") as FormArray;
    }
    const formGroup = abc.controls[index] as FormGroup;
    return formGroup;
  }

  get weekDaysOnline() {
    return this.availabilityFormOnline.controls["weekDays"] as FormArray;
  }

  get weekDaysHomeVisit() {
    return this.availabilityFormHomeVisit.controls["weekDays"] as FormArray;
  }

  get weekDaysClinic() {
    return this.availabilityFormClinic.controls["weekDays"] as FormArray;
  }

  form() {
    let defaultTime: any = ["10:00", "18:00"]

    return this.fb.group({
      sun_start_time: [defaultTime[0], [Validators.required]],
      sun_end_time: [defaultTime[1], [Validators.required]],
      mon_start_time: [defaultTime[0], [Validators.required]],
      mon_end_time: [defaultTime[1], [Validators.required]],
      tue_start_time: [defaultTime[0], [Validators.required]],
      tue_end_time: [defaultTime[1], [Validators.required]],
      wed_start_time: [defaultTime[0], [Validators.required]],
      wed_end_time: [defaultTime[1], [Validators.required]],
      thu_start_time: [defaultTime[0], [Validators.required]],
      thu_end_time: [defaultTime[1], [Validators.required]],
      fri_start_time: [defaultTime[0], [Validators.required]],
      fri_end_time: [defaultTime[1], [Validators.required]],
      sat_start_time: [defaultTime[0], [Validators.required]],
      sat_end_time: [defaultTime[1], [Validators.required]],
    });
  }

  addNewWeek(add_for: any) {
    if (add_for === "all") {
      this.weekDaysOnline.push(this.form());
      this.weekDaysHomeVisit.push(this.form());
      this.weekDaysClinic.push(this.form());
    } else if (add_for === "online") {
      this.weekDaysOnline.push(this.copyFormValues(this.weekDaysOnline.controls));
    } else if (add_for === "home_visit") {
      this.weekDaysHomeVisit.push(this.copyFormValues(this.weekDaysHomeVisit.controls));
    } else {
      this.weekDaysClinic.push(this.copyFormValues(this.weekDaysClinic.controls));
    }
  }

  copyFormValues(previousWeek: AbstractControl[]): FormGroup {
    const previousWeekForm = previousWeek[previousWeek.length - 1];

    // Check if previousWeekForm exists and is a FormGroup
    if (previousWeekForm instanceof FormGroup) {
      const newWeek = this.fb.group({});

      // Loop through the days and copy values
      for (const day of Object.keys(previousWeekForm.value)) {
        newWeek.addControl(day, new FormControl(previousWeekForm.get(day).value));
      }

      return newWeek;
    } else {
      // If previous week doesn't exist or is not a FormGroup, create a new form with default values
      return this.form();
    }
  }

  /*   addNewWeek(add_for: any) {
      if (add_for === "all") {
        this.weekDaysOnline.push(this.form());
        this.weekDaysHomeVisit.push(this.form());
        this.weekDaysClinic.push(this.form());
      } else if (add_for === "online") {
        this.weekDaysOnline.push(this.form());
      } else if (add_for === "home_visit") {
        this.weekDaysHomeVisit.push(this.form());
      } else {
        this.weekDaysClinic.push(this.form());
      }
    } */

  removeWeek(index: number, remove_for: any) {
    if (remove_for === "online") {
      this.weekDaysOnline.removeAt(index);
    } else if (remove_for === "home_visit") {
      this.weekDaysHomeVisit.removeAt(index);
    } else {
      this.weekDaysClinic.removeAt(index);
    }
  }
  //---------Availability--------------2)
  availabilityValidation(index, validationFor: any = "") {
    let abc: any;

    if (validationFor === "OnlineForm") {
      abc = this.availabilityFormOnline.get("availability") as FormArray;
    } else if (validationFor === "HomeVisitForm") {
      abc = this.availabilityFormHomeVisit.get("availability") as FormArray;
    } else {
      abc = this.availabilityFormClinic.get("availability") as FormArray;
    }
    const formGroup = abc.controls[index] as FormGroup;
    return formGroup;
  }

  get availabilityOnline() {
    return this.availabilityFormOnline.controls["availability"] as FormArray;
  }
  get availabilityHomeVisit() {
    return this.availabilityFormHomeVisit.controls["availability"] as FormArray;
  }
  get availabilityClinic() {
    return this.availabilityFormClinic.controls["availability"] as FormArray;
  }

  availForm() {
    return this.fb.group({
      date: [""],
      start_time: [""],
      end_time: [""],
    });
  }

  addNewAvailabilty(add_for: any) {
    if (add_for === "all") {
      this.availabilityOnline.push(this.availForm());
      this.availabilityHomeVisit.push(this.availForm());
      this.availabilityClinic.push(this.availForm());
    } else if (add_for === "online") {
      this.availabilityOnline.push(this.availForm());
    } else if (add_for === "home_visit") {
      this.availabilityHomeVisit.push(this.availForm());
    } else {
      this.availabilityClinic.push(this.availForm());
    }
  }

  removeAvailability(index: number, remove_for: string) {
    if (remove_for === "online") {
      this.availabilityOnline.removeAt(index);
    } else if (remove_for === "home_visit") {
      this.availabilityHomeVisit.removeAt(index);
    } else {
      this.availabilityClinic.removeAt(index);
    }
  }
  //---------Un--Availability--------------3)
  unavailabilityValidation(index, validationFor: any = "") {
    let abc: any;

    if (validationFor === "OnlineForm") {
      abc = this.availabilityFormOnline.get("unAvailability") as FormArray;
    } else if (validationFor === "HomeVisitForm") {
      abc = this.availabilityFormHomeVisit.get("unAvailability") as FormArray;
    } else {
      abc = this.availabilityFormClinic.get("unAvailability") as FormArray;
    }
    const formGroup = abc.controls[index] as FormGroup;
    return formGroup;
  }

  get unAvailabilityOnline() {
    return this.availabilityFormOnline.controls["unAvailability"] as FormArray;
  }
  get unAvailabilityHomeVisit() {
    return this.availabilityFormHomeVisit.controls[
      "unAvailability"
    ] as FormArray;
  }
  get unAvailabilityClinic() {
    return this.availabilityFormClinic.controls["unAvailability"] as FormArray;
  }

  unAvailForm() {
    return this.fb.group({
      date: [""],
      start_time: [""],
      end_time: [""],
    })
  }
  

  

  addNewUnAvailabilty(add_for: string) {
    if (add_for === "all") {
      this.unAvailabilityOnline.push(this.unAvailForm());
      this.unAvailabilityHomeVisit.push(this.unAvailForm());
      this.unAvailabilityClinic.push(this.unAvailForm());
    } else if (add_for === "online") {
      this.unAvailabilityOnline.push(this.unAvailForm());
    } else if (add_for === "home_visit") {
      this.unAvailabilityHomeVisit.push(this.unAvailForm());
    } else {
      this.unAvailabilityClinic.push(this.unAvailForm());
    }
  }

  removeUnAvailability(index: number, remove_for: string) {
    if (remove_for === "online") {
      this.unAvailabilityOnline.removeAt(index);
    } else if (remove_for === "home_visit") {
      this.unAvailabilityHomeVisit.removeAt(index);
    } else {
      this.unAvailabilityClinic.removeAt(index);
    }
  }

  get f() {
    return this.availabilityFormOnline.controls;
  }

  get f2() {
    return this.availabilityFormHomeVisit.controls;
  }

  get f3() {
    return this.availabilityFormClinic.controls;
  }

  previousPage() {
    if (this.doctorId === '' || this.doctorId === null) { 
      let getId = sessionStorage.getItem("doctorId");
      this.fromParent.previous();
      this.router.navigate([`/super-admin/doctor/edit-doctor/${getId}`]);     
    } else {
      this.fromParent.mainStepper.previous();
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

  arrangeWeekDaysForRequest(element: any) {
    let isValid = true;

    const sunStart = this.convertToMinutes(element.sun_start_time);
    const sunEnd = this.convertToMinutes(element.sun_end_time);

    // Check if start time is greater than end time
    if (sunStart > sunEnd) {
      isValid = false;
    }

    const monStart = this.convertToMinutes(element.mon_start_time);
    const monEnd = this.convertToMinutes(element.mon_end_time);

    if (monStart > monEnd) {
      isValid = false;
    }

    const tueStart = this.convertToMinutes(element.tue_start_time);
    const tueEnd = this.convertToMinutes(element.tue_end_time);

    if (tueStart > tueEnd) {
      isValid = false;
    }

    const wedStart = this.convertToMinutes(element.wed_start_time);
    const wedEnd = this.convertToMinutes(element.wed_end_time);

    if (wedStart > wedEnd) {
      isValid = false;
    }

    const thuStart = this.convertToMinutes(element.thu_start_time);
    const thuEnd = this.convertToMinutes(element.thu_end_time);

    if (thuStart > thuEnd) {
      isValid = false;
    }

    const friStart = this.convertToMinutes(element.fri_start_time);
    const friEnd = this.convertToMinutes(element.fri_end_time);

    if (friStart > friEnd) {
      isValid = false;
    }

    const satStart = this.convertToMinutes(element.sat_start_time);
    const satEnd = this.convertToMinutes(element.sat_end_time);

    if (satStart > satEnd) {
      isValid = false;
    }

    let obj = {
      sun_start_time: this.coreService.convertTwentyFourToTwelve(
        element.sun_start_time
      ),
      sun_end_time: this.coreService.convertTwentyFourToTwelve(
        element.sun_end_time
      ),
      mon_start_time: this.coreService.convertTwentyFourToTwelve(
        element.mon_start_time
      ),
      mon_end_time: this.coreService.convertTwentyFourToTwelve(
        element.mon_end_time
      ),
      tue_start_time: this.coreService.convertTwentyFourToTwelve(
        element.tue_start_time
      ),
      tue_end_time: this.coreService.convertTwentyFourToTwelve(
        element.tue_end_time
      ),
      wed_start_time: this.coreService.convertTwentyFourToTwelve(
        element.wed_start_time
      ),
      wed_end_time: this.coreService.convertTwentyFourToTwelve(
        element.wed_end_time
      ),
      thu_start_time: this.coreService.convertTwentyFourToTwelve(
        element.thu_start_time
      ),
      thu_end_time: this.coreService.convertTwentyFourToTwelve(
        element.thu_end_time
      ),
      fri_start_time: this.coreService.convertTwentyFourToTwelve(
        element.fri_start_time
      ),
      fri_end_time: this.coreService.convertTwentyFourToTwelve(
        element.fri_end_time
      ),
      sat_start_time: this.coreService.convertTwentyFourToTwelve(
        element.sat_start_time
      ),
      sat_end_time: this.coreService.convertTwentyFourToTwelve(
        element.sat_end_time
      ),
    };

    if (!isValid) {
      this.shouldContinue = false;
      return 0;
    } else {
      return obj;
    }

  }
  private convertToMinutes(time: string): number {
    const [hours, minutes] = time.split(":");
    return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
  }

  arranageUnavAndAvlForRequest(element: any) {

    let start_time = this.coreService.convertTwentyFourToTwelve(
      element.start_time
    );
    let end_time = this.coreService.convertTwentyFourToTwelve(element.end_time);
    let obj = { start_time, end_time };
    return obj;
  }

  arrangeUnavlAndAvlForPatch(element: any) {
    let start_time =
      element.start_time.slice(0, 2) + ":" + element.start_time.slice(2, 4);
    let end_time =
      element.end_time.slice(0, 2) + ":" + element.end_time.slice(2, 4);
    let obj = { start_time, end_time };
    return obj;
  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'yyyy-MM-dd') || '';
  }
  formatunavailableDate(event: any) {
    let input = event.target.value;
    input = input.replace(/\D/g, "");
  
    if (input.length > 2) {
      input = input.substring(0, 2) + "/" + input.substring(2);
    }
    if (input.length > 5) {
      input = input.substring(0, 5) + "/" + input.substring(5);
    }
    if (input.length > 10) {
      input = input.substring(0, 10);
    }
    event.target.value = input;
  }

  onClick(event: any, day: string, index: number): void {
    const doctor_id = localStorage.getItem("portal_user");
    // const id = JSON.parse(doctor_id);
  
    const data = {
      portal_user_id: doctor_id,
      availability: {
        [day]: event.checked
      }
    };
  
    this.service.ChangeAvailability(data).subscribe((res) => {
      const response = this.coreService.decryptObjectData({ data: res });
      const dayTimes = response.data.week_days[0]; 
  
      const formGroup = this.weekDaysOnline.at(index);
      if (event.checked && dayTimes) {
  
        const startRaw = dayTimes[`${day}_start_time`];
        const endRaw = dayTimes[`${day}_end_time`];

  
        const formatTime = (time: string): string => {
          if (!time || time.length !== 4) return '';
          return time.slice(0, 2) + ':' + time.slice(2);
        };
  
        const startFormatted = formatTime(startRaw);
        const endFormatted = formatTime(endRaw);

  
        formGroup.patchValue({
          [`${day}_start_time`]: startFormatted,
          [`${day}_end_time`]: endFormatted
        });
      }
      else{
        formGroup.patchValue({
          [`${day}_start_time`]: "00:00",
          [`${day}_end_time`]: "00:00"
        });
      }
    });
  }
 
}
