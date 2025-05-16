
import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormControl,
  AbstractControl,
} from "@angular/forms";
import { MatStepper } from "@angular/material/stepper";
import { ActivatedRoute } from "@angular/router";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { IndiviualDoctorService } from "src/app/modules/individual-doctor/indiviual-doctor.service";


@Component({
  selector: 'app-education-super-admin',
  templateUrl: './education-super-admin.component.html',
  styleUrls: ['./education-super-admin.component.scss']
})
export class EducationSuperAdminComponent implements OnInit {
  @Output() fromChild = new EventEmitter<string>();
  @Input() public mstepper: MatStepper;
  @Output() calldoctordata = new EventEmitter<string>();
  @Output() callParent = new EventEmitter<void>();

  educationalForm: any = FormGroup;
  isSubmitted: boolean = false;

  pageForAdd: any = true;
  educationalDetails: any;
  doctorId: any = "";

  stepper: any;

  constructor(
    private toastr: ToastrService,
    private sadminService: SuperAdminService,
    private coreService: CoreService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private loader: NgxUiLoaderService,
    private doctorservice: IndiviualDoctorService
  ) {
    this.educationalForm = this.fb.group({
      education: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.doctorId = loginData?._id;
    this.getDoctorDetails(this.mstepper);
  }

  //For Edit Doctor
  getDoctorDetails(fromParent: any) {
    let response = fromParent?.response
    this.stepper = fromParent?.mainStepper
    this.doctorservice.getData().subscribe((data: any) => {
      this.educationalDetails =
        data?.response?.data?.result[0]?.in_education?.education_details;
    });

    this.patchValues(this.educationalDetails);
  }

  patchValues(data: any) {
  
    if (data && data.length > 0) {
      const nonBlankData = data.filter(element => this.isNotBlank(element));
      const educationArray = this.educationalForm.get('education') as FormArray;

      nonBlankData.forEach((element, index) => {
        if (index < educationArray.length) {
          educationArray.at(index).patchValue(element);
        } else {
          this.addNewEducation();
          educationArray.at(index).patchValue(element);
        }
      });

      while (educationArray.length > nonBlankData.length) {
        educationArray.removeAt(educationArray.length - 1);
      }
    } else {
      this.addNewEducation();
    }
  }


  isNotBlank(element: any): boolean {
    return Object.values(element).some(value => value !== null && value !== '');
  }



  hasValueInFields(row: AbstractControl, filedarray: Array<any>): boolean {
    let newarray = false;

    filedarray.forEach(element => {
      if (row.get(element).value) {
        newarray = true;
      }
    });

    return newarray; // Return true if any field has a value
  }

  handleSave(isNext: any = "") {
    this.isSubmitted = true;
  
    const rowEducational = this.educationalForm.get("education") as FormArray;
  
    this.loader.start();
    const portalUser = localStorage.getItem("portal_user");
    const reqData = {
      education_details: this.educationalForm.value.education,
      portal_user_id: portalUser,
    };
  
    this.doctorservice.educationalDetails(reqData).subscribe(
      (res) => {
        const response = this.coreService.decryptObjectData({ data: res });
        this.loader.stop();
  
        if (response.status) {
          this.toastr.success(response.message);
          this.callParent.emit();
  
          if (this.pageForAdd) {
            this.fromChild.emit("educationalForm");
          } else {
            this.stepper.next();
          }
        } else {
          this.toastr.error(response.message);
        }
      },
      (err) => {
        this.loader.stop();
        this.toastr.error("Something went wrong!");
      }
    );
  }
  

  //-----------FORM ARRAY HANDLING-------------
  validation(index) {
    let abc = this.educationalForm.get("education") as FormArray;
    const formGroup = abc.controls[index] as FormGroup;
    return formGroup;
  }

  get education() {
    return this.educationalForm.controls["education"] as FormArray;
  }

  addNewEducation() {
    const newMedicalAct = this.fb.group({
      degree: [""],
      university: [""],
      city: [""],
      country: [""],
      start_date: [""],
      end_date: [""],
    });
    this.education.push(newMedicalAct);
  }

  removeEducation(index: number) {
    this.education.removeAt(index);
  }
  myFilter = (d: Date | null): boolean => {
    return true;
  };

  previousPage() {
    this.stepper.previous();
  }
}
