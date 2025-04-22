
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { BreakpointObserver } from "@angular/cdk/layout";
import { StepperOrientation } from "@angular/cdk/stepper";
import { FormBuilder, Validators } from "@angular/forms";
import { MatStepper } from "@angular/material/stepper";
import { map, Observable } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "src/app/modules/individual-doctor/indiviual-doctor.service";

@Component({
  selector: 'app-add-doctor',
  templateUrl: './add-doctor.component.html',
  styleUrls: ['./add-doctor.component.scss'],
  encapsulation: ViewEncapsulation.None,
  exportAs: "mainStepper",
})
export class AddDoctorComponent implements OnDestroy {
  @ViewChild("mainStepper") mainStepper: MatStepper;

  stepperOrientation: Observable<StepperOrientation>;

  basicInfo: boolean = false;
  educationalForm: boolean = false;
  locationForm: boolean = false;
  availability: boolean = false;
  feeManage: boolean = false;
  docManage: boolean = false;
  pageForAdd: boolean = true;

  doctorId: any;
  profileDetails: any;
  passToAvailability: any = {};
  passToChild: any = {};
  isEnable: any = false;
  stepIndex: number = 0;

  constructor(
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private service: IndiviualDoctorService,
    private coreService: CoreService,
    breakpointObserver: BreakpointObserver,
    private router : Router
  ) {
    this.stepperOrientation = breakpointObserver
      .observe("(min-width: 1150px)")
      .pipe(map(({ matches }) => (matches ? "horizontal" : "vertical")));
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  ngOnInit(): void {
    let paramId = this.activatedRoute.snapshot.paramMap.get("id");
    this.doctorId = paramId;
    if (paramId === null) {
      this.pageForAdd = true;
      this.passToChild = this.mainStepper;      
      this.isEnable = true;
    } else {      
      this.pageForAdd = false;     this.availability = true;
      this.basicInfo = true;    
      this.availability = true;
      this.getDoctorDetails();
    }
  }

  ngAfterViewInit(){
    let paramId = this.activatedRoute.snapshot.paramMap.get("id");
    if (paramId === null) {
      this.pageForAdd = true;
      this.passToChild = this.mainStepper;
      this.isEnable = true;
    } else {      
      this.pageForAdd = false;
      this.basicInfo = true;
      this.availability = true;
      this.getDoctorDetails();
    }
    this.cdr.detectChanges();
  }

  onStepSelectionChange(event: any) {
    this.stepIndex = event.selectedIndex;
    let getId = sessionStorage.getItem("doctorId");
    if (this.stepIndex === 0) {
      this.router.navigate([`/super-admin/doctor/edit-doctor/${getId}`]);      
    }    
  }

  sendData(data: string) {    
    this.service.setData(data);
  }

  getDoctorDetails() {
    if (this.doctorId === null || this.doctorId === undefined) {
      return
    }
    this.service.getDoctorProfileDetails(this.doctorId).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        this.profileDetails = response?.data?.result[0];
        this.isEnable = true;

        let obj = {
          mainStepper: this.mainStepper,
          response: response,
        };
        this.passToChild = obj;
        this.sendData(this.passToChild)

      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.coreService.showError("", errResponse.message);
      }
    );
  }

  handleEvent(event) {

    if (event === "basicInfo") {
      this.basicInfo = true;
    }

    if (event === "availabilty") {
      this.availability = true;
    } 

    this.goForward();
  }

  goForward() {
    setTimeout(() => {
      this.mainStepper.next();
    }, 1000);
  }

  ngOnDestroy(): void{
    sessionStorage.removeItem('doctorId')
  }


}
