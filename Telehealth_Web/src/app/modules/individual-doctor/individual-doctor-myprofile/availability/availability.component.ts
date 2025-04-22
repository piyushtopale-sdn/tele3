import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from "@angular/core";
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
import { Subscription } from "rxjs";
import { log } from "util";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import { DatePipe } from "@angular/common";
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: "app-availability",
  templateUrl: "./availability.component.html",
  styleUrls: ["./availability.component.scss"],
})
export class AvailabilityComponent implements OnInit, OnChanges {
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

  availabilityFormOnline: any = FormGroup;
  isSubmitted: any = false;
  doctorRole: any = "";
  pageForAdd: any = true;
  availability: any;
  doctorId: any = "";
  menuSubscription: Subscription;
  onlineExitingIds: any = '';
  shouldContinue: boolean = true;
  stepper: any;
  constructor(
    private toastr: ToastrService,
    private route: Router,
    private coreService: CoreService,
    private fb: FormBuilder,
    private doctorService: IndiviualDoctorService,
    private loader: NgxUiLoaderService,
    private datepipe : DatePipe,
    private dateAdapter: DateAdapter<Date>,

  ) {
    this.availabilityFormOnline = this.fb.group({
      weekDays: this.fb.array([]),
      availability: this.fb.array([]),
      unAvailability: this.fb.array([]),
      bookingSlot: ["", [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.doctorId = loginData?._id;
    this.doctorRole = loginData?.role;
    this.getDoctorDetails(this.mstepper);
    
  }

  fromParent: any;

  ngOnChanges() {
    // this.fromParent = this.mstepper;
  }

  //For Edit Doctor
  getDoctorDetails(fromParent: any) {
    let response = fromParent?.response;
    this.stepper = fromParent?.mainStepper;

    // this.doctorService.getDoctorProfileDetails(this.doctorId).subscribe((res) => {
    //   let response = this.coreService.decryptObjectData({ data: res });
    if (response?.data?.availabilityArray) {

      this.availability = response?.data?.availabilityArray;
    }

    this.patchValues(this.availability);
    // });
  }



  saveAvailability(isNext: string = "") {
    
    this.isSubmitted = true;
    if (
      this.availabilityFormOnline.invalid
    ) {
      window.scroll({
        top: 0,
      });
      this.coreService.showError("", "Please fill all required fields.")
      return;
    }
    this.isSubmitted = false;
    this.loader.start();
    let weekArrayOnline: any = [];

    this.availabilityFormOnline.value.weekDays.forEach((element) => {
      let obj = this.arrangeWeekDaysForRequest(element);
      if (this.shouldContinue) {
        weekArrayOnline.push(obj);
      } else {
        return
      }

    });

    //------------una & avl------------------
    let avlOnline = [];
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

    //----------unAvl------------
    let unAvlOnline = [];

    this.availabilityFormOnline.value.unAvailability.forEach((element) => {
      let time = this.arranageUnavAndAvlForRequest({
        start_time: element.start_time,
        end_time: element.end_time,
      });
      let date = this.formatDate(element.date);
      unAvlOnline.push({
        date:date,
        start_time: time.start_time,
        end_time: time.end_time,
      });
    });

    //-------------Online Type--------------------------
    let appointmenTypeOnline = {
      week_days: weekArrayOnline,
      unavailability_slot: unAvlOnline,
      slot_interval: this.availabilityFormOnline.value.bookingSlot,
      existingIds: this.onlineExitingIds
    };
    //------------------------------------------

    let doctorAvailabilityArray = [
      appointmenTypeOnline
    ];

    let reqData = {
      doctor_availability: doctorAvailabilityArray,
      portal_user_id: this.doctorId,
    };
    
              
    if (this.shouldContinue === true) {

      this.doctorService.doctorAvailability(reqData).subscribe(
        (res) => {
          let response = this.coreService.decryptObjectData({ data: res });
          if (response.status) {
            this.callParent.emit()
            this.loader.stop();
            this.toastr.success(response.message);
            if (isNext === 'yes') {
              this.route.navigate(["/individual-doctor/editprofile"]);
            }
          }
        },
        (err) => {

          let errResponse = this.coreService.decryptObjectData({
            data: err.error,
          });
          this.loader.stop();
          this.toastr.error(errResponse.body._message);
        }
      );
    } else {
      this.toastr.error("Week Days Start time should not be greater than end time!")
      this.shouldContinue = true
    }

  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'yyyy-MM-dd') || '';
  }
  //--------------Form Array Handling------------------------
  //-------week days--------------1)
  weekDaysValidation(index) {
    let abc = this.availabilityFormOnline.get("weekDays") as FormArray;
    const formGroup = abc.controls[index] as FormGroup;
    return formGroup;
  }

  get weekDaysOnline() {
    return this.availabilityFormOnline.controls["weekDays"] as FormArray;
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

  addNewWeek() {
  
      this.weekDaysOnline.push(this.copyFormValues(this.weekDaysOnline.controls));
   
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


  removeWeek(index: number) {
  
      this.weekDaysOnline.removeAt(index);
   
  }
  //---------Availability--------------2)
  availabilityValidation(index) {
    let abc = this.availabilityFormOnline.get("availability") as FormArray;
    const formGroup = abc.controls[index] as FormGroup;
    return formGroup;
  }

  get availabilityOnline() {
    return this.availabilityFormOnline.controls["availability"] as FormArray;
  }

  availForm() {
    return this.fb.group({
      date: [""],
      start_time: [""],
      end_time: [""],
    });
  }

  addNewAvailabilty() {
    
      this.availabilityOnline.push(this.availForm());
  
  }

  removeAvailability(index: number, remove_for: string) {
   
      this.availabilityOnline.removeAt(index);
  
  }
  //---------Un--Availability--------------3)
  unavailabilityValidation(index) {
    let abc = this.availabilityFormOnline.get("unAvailability") as FormArray;
    const formGroup = abc.controls[index] as FormGroup;
    return formGroup;
  }

  get unAvailabilityOnline() {
    return this.availabilityFormOnline.controls["unAvailability"] as FormArray;
  }

  unAvailForm() {
    return this.fb.group({
      date: [""],
      start_time: [""],
      end_time: [""],
    });
  }

  addNewUnAvailabilty() {
   
      this.unAvailabilityOnline.push(this.unAvailForm());
   
  }

  removeUnAvailability(index: number) {
   
      this.unAvailabilityOnline.removeAt(index);
   
  }

  get f() {
    return this.availabilityFormOnline.controls;
  }
  previousPage() {
    // this.mstepper.previous();
    this.stepper.previous();
  }

//   patchValues(data: any) {

//     let onlineMode: any = {};
//     this.onlineExitingIds = '';
//     if (data.length != 0) {
//       this.clearHnadler();

//       data.forEach((element) => {
//         // if (element?.appointment_type === "ONLINE") {
//         onlineMode = element;
//         this.onlineExitingIds = element._id;
//         // }
//       });

//       if (Object.keys(onlineMode).length != 0) {
//         onlineMode?.week_days.forEach((element) => {
//           this.addNewWeek();
//         });
//         onlineMode?.availability_slot.forEach((element) => {
//           this.addNewAvailabilty();
//         });
//         onlineMode?.unavailability_slot.forEach((element) => {
//           this.addNewUnAvailabilty();
//         });

//         let arrangedWeekDaysOnline = [];
//         let arrangedAvlOnline = [];
//         let arrangedUnAvlOnline = [];

//         onlineMode.week_days.forEach((element) => {
//           let obj = this.arrangeWeekDaysForPatch(element);
//           arrangedWeekDaysOnline.push(obj);
//         });

//         onlineMode.availability_slot.forEach((element) => {
//           let obj = this.arrangeUnavlAndAvlForPatch({
//             start_time: element.start_time,
//             end_time: element.end_time,
//           });
//           arrangedAvlOnline.push({
//             date: element.date,
//             start_time: obj.start_time,
//             end_time: obj.end_time,
//           });
//         });

//         onlineMode.unavailability_slot.forEach((element) => {
//           let obj = this.arrangeUnavlAndAvlForPatch({
//             start_time: element.start_time,
//             end_time: element.end_time,
//           });
//           arrangedUnAvlOnline.push({
//             date: element.date,
//             start_time: obj.start_time,
//             end_time: obj.end_time,
//           });
//         });

//         this.availabilityFormOnline.patchValue({
//           // weekDays: onlineMode?.week_days,
//           weekDays: arrangedWeekDaysOnline,
//           availability: arrangedAvlOnline,
//           unAvailability: arrangedUnAvlOnline,
//           bookingSlot: onlineMode?.slot_interval,
//         });
//       } else {
//         this.addNewWeek();
//         this.addNewAvailabilty();
//         this.addNewUnAvailabilty();
//       }
//     } else {
//       this.availabilityFormOnline.reset();

//       this.clearHnadler();
//       this.addNewWeek();
//       this.addNewAvailabilty();
//       this.addNewUnAvailabilty();
//     }
//   }

patchValues(element: any) {
  let onlineMode: any = {};

  this.onlineExitingIds = '';

  if (element.length != 0) {
    this.clearHnadler();
    element?.forEach((data) => {

      onlineMode = data;
      this.onlineExitingIds = data?._id;

    });

    //online mode
    if (Object.keys(onlineMode).length != 0) {
      onlineMode?.week_days.forEach((element) => {
        this.addNewWeek();
      });
      onlineMode?.unavailability_slot.forEach((element) => {
        this.addNewUnAvailabilty();
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
      this.addNewWeek();
      this.addNewUnAvailabilty();
    }


  } else {
    this.availabilityFormOnline.reset();

    this.clearHnadler();
    this.addNewWeek();
    this.addNewUnAvailabilty();
  }

}

  clearHnadler() {
    this.weekDaysOnline.clear();
    this.availabilityOnline.clear();
    this.unAvailabilityOnline.clear();
  }

  next() {
    this.fromParent.mainStepper.next();
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

  ngOnDestroy(): void {
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
    }
  }
}
