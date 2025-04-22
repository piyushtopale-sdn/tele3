import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { BreakpointObserver } from "@angular/cdk/layout";
import { StepperOrientation } from "@angular/cdk/stepper";
import { FormBuilder, Validators } from "@angular/forms";
import { MatStepper } from "@angular/material/stepper";
import { map, Observable } from "rxjs";
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { ActivatedRoute } from "@angular/router";
import { IndiviualDoctorService } from "../indiviual-doctor.service";

@Component({
  selector: "app-individual-doctor-myprofile",
  templateUrl: "./individual-doctor-myprofile.component.html",
  styleUrls: ["./individual-doctor-myprofile.component.scss"],
  encapsulation: ViewEncapsulation.None,
  exportAs: "mainStepper",
})
export class IndividualDoctorMyprofileComponent implements OnInit {
  @ViewChild("mainStepper") mainStepper: MatStepper;

  stepperOrientation: Observable<StepperOrientation>;

  doctorId: any;
  profileDetails: any;
  passToAvailability: any = {};
  passToChild: any = {};
  isEnable: any = false;
  matRedirectStep: number = 0;
  stepIndex: number = 0;

  constructor(
    breakpointObserver: BreakpointObserver,
    private coreService: CoreService,
    private toastr: ToastrService,
    private activatedRoute: ActivatedRoute,
    private doctorservice: IndiviualDoctorService

  ) {
    this.stepperOrientation = breakpointObserver
      .observe("(min-width: 1150px)")
      .pipe(map(({ matches }) => (matches ? "horizontal" : "vertical")));

    this.matRedirectStep = parseInt(this.activatedRoute.snapshot.paramMap.get("id"));



  }



  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.doctorId = loginData?._id;
    this.getDoctorDetails();


  }

  ngAfterViewInit() {
    this.mainStepper.selectedIndex = this.matRedirectStep;
  }

  onStepSelectionChange(event: any) {
    this.stepIndex = event.selectedIndex;
    // Perform any action here based on the step change
  }

  sendData(data: string) {
    this.doctorservice.setData(data);
  }

  getDoctorDetails() {
    this.doctorservice.getDoctorProfileDetails(this.doctorId).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.profileDetails = response?.data?.result[0];
      this.isEnable = true;

      let obj = {
        mainStepper: this.mainStepper,
        response: response,
      };
      this.passToChild = obj;
      this.sendData(this.passToChild)
    }, err => {
      let errResponse = this.coreService.decryptObjectData({ data: err.error })
      this.toastr.error(errResponse.message)
    });
  }

}
