import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "../../../indiviual-doctor.service";
import { Observable, map, startWith } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { LabimagingdentalopticalService } from "src/app/modules/super-admin/labimagingdentaloptical.service";

@Component({
  selector: "app-eprescriptionlab",
  templateUrl: "./eprescriptionlab.component.html",
  styleUrls: ["./eprescriptionlab.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class EprescriptionlabComponent implements OnInit {
  isClicked = false;
  testList: any = [];
  selectedTest: any;
  appointmentId: any = "";
  doctorId: any = "";
  searchControl = new FormControl('');
  @ViewChild("rabeprazolecontent") rabeprazolecontent: ElementRef;
  filteredOptions!: Observable<any[]>;
  myControl = new FormControl("");
  selectedTestinfo: any;
  searchTest: any = "";
  profile: any;
  patientSubscriberphoto: any;
  patientId: any;
  lab_testId: any;
  lab_test_name: any;
  finalArray: any = [];
  centreName: any;
  centreId: any;
  showAddButtton:boolean = false;
  openedWindow:Window = null

  constructor(
    private modalService: NgbModal,
    private sadminService: LabimagingdentalopticalService,
    private indiviualDoctorService: IndiviualDoctorService,
    private coreService: CoreService,
    private activatedRoute: ActivatedRoute,
    private route: Router,
    private cdr: ChangeDetectorRef

  ) {
    ;
    this.activatedRoute.queryParams.subscribe(params => {
      const id = params['appointmentId'];
      this.appointmentId = id;
      this.showAddButtton = params['showAddButtton']
    });
  }

  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.doctorId = loginData?._id;
    this.getAppointmentDetails();

  }


  async getAppointmentDetails() {
    this.indiviualDoctorService
      .viewAppointmentDetails(this.appointmentId)
      .subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.profile = response?.data?.patientDetails;
          this.patientId = response?.data?.patientDetails?.patient_id;
          this.patientSubscriberphoto = response?.data?.insuraceSubscriberphoto;
        }
      });
  }
  handleMedicineChange() {
    this.searchTest = this.myControl.value;
    this.gettestList();
  }

  async createEprescription() {
    if (this.finalArray.length === 0) {
      this.coreService.showError('Please select test.', "");
      return;
    }

    let reqData = {
      appointmentId: this.appointmentId,
      doctorId: this.doctorId,
      patientId: this.patientId,
      labTest: this.finalArray,
    };
    this.indiviualDoctorService.labtestPrescribe(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.coreService.showSuccess("", response.message);
        this.route.navigate([`/individual-doctor/eprescription/validate-lab-test/${this.appointmentId}`],{
          queryParams:{
            showAddButtton:this.showAddButtton
          }
        })
      } else {
        this.coreService.showError("", response.message);
      }
    });
  }



  openCommentPopup(test_content: any, lab_testId: any) {
    let reqData = {
      id: lab_testId,
    };
    this.sadminService.getLabTestBYID(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      if (response.status) {
        this.selectedTestinfo = response?.body?.result[0];
      }
      this.modalService.open(test_content, {
        centered: true,
        size: "md",
        windowClass: "info_window",
      });
    });

  }

  getTestNames(): string {
    return this.selectedTestinfo?.tests?.map(item => item.testName).join(', ') || '';
  }

  gettestList() {
    let param = {
      limit: 100,
      page: 1,
      searchText: this.searchTest 
    };
    this.sadminService.getLabTestLIstAPi(param).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      if (response.status) {
        this.testList = response.body.result;
        this.filteredOptions = this.myControl.valueChanges.pipe(
          startWith(""),
          map((value) => this._filter(value || ""))
        );
      }
    });
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    if (this.testList.length > 0) {
      var result = this.testList.filter((option: any) => {
        return option.testName;
      });
      return result != "" ? result : ["No data"];
    }
    return ["No data"];
  }

  handleClick() {
    if (!this.isClicked) {
      this.isClicked = true;
      this.handleMedicineChange(); // This will run only once, the first time the click happens
    }
  }
  
  async addTest(event: any) {
    this.lab_testId = event._id;
    this.lab_test_name = event.testName;
    this.centreName = event.labName;
    this.centreId = event.labId;

    this.selectedTest = event;

    let finalObject = {
      labtestName: this.lab_test_name,
      labtestId: this.lab_testId,
      labCenterName: this.centreName,
      labCenterId: this.centreId,
      couponCode:event?.couponCode ? event?.couponCode :'',
      loinc:event?.loinc,
      testFees:event?.testFees
    };

    const isDuplicate = this.finalArray.some(test => test.labtestId === this.lab_testId);

    if (isDuplicate) {
      this.coreService.showWarning("", "This lab test has already been added.");
    } else {
      this.finalArray.push(finalObject);
    }
  }


  checkDuplicate(test_id) {
    const test_Exists = this.finalArray.some(
      ele => ele.labtestId === test_id
    );

    if (test_Exists) {
      this.coreService.showWarning('This test has already been added.', "");
      return;
    }
  }


  removeDosage(index: number) {
    this.finalArray.splice(index, 1);

  }

  routeBack() {
    this.route.navigate([`/individual-doctor/appointment/appointmentdetails/${this.appointmentId}`])
  }

  calculateAge(dob: string): number {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  routeToProfile(){    
    const url = `/individual-doctor/patientmanagement/details/${this.patientId}?appointmentId=${this.appointmentId}&&showAddButtton=${this.showAddButtton}`;
    this.openedWindow = window.open(url, '_blank');
  }
}
