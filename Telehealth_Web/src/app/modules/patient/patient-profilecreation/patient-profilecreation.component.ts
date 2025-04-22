import { PatientService } from "./../patient.service";
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { StepperOrientation } from "@angular/cdk/stepper";
import { BreakpointObserver } from "@angular/cdk/layout";
import { map, Observable } from "rxjs";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormControl,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { distinctUntilChanged, EMPTY, startWith, switchMap, tap } from "rxjs";
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { MatStepper } from "@angular/material/stepper";
import { Router } from "@angular/router";
import { promises } from "dns";
import { DatePipe } from "@angular/common";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import intlTelInput from "intl-tel-input";
import { NgxUiLoaderService } from "ngx-ui-loader";

@Component({
  selector: "app-patient-profilecreation",
  templateUrl: "./patient-profilecreation.component.html",
  styleUrls: ["./patient-profilecreation.component.scss"],
  encapsulation: ViewEncapsulation.None,
  exportAs: "mainStepper",
})
export class PatientProfilecreationComponent implements OnInit {
  displayedColumnsDocs: string[] = [
    "Document",
    "issue date",
    "expiry date",
    "action",
  ];

  displayedColumnsDocsDiagnosis: string[] = [
    "name",
    "appointment date",
    "appointment id",
    "action",
  ];

  displayedColumnsDocsMedical: string[] = [
    "allergen",
    "allergy type",
    "reaction",
    "status",
    "action"
  ];

  displayedColumnsDocsSocial: string[] = [
    "name",
    "alcohol",
    "drugs",
    "tobacco",
    "updatedAt",
    "action"
  ];

  @ViewChild("mainStepper") mainStepper: MatStepper;

  stepperOrientation: Observable<StepperOrientation>;

  @ViewChild("stepper") private myStepper: MatStepper;
  @ViewChild("rejectappointment") rejectappointment: ElementRef;
  @ViewChild("matchedresult") matchedresult: ElementRef;
  @ViewChild("delete_Immunization") delete_Immunization: ElementRef;

  @ViewChild("mobile") mobile: ElementRef<HTMLInputElement>;
  @ViewChild("address") address!: ElementRef;
  @ViewChild('phone') phone!: ElementRef<HTMLInputElement>;
  iti: any;
  selectedCountryCode: any;
  selectedcountrycodedb: any = '';
  overlay: false;
  personalDetails!: FormGroup;
  insuranceDetails: any = FormGroup;
  addVitals!: FormGroup;
  medicine!: FormGroup;
  immunizationForm!: FormGroup;
  historyForm!: FormGroup;
  medicalDocumentForm!: FormGroup;
  familyMembersForm!: FormGroup;
  patient_id: any;
  isSubmitted: any = false;
  showAddressComponent: any = false;
  selectImmunization: any = [];
  genderList: any[] = [];
  bloodGroupList: any[] = [];
  martialStatusList: any[] = [];
  spokenLanguageList: any[] = [];
  relationshipList: any[] = [];
  immunizationList: any[] = [];
  immunizationList2: any[] = [];
  patientHistoryTypeList: any[] = [];
  allergyList: any[] = [];
  lifestyleList: any[] = [];
  familyHistoryTypeList: any[] = [];

  selectedIndex: number = 0;

  setDocToView: any = "";
  value: any = "";

  profileImage: any = "";
  profilePicFile: any = null;
  maxDOB: any;
  actualsubscriberId: any = ""
  selectImmunization_id: any = [];
  requiredDeleteData: any;
  existing_id: any;
  deleteIndex: any;
  deleted_id: any;
  countryCodes: string[];
  height: number;
  weight: number;
  BMIUpadteValue: number;
  vaccinationTransmit: any;
  vaccinationData: any;
  getData: any;
  patientDOB: any;
  insuranceData: any;
  selectedInsurance: any;
  familyMemberList: any = []
  deletedFamilyMemberList: any = []
  familyMemberForm: FormGroup;
  familyMemberProfileImage: any = ''
  editFamilyMemberFormOpen: boolean = false;
  familyMemberId: any = '';
  actionvalue: any = false;
  pageSize: number = 5;
  page: any = 1;

  documentsData: any[] = [];

  diagnosisData: any[] = [];
  totalLengthDagnosis: number = 0;

  medicalData: any[] = [];
  totalLengthMedical: number = 0;
  @ViewChild("addMedicalHistory") addMedicalHistory: ElementRef;
  showFamilyDropdown: boolean = false
  medicalHistoryForm: FormGroup;
  isMedicalEditModalOpen: boolean = false

  socialData: any[] = [];
  totalLengthSpcial: number = 0;
  @ViewChild("addSocialHistory") addSocialHistory: ElementRef;
  socialHistoryForm:FormGroup;
  isSocialEditModalOpen:boolean = false;

  constructor(
    private fb: FormBuilder,
    private service: PatientService,
    private _coreService: CoreService,
    private toastr: ToastrService,
    breakpointObserver: BreakpointObserver,
    private route: Router,
    private datePipe: DatePipe,
    private modalService: NgbModal,
    private loader: NgxUiLoaderService
  ) {
    this.stepperOrientation = breakpointObserver
      .observe("(min-width: 1200px)")
      .pipe(map(({ matches }) => (matches ? "horizontal" : "vertical")));

    this.personalDetails = this.fb.group({
      profile_pic: [""],
      first_name: ["", [Validators.required]],
      // middle_name: [""],
      last_name: ["", [Validators.required]],
      first_name_arabic: [""],
      last_name_arabic: [""],
      middle_name: [""],
      gender: ["", [Validators.required]],
      dob: ["", [Validators.required]],
      age: [0],
      // spokenLanguage: [""],
      email: ["", [Validators.required]],
      mobile: ["", [Validators.required]],
      blood_group: [""],
      marital_status: [""],
      address: [""],
      loc: [""],
      // neighborhood: [""],
      country: [""],
      region: [""],
      province: [""],
      department: [""],
      city: [""],
      village: [""],
      pincode: [""],
      emergency_contact: this.fb.group({
        name: [""],
        relationship: [""],
        phone_number: [
          ""

        ],
      }),
      mobilePayDetails: this.fb.array([])
    });

    this.insuranceDetails = this.fb.group({
      insurance_id: [""],
      firstName: [""],
      lastName: [""],
      mobile: [""],
      dob: [""],
      // primary_insured: fb.group({
      //   relationship: ["", [Validators.required]],
      //   first_name: ["", [Validators.required]],
      //   middle_name: ["", [Validators.required]],
      //   last_name: ["", [Validators.required]],
      //   gender: ["", [Validators.required]],
      //   dob: ["", [Validators.required]],
      //   age: ["", [Validators.required]],
      //   insurance_id: ["", [Validators.required]],
      //   policy_id: ["", [Validators.required]],
      //   employee_id: ["", [Validators.required]],
      //   card_id: ["", [Validators.required]],
      //   insurance_holder_name: ["", [Validators.required]],
      //   insurance_validity_from: ["", [Validators.required]],
      //   insurance_validity_to: ["", [Validators.required]],
      //   reimbursement_rate: ["", [Validators.required]],
      //   insurance_card_and_id_image: ["", [Validators.required]],
      // }),
      // is_primary_is_secondary: [false, [Validators.required]],
      // secondary_insured: fb.group({
      //   relationship: ["", [Validators.required]],
      //   first_name: ["", [Validators.required]],
      //   middle_name: ["", [Validators.required]],
      //   last_name: ["", [Validators.required]],
      //   gender: ["", [Validators.required]],
      //   dob: ["", [Validators.required]],
      //   age: ["", [Validators.required]],
      //   insurance_id: ["", [Validators.required]],
      //   policy_id: ["", [Validators.required]],
      //   employee_id: ["", [Validators.required]],
      //   card_id: ["", [Validators.required]],
      //   insurance_holder_name: ["", [Validators.required]],
      //   insurance_validity_from: ["", [Validators.required]],
      //   insurance_validity_to: ["", [Validators.required]],
      //   reimbursement_rate: ["", [Validators.required]],
      //   insurance_card_and_id_image: ["", [Validators.required]],
      // }),
    });

    this.addVitals = this.fb.group({
      height: ["", [Validators.required]],
      weight: ["", [Validators.required]],
      h_rate: ["", [Validators.required]],
      bmi: ["", [Validators.required]],
      bp: ["", [Validators.required]],
      pulse: ["", [Validators.required]],
      resp: ["", [Validators.required]],
      temp: ["", [Validators.required]],
      blood_group: ["", [Validators.required]],
      clearance: ["", [Validators.required]],
      hepatics_summary: ["", [Validators.required]],
    });

    this.medicine = this.fb.group({
      current_medicines: this.fb.array([]),
      past_medicines: this.fb.array([]),
    });

    this.immunizationForm = this.fb.group({
      immunization: this.fb.array([]),
    });

    this.historyForm = this.fb.group({
      patient_history: this.fb.array([]),
      allergies: this.fb.array([]),
      lifestyle: this.fb.array([]),
      familial_history: this.fb.array([]),
    });

    this.medicalDocumentForm = this.fb.group({
      medical_document: this.fb.array([]),
    });

    this.familyMembersForm = this.fb.group({
      family_members: this.fb.array([]),
      medical_history: this.fb.array([]),
      social_history: this.fb.array([]),
    });

    this.countryCodes = ["+226(BF)", "+229(BJ)", "+225(CI)", "+223(ML)", "+221(SN)", "+228(TG)"];

    this.addVitals.get('height').valueChanges.subscribe(() => {
      this.calculateBMI();
    });

    this.addVitals.get('weight').valueChanges.subscribe(() => {
      this.calculateBMI();
    });

    this.familyMemberForm = this.fb.group({
      firstName: ["", [Validators.required]],
      lastName: ["", [Validators.required]],
      relationship: ["", [Validators.required]],
      mobileNumber: ["", [Validators.required]],
      gender: ["", [Validators.required]],
      dob: ["", [Validators.required]],
      profileKey: ["", []],
      patientId: [""],
      familyMemberId: [""],
      countryCode: ["+966"]
    });

    this.medicalHistoryForm = this.fb.group({
      allergen: ["", [Validators.required]],
      allergyType: ["", [Validators.required]],
      reaction: ["", [Validators.required]],
      status: ["", [Validators.required]],
      patientId: ["", [Validators.required]],
      familyMember: [""],
      note: [""],
      id: [""],
      createdAt: [""]
    });

    this.socialHistoryForm = this.fb.group({
      alcohol: [false, ],
      tobacco: [false, ],
      drugs: [false, ],
      familyMember: [""],
      patientId: ["", [Validators.required]],
      id: [""],
      createdAt: [""]
    });

  }

  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  };

  ngAfterViewInit() {
    if (this.phone) {
      const input = this.phone.nativeElement;
      this.iti = intlTelInput(input, {
        initialCountry: "SA",
        separateDialCode: true,
      });
      this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
    } else {
      console.error("Phone input element is not available.");
    }
  }


  ngOnInit(): void {
    var d = new Date();
    d.setMonth(d.getMonth() - 3);
    this.maxDOB = d;
    let tabIndex = parseInt(sessionStorage.getItem("tabIndex"));
    this.selectedIndex = tabIndex;
    let loginData = this._coreService.getLocalStorage("loginData");
    let adminData = this._coreService.getLocalStorage("profileData");
    this.patient_id = loginData._id;
    this.patientDOB = adminData?.dob;
    let fullName: any = [];
    if (adminData?.full_name) {
      fullName = adminData?.full_name.split(" ");
    }
    let patientAge = this.calculateAge(adminData?.dob);

    this.personalDetails.patchValue({
      first_name: fullName[0] ? fullName[0] : "",
      // middle_name: fullName[1] ? fullName[1] : "",
      last_name: fullName[2] ? fullName[2] : "",
      first_name_arabic: loginData.first_name_arabic,
      last_name_arabic: loginData.last_name_arabic,
      email: (loginData?.email).toLowerCase(),
      mobile: loginData?.mobile,
      gender: adminData?.gender,
      blood_group: adminData?.blood_group,
      dob: adminData?.dob,
      age: patientAge,
      marital_status: adminData?.marital_status,
    });
    // this.addNewCurrentMedicine();
    // this.addNewPastMedicine();

    // this.addNewPatient_History();
    // this.addNewAllergies();
    // this.addNewLifestyle();
    // this.addNewFamilial_history();

    // this.addNewFamilyMember();
    // this.addNewMedicalHistory();
    // this.addNewSocialHistory();

    // this.addNewMedicalDocument();
    this.getProfileDetails();
    // this.getPatientHistoryTypeList();
    // this.getAllAllergies();
    // this.getLifestyleList();
    // this.getFamilyHistoryType();

    // this.getCommonData();
    // this.getImmunizationList();

    // this.getInsuranceCompanyList();

    // this.addMobPay();
    // this.insuranceDetails
    //   .get("is_primary_is_secondary")country_code
    //     distinctUntilChanged(),
    //     switchMap((isSameAddress) => {
    //       if (isSameAddress) {
    //         return this.insuranceDetails
    //           .get("primary_insured")
    //           .valueChanges.pipe(
    //             startWith(this.insuranceDetails.get("primary_insured").value),
    //             tap((value) =>
    //               this.insuranceDetails.get("secondary_insured").setValue(value)
    //             )
    //           );
    //       } else {
    //         this.insuranceDetails.get("secondary_insured").reset();
    //         return EMPTY;
    //       }
    //     })
    //   )
    //   .subscribe();
    this.getFamilyMembersListOfPatient();
    this.getDeletedFamilyMembersListOfPatient();
    this.getDiagnosisDetails();
    this.getMedicalHistoryDetails();
    this.getSocialHistoryDetails();
  }

  //All Family Member Functionality Below

  getFamilyMembersListOfPatient() {
    let params = {
      patient_id: this.patient_id,
    };
    this.service.getFamilyMembersList(params).subscribe((res: any) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response?.status == true) {
        this.familyMemberList = response?.data?.familyMember;
      } else {
        this.familyMemberList = []
      }
    })
  }

  getDeletedFamilyMembersListOfPatient() {
    let params = {
      patient_id: this.patient_id,
    };
    this.service.getDeletedFamilyMembersList(params).subscribe((res: any) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response?.status == true) {
        this.deletedFamilyMemberList = response?.data?.deletedFamilyMember
      } else {
        this.deletedFamilyMemberList = []
      }
    })
  }

  getDiagnosisDetails() {
    let params = {
      page: this.page,
      limit: this.pageSize,
      patientId: this.patient_id,
      doctorId: "",
      appointmentId: "",
      fromDate: "",
      toDate: ""
    };
    this.service.getDiagnosisListApi(params).subscribe((res: any) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response?.status == true) {
        this.diagnosisData = response?.body?.result;
        this.totalLengthDagnosis = response?.body?.totalRecords
      } else {
        this.diagnosisData = []
      }
    })
  }

  handlePageEventForDiagnosis(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getDiagnosisDetails();
  }

  //Medical History

  getMedicalHistoryDetails() {
    let params = {
      patientId: this.patient_id
    };
    this.service.medicalHistoryDetail(params).subscribe((res: any) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response?.status == true) {
        this.medicalData = response?.data;
        this.totalLengthMedical = this.medicalData?.length;
      } else {
        this.medicalData = []
      }
    })
  }

  handlePageEventForMedicalHistory(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getMedicalHistoryDetails();
  }

  openAddMedicalHistoryPopup(addMedicalHistory: any, historyRecordId: any) {
    if (!historyRecordId) {
      this.isMedicalEditModalOpen = false;
      this.modalService.open(addMedicalHistory, {
        centered: true,
        size: "lg",
        windowClass: "master_modal add_lab",
      });
    } else {
      this.isMedicalEditModalOpen = true;
      this.modalService.open(addMedicalHistory, {
        centered: true,
        size: "lg",
        windowClass: "master_modal add_lab",
      });
      let selectedMedicalRecord = this.medicalData.find((item: any) => {
        return item._id == historyRecordId
      })
      this.medicalHistoryForm.patchValue({
        allergen: selectedMedicalRecord.allergen,
        allergyType: selectedMedicalRecord.allergyType,
        reaction: selectedMedicalRecord.reaction,
        status: selectedMedicalRecord.status,
        patientId: this.patient_id,
        familyMember: '',
        note: selectedMedicalRecord.note,
        createdAt: selectedMedicalRecord.createdAt,
        id: selectedMedicalRecord._id
      })
    }
  }

  onRadioSelectionChange(event: any): void {
    if (event.value === "familyMember") {
      this.showFamilyDropdown = true;
      this.medicalHistoryForm.controls['familyMember'].setValidators([Validators.required]);
    } else {
      this.showFamilyDropdown = false;
      this.medicalHistoryForm.controls['familyMember'].clearValidators();
    }
    this.medicalHistoryForm.controls['familyMember'].updateValueAndValidity();
  }

  onSubmitMedicalHistory(): void {
    if (this.medicalHistoryForm.invalid) {
      this.toastr.error('Please fill in all required fields.');
      return;
    }
    if (this.showFamilyDropdown) {
      this.medicalHistoryForm.patchValue({
        patientId: this.medicalHistoryForm.get('familyMember')?.value,
        createdAt: new Date()
      });
    } else {
      this.medicalHistoryForm.patchValue({
        patientId: this.patient_id,
        createdAt: new Date()
      });
    }

    if (!this.isMedicalEditModalOpen) {
      const formData = this.medicalHistoryForm.value;
      this.service.addMedicalHistory(formData).subscribe(
        (res: any) => {
          let response = this._coreService.decryptObjectData({ data: res });
          if (response?.status === true) {
            this.toastr.success(response.message);
            this.closePopup()
            this.medicalHistoryForm.reset();
            this.showFamilyDropdown = false;
            this.getMedicalHistoryDetails();
          } else {
            this.toastr.error(response.message);
          }
        },
        (error: any) => {
          this.toastr.error('An error occurred while saving medical history.');
        }
      );
    } else {
      const formData = this.medicalHistoryForm.value;
      this.service.updateMedicalHistory(formData).subscribe(
        (res: any) => {
          let response = this._coreService.decryptObjectData({ data: res });
          if (response?.status === true) {
            this.toastr.success(response.message);
            this.closePopup()
            this.medicalHistoryForm.reset();
            this.showFamilyDropdown = false;
            this.getMedicalHistoryDetails();
          } else {
            this.toastr.error(response.message);
          }
        },
        (error: any) => {
          this.toastr.error('An error occurred while saving medical history.');
        }
      );
    }
  }

  //Social History

  getSocialHistoryDetails() {
    let params = {
      patientId: this.patient_id
    };
    this.service.socialHistoryDetail(params).subscribe((res: any) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response?.status == true) {
        this.socialData = response?.data;
        this.totalLengthSpcial = this.socialData?.length;
      } else {
        this.socialData = []
      }
    })
  }

  openAddSocialHistoryPopup(addSocialHistory: any, socialRecordId: any) {
    this.socialHistoryForm.reset();
    if (!socialRecordId) {
      this.isSocialEditModalOpen = false;
      this.modalService.open(addSocialHistory, {
        centered: true,
        size: "lg",
        windowClass: "master_modal add_lab",
      });
    } else {
      this.isSocialEditModalOpen = true;
      this.modalService.open(addSocialHistory, {
        centered: true,
        size: "lg",
        windowClass: "master_modal add_lab",
      });
      let selectedSocialRecord = this.socialData.find((item: any) => {
        return item._id == socialRecordId
      })
      this.socialHistoryForm.patchValue({
        alcohol: selectedSocialRecord.alcohol,
        drugs: selectedSocialRecord.drugs,
        tobacco: selectedSocialRecord.tobacco,
        patientId: this.patient_id,
        createdAt: selectedSocialRecord.createdAt,
        id: selectedSocialRecord._id
      })
    }
  }

  onSubmitSocialHistory(){
    if (this.socialHistoryForm.invalid) {
      this.toastr.error('Please fill in all required fields.');
      return;
    }
    if (this.showFamilyDropdown) {
      this.socialHistoryForm.patchValue({
        patientId: this.socialHistoryForm.get('familyMember')?.value,
        createdAt: new Date()
      });
    } else {
      this.socialHistoryForm.patchValue({
        patientId: this.patient_id,
        createdAt: new Date()
      });
    }

    if (!this.isSocialEditModalOpen) {
      const formData = this.socialHistoryForm.value;
      
      this.service.addSocialHistory(formData).subscribe(
        (res: any) => {
          let response = this._coreService.decryptObjectData({ data: res });
          if (response?.status === true) {
            this.toastr.success(response.message);
            this.closePopup()
            this.socialHistoryForm.reset();
            this.showFamilyDropdown = false;
            this.getSocialHistoryDetails();
          } else {
            this.toastr.error(response.message);
          }
        },
        (error: any) => {
          this.toastr.error('An error occurred while saving medical history.');
        }
      );
    } else {
      const formData = this.socialHistoryForm.value;
      
      this.service.updateSocialHistory(formData).subscribe(
        (res: any) => {
          let response = this._coreService.decryptObjectData({ data: res });
          if (response?.status === true) {
            this.toastr.success(response.message);
            this.closePopup()
            this.socialHistoryForm.reset();
            this.showFamilyDropdown = false;
            this.getSocialHistoryDetails();
          } else {
            this.toastr.error(response.message);
          }
        },
        (error: any) => {
          this.toastr.error('An error occurred while saving medical history.');
        }
      );
    }
  }

  handlePageEventForSocialHistory(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getSocialHistoryDetails();
  }

  onImageChange(event: any) {
    if (event.target.files.length > 0) {
      let file = event.target.files[0];
      let formData: any = new FormData();
      formData.append("userId", this.patient_id);
      formData.append("docType", "profile");
      formData.append("multiple", "false");
      formData.append("file", file);
      formData.append("serviceType", "patient")

      this.profilePicFile = formData;

      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.familyMemberProfileImage = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  async onSubmitFamilyAdd() {
    if (this.familyMemberForm.valid) {
      this.loader.start();
      if (!this.editFamilyMemberFormOpen) {
        if (this.familyMemberProfileImage != null) {
          await this.uploadDocuments(this.profilePicFile).then((res: any) => {
            if (res[0]) {
              this.familyMemberForm.patchValue({
                profileKey: res[0]
              });
            }
          });
        }
        this.familyMemberForm.patchValue({
          patientId: this.patient_id
        });
        const formData = this.familyMemberForm.value;
        this.service.addFamilyMembers(formData).subscribe((res: any) => {

          let response = this._coreService.decryptObjectData(res);


          if (response?.status == true) {
            this.loader.stop();
            this.toastr.success(response.message);
            this.familyMemberForm.reset()
            this.getFamilyMembersListOfPatient()
          } else {
            this.loader.stop();
            this.toastr.error(response.message);
          }
        })
      } else {
        if (this.familyMemberProfileImage != null && this.profilePicFile !== null) {
          await this.uploadDocuments(this.profilePicFile).then((res: any) => {
            if (res[0]) {
              this.familyMemberForm.patchValue({
                profileKey: res[0]
              });
            }
          });
        }
        const formData = this.familyMemberForm.value;
        this.service.editFamilyMembers(formData).subscribe((res: any) => {

          let response = this._coreService.decryptObjectData({ data: res });

          if (response?.status == true) {
            this.loader.stop();
            this.toastr.success(response.message);
            this.closePopup()
            this.getFamilyMembersListOfPatient()
          } else {
            this.loader.stop();
            this.toastr.error(response.message);
          }
        })

      }

    } else {
      this.familyMemberForm.markAllAsTouched();
    }
  }
  public handleClose() {
    this.closePopup()
  }
  submitAction() {
    let data = {
      familyMemberId: this.familyMemberId,
      actionValue: this.actionvalue,
      patientId: this.patient_id
    }
    this.service.deleteFamilyMembers(data).subscribe((res: any) => {

      let response = this._coreService.decryptObjectData({ data: res });

      if (response?.status == true) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.closePopup()
        this.getFamilyMembersListOfPatient()
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    })
  }

  public openDeletefamilyMemberPopup(actionPopup: any, familyMemberId: string) {
    this.familyMemberId = familyMemberId;
    this.actionvalue = true;
    this.modalService.open(actionPopup, { centered: true, size: 'lg' });
  }

  openAddFamilyMemberPopup(addFamilyMember: any, familyMemberId: any) {
    if (familyMemberId === '' || !familyMemberId) {
      this.editFamilyMemberFormOpen = false;
      this.modalService.open(addFamilyMember, {
        centered: true,
        size: "lg",
        windowClass: "master_modal add_lab",
      });
    } else {
      this.editFamilyMemberFormOpen = true;
      let editFamilyMember = this.familyMemberList.find((item: any) => {
        return item.familyMemberId === familyMemberId
      })
      if (editFamilyMember) {
        if (editFamilyMember?.signedUrl) {
          this.familyMemberProfileImage = editFamilyMember?.signedUrl
        }
        this.familyMemberForm.patchValue({
          familyMemberId: editFamilyMember.familyMemberId,
          patientId: this.patient_id,
          firstName: editFamilyMember?.first_name,
          lastName: editFamilyMember?.last_name,
          relationship: editFamilyMember?.relationship,
          mobileNumber: editFamilyMember?.mobile_number,
          gender: editFamilyMember?.gender,
          dob: editFamilyMember?.dob,
          profileKey: editFamilyMember?.profile_pic,
          countryCode: editFamilyMember?.countryCode
        })
      }
      this.modalService.open(addFamilyMember, {
        centered: true,
        size: "lg",
        windowClass: "master_modal add_lab",
      });
    }
  }
  closePopup() {
    this.familyMemberForm.reset();
    this.medicalHistoryForm.reset();
    this.modalService.dismissAll("close");
  }

  numberFunc(event: any = ''): boolean {
    if (event.type === 'paste') {
      // Handle paste action
      const clipboardData = event.clipboardData || (window as any).clipboardData;
      const pastedText = clipboardData.getData('text');
      const regex = new RegExp("^[0-9]+$");

      if (!regex.test(pastedText)) {
        event.preventDefault();
        return false;
      }
    } else {
      // Handle key press action
      const key = event.key;
      const regex = new RegExp("^[0-9]+$");

      if (!regex.test(key)) {
        event.preventDefault();
        return false;
      }
    }

    return true; // Return true for allowed key press or paste
  }


  getCountryCode() {
    var country_code = '';

    const countryData = (window as any).intlTelInputGlobals.getCountryData();
    for (let i = 0; i < countryData.length; i++) {
      if (countryData[i].dialCode === this.selectedcountrycodedb.split("+")[1]) {
        country_code = countryData[i].iso2;

        break; // Break the loop when the country code is found
      }
    }
    const input = this.mobile.nativeElement;
    this.iti = intlTelInput(input, {
      initialCountry: country_code,
      separateDialCode: true,
    });
    this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;

  }

  mobilePayValidation(index) {
    let abc = this.personalDetails.get("mobilePayDetails") as FormArray;
    const formGroup = abc.controls[index] as FormGroup;
    return formGroup;
  }

  get mobilePayDetails() {
    return this.personalDetails.controls["mobilePayDetails"] as FormArray;
  }

  addMobPay() {
    const addMobPay = this.fb.group({
      provider: [""],
      pay_number: [""],
      mobile_country_code: [this.countryCodes[0]]
    });
    this.mobilePayDetails.push(addMobPay);
  }

  removeMobPay(index: number) {
    this.mobilePayDetails.removeAt(index);
  }

  async handlePersonalDetails() {
    this.isSubmitted = true;

    if (this.personalDetails.invalid) {
      this.personalDetails.markAllAsTouched();
      const firstInvalidField = document.querySelector(
        'input.ng-invalid, input.ng-invalid'
      );
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      this.toastr.error("All Field are required!")
      return;
    }
    // if (this.personalDetails.invalid) {
    //   this.toastr.error("All Fields are required.")

    //   return;
    // }
    this.isSubmitted = false;
    this.loader.start();

    if (this.profilePicFile != null) {
      await this.uploadDocuments(this.profilePicFile).then((res: any) => {
        this.personalDetails.patchValue({
          profile_pic: res[0],
        });
      });
    }
    let data = this.personalDetails.value;
    let reqData = {
      ...this.personalDetails.value,
      patient_id: this.patient_id,
      country_code: this.selectedCountryCode,
      // mobile_pay_details: data?.mobilePayDetails,
    };

    this.service.personalDetails(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      if (response.status == true) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.profilePicFile = null;
        this.goForward();
        // this._coreService.setLocalStorage(
        //   response?.body?.checkUpdate,
        //   "loginData"
        // );
        // this._coreService.setLocalStorage(
        //   response?.body?.profileData,
        //   "profileData"
        // );
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  async handleInsuranceDetails() {
    this.isSubmitted = true;
    if (this.insuranceDetails.invalid) {
      return;
    }
    this.isSubmitted = false;

    if (this.primaryInsuredFile != null) {
      await this.uploadDocuments(this.primaryInsuredFile).then((res: any) => {
        this.insuranceDetails.patchValue({
          primary_insured: {
            insurance_card_and_id_image: res.data[0].Key,
          },
        });
      });
    }

    if (this.secondaryInsuredFile != null) {
      await this.uploadDocuments(this.secondaryInsuredFile).then((res: any) => {
        this.insuranceDetails.patchValue({
          secondary_insured: {
            insurance_card_and_id_image: res.data[0].Key,
          },
        });
      });
    }

    let reqData = {
      patient_id: this.patient_id,
      ...this.insuranceDetails.value,
    };
    this.loader.start();
    this.service.insuranceDetails(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.goForward();
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  calculateBMI(): void {
    const height = this.addVitals.get('height').value;
    const weight = this.addVitals.get('weight').value;

    if (height && weight) {
      const bmi = (weight / (height * height)).toFixed(2); // Calculate BMI
      this.addVitals.get('bmi').setValue(bmi); // Update BMI value in the form
    }
  }

  handleAddVitals() {
    let reqData = { ...this.addVitals.value, patient_id: this.patient_id };
    this.loader.start();
    this.service.addVitals(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.goForward();
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }
  hasValueInFields(row: AbstractControl, filedarray: Array<any>): boolean {
    let newarray = false;
    filedarray.forEach(element => {
      if (row.get(element).value) {
        newarray = true;
      }
    });

    // const field1Value = row.get('field1').value;
    // const field2Value = row.get('field2').value;
    // Add more fields as needed

    return newarray; // Return true if any field has a value
  }


  handleMedicines() {
    this.isSubmitted = true;
    const rowcurrent_medicines = this.medicine.get("current_medicines") as FormArray;
    const rowpast_medicines = this.medicine.get("past_medicines") as FormArray;
    if (
      (rowcurrent_medicines.controls.some(row => this.hasValueInFields(row, ['medicine', 'dose', 'frequency', 'strength', 'start_date', 'end_date'])))
      || (rowpast_medicines.controls.some(row1 => this.hasValueInFields(row1, ['medicine', 'dose', 'frequency', 'strength', 'start_date', 'end_date'])))
    ) {
      // 
      this.isSubmitted = false;
      let reqData = { patient_id: this.patient_id, ...this.medicine.value };
      //  return
      this.loader.start();
      this.service.medicines(reqData).subscribe((res) => {
        let response = this._coreService.decryptObjectData(res);
        if (response.status) {
          this.loader.stop();
          this.toastr.success(response.message);
          this.goForward();

        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      });
    }
    else {
      this.goForward();
      this.loader.stop();
    }



  }

  handleImmunization() {
    this.isSubmitted = true;
    // if (this.immunizationForm.get("immunization").invalid) {
    //   return;
    // }
    this.isSubmitted = false;
    let reqData = {
      patient_id: this.patient_id,
      ...this.immunizationForm.value,
    };
    this.loader.start();
    this.service.immunizations(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);

      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.selectImmunization = [];
        this.selectImmunization_id = [];
        this.goForward();
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  clearFormArray = (formArray: FormArray) => {

    var i = 0;
    while (i < formArray.length) {

      formArray.removeAt(i)
    }
  }

  handlePatientHistory() {
    this.isSubmitted = true;
    // if (this.historyForm.invalid) {
    //   return;
    // }
    this.isSubmitted = false;
    this.loader.start();
    let reqData = { patient_id: this.patient_id, ...this.historyForm.value };
    this.service.patientHistory(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.goForward();
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  handleMedicalDocuments() {
    this.isSubmitted = true;
    if (this.medicalDocumentForm.invalid) {
      this._coreService.showError("", "Please upload image!")
      return;
    }
    this.isSubmitted = false;

    let reqData = {
      patient_id: this.patient_id,
      ...this.medicalDocumentForm.value,
    };
    this.loader.start();
    this.service.medicalDocuments(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.goForward();
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  handleFamilyDetails() {
    this.isSubmitted = true;
    if (this.familyMembersForm.invalid) {
      return;
    }
    this.isSubmitted = false;

    let reqData = {
      patient_id: this.patient_id,
      ...this.familyMembersForm.value,
    };
    this.loader.start();
    this.service.dependentFamilyMembers(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.route.navigate(["/patient/dashboard"]);
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  getProfileDetails() {
    let params = {
      patient_id: this.patient_id,
    };
    this.service.profileDetails(params).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      let profile = response.body;

      this.pathcPersonalDetails({
        profile: response.body?.personalDetails,
        in_location: response.body?.locationDetails,
        in_mobile_pay: response?.body?.mobilePayDetails
      });
      this.vaccinationData = response.body?.immunizationDetails;
      this.insuranceData = response.body?.insuranceDetails;
      this.selectedcountrycodedb = response?.body?.portalUserDetails?.country_code;

      // this.patchInsuranceDetails(response.body?.insuranceDetails);
      // this.patchVitals(response.body?.vitalsDetails);
      // this.patchMedicines(response.body?.medicineDetails);
      // this.patchHistory(response.body?.historyDetails);
      // this.patchMedicalDocumnets(response.body?.medicalDocument);
      // this.patchFamilyMembers(response.body?.familyDetails);
      this.getCountryCode();
    });
  }

  //-----------------Patch Value Section----------------------------------
  patientSaveInsuranceDetails: any;
  pathcPersonalDetails(data: any) {
    if (data?.in_mobile_pay) {
      data?.in_mobile_pay?.mobilePay.forEach((element) => {
        this.addMobPay();
      });
    } else {
      this.addMobPay();
    }
    this.patientSaveInsuranceDetails = data;

    let patientAge = this.calculateAge(data?.profile?.dob);
    this.personalDetails.patchValue({
      ...data?.profile,
      ...data?.profile?.for_portal_user,
      ...data?.in_location,
      age: patientAge,
      // mobilePayDetails: data?.in_mobile_pay?.mobilePay
    });

    this.profileImage = data?.profile?.profile_pic_signed_url;

    this.showAddressComponent = true;
  }

  showOtherSearchFields: boolean = true;
  addedInsId: any = "";

  patchInsuranceDetails(insurance: any) {
    if (insurance) {
      this.actualsubscriberId = insurance?.subscriber_id
      this.showOtherSearchFields = true;
      this.addedInsId = insurance?.insurance_id;
      // this.viewSubscriberDetails(insurance?.primary_subscriber_id);
    } else {
      this.showOtherSearchFields = true;
    }

    this.insuranceDetails.patchValue({
      insurance_id: insurance?.insurance_id,
    });
  }

  patchVitals(vitals: any) {
    // this.addVitals.patchValue(vitals[0]);
  }

  patchMedicines(medicines: any) {
    for (let i = 0; i < medicines?.current_medicines.length - 1; i++) {
      this.addNewCurrentMedicine();
    }
    for (let i = 0; i < medicines?.past_medicines.length - 1; i++) {
      this.addNewPastMedicine();
    }
    this.medicine.patchValue(medicines);
  }


  patchHistory(history: any) {
    for (let i = 0; i < history?.patient_history.length - 1; i++) {
      this.addNewPatient_History();
    }
    for (let i = 0; i < history?.familial_history.length - 1; i++) {
      this.addNewFamilial_history();
    }
    for (let i = 0; i < history?.allergies.length - 1; i++) {
      this.addNewAllergies();
    }
    for (let i = 0; i < history?.lifestyle.length - 1; i++) {
      this.addNewLifestyle();
    }
    this.historyForm.patchValue(history);
  }


  patchMedicalDocumnets(docs: any) {

    this.documentsData = docs;
  }

  patchFamilyMembers(family: any) {
    for (let i = 0; i < family?.family_members.length - 1; i++) {
      this.addNewFamilyMember();
    }
    for (let i = 0; i < family?.social_history.length - 1; i++) {
      this.addNewSocialHistory();
    }
    for (let i = 0; i < family?.medical_history.length - 1; i++) {
      this.addNewMedicalHistory();
    }
    this.familyMembersForm.patchValue(family);
  }

  primaryInsuredFile: FormData = null;
  secondaryInsuredFile: FormData = null;

  //--------------------------Upload File Section------------------------------
  onFileChange(event: any, file_for: string) {
    let file = event.target.files[0];
    let formData: any = new FormData();
    formData.append("userId", this.patient_id);
    formData.append("docType", file_for);
    formData.append("multiple", "false");
    formData.append("docName", file);

    if (file_for === "primary_insured") {
      this.primaryInsuredFile = formData;
    } else {
      this.secondaryInsuredFile = formData;
    }
  }

  //For Patient Profile
  async onProfilePicChange(event: any) {
    if (event.target.files.length > 0) {
      let file = event.target.files[0];
      let formData: any = new FormData();
      formData.append("userId", this.patient_id);
      formData.append("docType", "profile");
      formData.append("multiple", "false");
      formData.append("file", file);
      formData.append("serviceType", "patient")

      this.profilePicFile = formData;

      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.profileImage = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  //For Documents
  async onMedicalDocChange(event: any, index: any) {
    if (event.target.files.length > 0) {
      let file = event.target.files[0];
      let formData: any = new FormData();
      formData.append("userId", this.patient_id);
      formData.append("docType", index);
      formData.append("multiple", "false");
      formData.append("docName", file);

      await this.uploadDocuments(formData).then((res: any) => {
        this.medical_document.at(index).patchValue({
          image: res.data[0].Key,
        });
      });
    }
  }

  uploadDocuments(doc: FormData) {
    return new Promise((resolve, reject) => {
      this.service.uploadFile(doc).subscribe(
        (res) => {
          let response = this._coreService.decryptObjectData(res);
          if (response?.status) {
            this._coreService.showSuccess("", response.message)
          }
          resolve(response);

        },
        (err) => {
          let errResponse = this._coreService.decryptObjectData({
            data: err.error,
          });
          this.toastr.error(errResponse.messgae);
        }
      );
    });
  }

  //-------------------------personal details handling---------------

  //------------------------Medicine Form Handling--------------------------
  currentMedicineValidation(index) {
    let medicineList = this.medicine.get("current_medicines") as FormArray;
    const formGroup = medicineList.controls[index] as FormGroup;
    return formGroup;
  }

  pastMedicineValidation(index) {
    let medicineList = this.medicine.get("past_medicines") as FormArray;
    const formGroup = medicineList.controls[index] as FormGroup;
    return formGroup;
  }

  get current_medicines() {
    return this.medicine.controls["current_medicines"] as FormArray;
  }

  get past_medicines() {
    return this.medicine.controls["past_medicines"] as FormArray;
  }

  addNewCurrentMedicine() {
    const currentNewMedicineForm = this.fb.group({
      medicine: [""],
      dose: [""],
      frequency: [""],
      strength: [""],
      start_date: [""],
      end_date: [""],
    });
    this.current_medicines.push(currentNewMedicineForm);
  }

  addNewPastMedicine() {
    const pastNewMedicineForm = this.fb.group({
      medicine: [""],
      dose: [""],
      frequency: [""],
      strength: [""],
      start_date: [""],
      end_date: [""],
    });
    this.past_medicines.push(pastNewMedicineForm);
  }

  deleteCurrentMedicine(index: number) {
    this.current_medicines.removeAt(index);

  }

  deletePastMedicine(index: number) {
    this.past_medicines.removeAt(index);
  }

  //-----------------------------History Form Handling-----------------------------
  patientHistoryValidation(index, validation_for: any) {
    let passString = "";
    if (validation_for === 1) {
      passString = "patient_history";
    } else if (validation_for === 2) {
      passString = "allergies";
    } else if (validation_for === 3) {
      passString = "lifestyle";
    } else {
      passString = "familial_history";
    }

    let historyForm = this.historyForm.get(passString) as FormArray;
    const formGroup = historyForm.controls[index] as FormGroup;
    return formGroup;
  }

  get patient_history() {
    return this.historyForm.controls["patient_history"] as FormArray;
  }

  get allergies() {
    return this.historyForm.controls["allergies"] as FormArray;
  }

  get lifestyle() {
    return this.historyForm.controls["lifestyle"] as FormArray;
  }

  get familial_history() {
    return this.historyForm.controls["familial_history"] as FormArray;
  }

  addNewPatient_History() {
    const newHistoryForm = this.fb.group({
      type: [""],
      name: [""],
      start_date: [""],
    });
    this.patient_history.push(newHistoryForm);
  }

  addNewAllergies() {
    const newAllergies = this.fb.group({
      type: [""],
      start_date: [""],
    });
    this.allergies.push(newAllergies);
  }

  addNewLifestyle() {
    const newLifestyle = this.fb.group({
      type: [""],
      type_name: [""],
      start_date: [""],
    });
    this.lifestyle.push(newLifestyle);
  }

  addNewFamilial_history() {
    const newFamilialHistory = this.fb.group({
      relationship: [""],
      family_history_type: [""],
      history_name: [""],
      start_date: [""],
    });
    this.familial_history.push(newFamilialHistory);
  }

  deletePatient_History(index: number) {
    this.patient_history.removeAt(index);
  }

  deleteAllergies(index: number) {
    this.allergies.removeAt(index);
  }

  deleteLifestyle(index: number) {
    this.lifestyle.removeAt(index);
  }

  deleteFamilialHistory(index: number) {
    this.familial_history.removeAt(index);
  }

  //--------------------------Medical Documnets Form Handling------------------------
  medDocValidation(index) {
    let docs = this.medicalDocumentForm.get("medical_document") as FormArray;
    const formGroup = docs.controls[index] as FormGroup;
    return formGroup;
  }

  get medical_document() {
    return this.medicalDocumentForm.controls["medical_document"] as FormArray;
  }

  addNewMedicalDocument() {
    const newMedicalDoc = this.fb.group({
      name: ["", [Validators.required]],
      issue_date: ["", [Validators.required]],
      expiration_date: [""],
      image: ["", [Validators.required]],
    });
    this.medical_document.push(newMedicalDoc);
  }

  deleteMedicalDoc(index: number) {
    this.medical_document.removeAt(index);
  }

  //--------------------------Family members Form Handling---------------------------
  familyValidations(index, validation_for: any) {
    let passString = "";
    if (validation_for === 1) {
      passString = "family_members";
    } else if (validation_for === 2) {
      passString = "medical_history";
    } else {
      passString = "social_history";
    }

    let docs = this.familyMembersForm.get(passString) as FormArray;
    const formGroup = docs.controls[index] as FormGroup;
    return formGroup;
  }

  get family_members() {
    return this.familyMembersForm.controls["family_members"] as FormArray;
  }

  get medical_history() {
    return this.familyMembersForm.controls["medical_history"] as FormArray;
  }

  get social_history() {
    return this.familyMembersForm.controls["social_history"] as FormArray;
  }

  addNewFamilyMember() {
    const newFamilyMember = this.fb.group({
      first_name: [""],
      last_name: [""],
      ssn_number: [""],
      gender: [""],
      relationship: [""],
      dob: [""],
      mobile_number: [
        "",

      ],
    });
    this.family_members.push(newFamilyMember);
  }

  addNewMedicalHistory() {
    const newMedicalHistory = this.fb.group({
      allergy_type: [""],
      allergen: [""],
      note: [""],
      reaction: [""],
      status: [""],
      created_date: [""],
    });
    this.medical_history.push(newMedicalHistory);
  }

  addNewSocialHistory() {
    const newSocialHistory = this.fb.group({
      alcohol: [""],
      tobacco: [""],
      drugs: [""],
      occupation: [""],
      travel: [""],
      start_date: [""],
    });
    this.social_history.push(newSocialHistory);
  }

  deleteFamilyMember(index: number) {
    this.family_members.removeAt(index);
  }
  deleteMedicalHistory(index: number) {
    this.medical_history.removeAt(index);
  }
  deleteSocialHistory(index: number) {
    this.social_history.removeAt(index);
  }

  handleDOBChange(event: any, dob_for: any) {
    let patientAge = this.calculateAge(event.value);

    if (dob_for === "personalDetails") {
      this.personalDetails.patchValue({
        age: patientAge,
      });
    } else if (dob_for === "primary_insured") {
      this.insuranceDetails.patchValue({
        primary_insured: { age: patientAge },
      });
    } else {
      this.insuranceDetails.patchValue({
        secondary_insured: { age: patientAge },
      });
    }
  }

  // calculateAge(dob: any) {
  //   let timeDiff = Math.abs(Date.now() - new Date(dob).getTime());
  //   let patientAge = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);
  //   return patientAge;
  // }

  calculateAge(dob: any) {
    const dobParts = dob.split('-');  // Split the date by '-'
    if (dobParts.length === 3) {
      // Reorder to YYYY-MM-DD
      const formattedDob = `${dobParts[2]}-${dobParts[1]}-${dobParts[0]}`;
      const parsedDob = new Date(formattedDob);

      if (isNaN(parsedDob.getTime())) {
        return 'Invalid Date';
      }

      let timeDiff = Math.abs(Date.now() - parsedDob.getTime());
      let patientAge = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);
      return patientAge;
    } else {
      return 'Invalid Date';
    }
  }


  get f() {
    return this.personalDetails.controls;
  }

  get f2() {
    return this.insuranceDetails.controls;
  }

  get emergency_contact_validation() {
    let emergency_contact = this.personalDetails.get(
      "emergency_contact"
    ) as FormGroup;

    return emergency_contact.controls;
  }

  goBack() {
    this.mainStepper.previous();
  }

  goForward() {
    this.mainStepper.next();
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  getCommonData() {
    this.service.commonData().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      this.genderList = response?.body?.gender;
      this.bloodGroupList = response?.body?.bloodGroup;
      this.martialStatusList = response?.body?.martialStatus;
      this.spokenLanguageList = response?.body?.spokenLanguage;
      this.relationshipList = response?.body?.relationship;
    });
  }

  getImmunizationList() {
    this.service.vaccineList().subscribe(async (res) => {
      let response = this._coreService.decryptObjectData({ data: res });

      this.immunizationList = response?.data?.result;
      this.immunizationList2 = await this._coreService.createselect2array(this.immunizationList, 'name', 'name', 'Select Vaccination')
    });
  }
  getPatientHistoryTypeList() {
    this.service.patientHistoryTypeList().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      this.patientHistoryTypeList = response?.body;
    });
  }

  getAllAllergies() {
    this.service.allergiesList().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      this.allergyList = response?.body;
    });
  }

  getLifestyleList() {
    this.service.lifestyleTypeList().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      this.lifestyleList = response?.body;
    });
  }

  getFamilyHistoryType() {
    this.service.familyHistoryTypeList().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      this.familyHistoryTypeList = response?.body;
    });
  }

  //----------------Insurance tab changes work-----------------
  insuranceCompanyList: any[] = [];
  primaryInsurance: any;
  secondaryInsurance: any[] = [];
  showInsurance: any = false;
  subscriberDetails: any;

  getInsuranceCompanyList() {

    this.service.getInsuanceList(true).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);

      let insuranceArray = [];

      response?.body?.result.map((curentval, index: any) => {

        if (curentval?.profileinfos?.for_portal_user !== null) {
          if (this.insuranceCompanyList.indexOf({
            label: curentval?.company_name,
            value: curentval?.for_portal_user?._id,
          }) == -1) {
            insuranceArray.push({
              label: curentval?.company_name,
              value: curentval?.for_portal_user?._id,
            })
          }

        }
      });
      this.insuranceCompanyList = insuranceArray;

      this.selectedInsurance = this.insuranceData?.insurance_id
    });
  }

  getInsuranceDetails() {
    let formattedDOB = this.datePipe.transform(
      this.insuranceDetails.value.dob,
      "yyyy-MM-dd"
    );
    let reqData = {
      insurance_id: this.insuranceDetails.value.insurance_id,
      firstName: this.insuranceDetails.value.firstName,
      lastName: this.insuranceDetails.value.lastName,
      mobile: this.insuranceDetails.value.mobile,
      dob: formattedDOB,
    };

    this.service.postInsuranceDetails(reqData).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.openVerticallyCenteredMatchResult(this.matchedresult)
          this.showInsurance = true;
          this.actualsubscriberId = response?.body?.actualsubscriberId;
          if (response?.body?.subscriberList.subscription_for === "Primary") {
            this.primaryInsurance = response?.body?.subscriberList;
            if (response?.body?.subscriberList.secondary_subscriber) {
              this.secondaryInsurance = response?.body?.subscriberList.secondary_subscriber;

            }

          } else {
            this.secondaryInsurance = [response?.body?.subscriberList];
          }


        } else {
          this.primaryInsurance = "";
          this.secondaryInsurance = [];
          this.openVerticallyCenteredrejectappointment(this.rejectappointment);
          this.showInsurance = false;

        }

      },
      (err) => {
        this.openVerticallyCenteredrejectappointment(this.rejectappointment);
      }
    );
  }

  saveInsuranceDetails() {
    let reqData = {
      patient_id: this.patient_id,
      primary_subscriber_id: "",
      secondary_subscriber_ids: [],
      insurance_id: this.insuranceDetails.value.insurance_id,
      all_subscriber_ids: [],
      subscriber_id: this.actualsubscriberId
    };

    if (this.primaryInsurance) {
      reqData.primary_subscriber_id = this.primaryInsurance?._id;
      reqData.all_subscriber_ids.push({
        subscriber_id: this.primaryInsurance?._id,
        name: this.primaryInsurance?.subscriber_full_name,
        subscription_for: this.primaryInsurance?.subscription_for,
      });
    }

    if (this.secondaryInsurance != undefined) {
      this.secondaryInsurance.forEach((element) => {
        reqData.secondary_subscriber_ids.push(element?._id);

        reqData.all_subscriber_ids.push({
          subscriber_id: element?._id,
          name: element?.subscriber_full_name,
          subscription_for: element?.subscription_for,
        });
      });
    }

    this.loader.start();
    this.service.insuranceDetails(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.goForward();
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  handleSelectInsurance(event: any) {
    if (event.value === this.addedInsId) {
      this.showOtherSearchFields = true;
      this.showInsurance = true;
      if (
        this.subscriberDetails?.subscriber_details.subscription_for ===
        "Primary"
      ) {

        this.insuranceDetails.patchValue({
          insurance_id: this.subscriberDetails?.subscriber_details?.for_user,
          firstName: this.subscriberDetails?.subscriber_details?.subscriber_first_name,
          lastName: this.subscriberDetails?.subscriber_details?.subscriber_last_name,
          mobile: this.subscriberDetails?.subscriber_details?.mobile,
          dob: this.subscriberDetails?.subscriber_details?.date_of_birth
        })

        this.primaryInsurance = this.subscriberDetails?.subscriber_details;


        this.secondaryInsurance =
          this.subscriberDetails?.subscriber_details?.secondary_subscriber;
      } else {
        this.secondaryInsurance = this.subscriberDetails?.subscriber_details;
      }

    } else {
      this.showOtherSearchFields = true;
    }
  }

  // viewSubscriberDetails(subscriberId: any) {
  //   this.insuranceSubscriber
  //     .viewSubscriberDetails(subscriberId)
  //     .subscribe((res: any) => {
  //       const response = this._coreService.decryptObjectData(JSON.parse(res));

  //       this.subscriberDetails = response?.body;
  //       this.primaryInsurance = response.body.subscriber_details;
  //       this.secondaryInsurance =
  //         response?.body?.subscriber_details?.secondary_subscriber;

  //       this.showInsurance = true;
  //     });
  // }

  //  Reject Appointment modal
  openVerticallyCenteredrejectappointment(rejectappointment: any) {
    this.modalService.open(rejectappointment, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
    });
  }

  // Quick view modal
  openVerticallyCenteredquickview(quick_view: any, url: any) {
    this.setDocToView = url;
    this.modalService.open(quick_view, {
      centered: true,
      size: "lg",
      windowClass: "quick_view",
    });
  }

  //  Reject Appointment modal
  openVerticallyCenteredMatchResult(matchedresult: any) {
    this.modalService.open(matchedresult, {
      centered: true,
      size: "md",
      windowClass: "matchedresult",
    });
  }


  skipTab() {
    this.goForward();
  }

  downloadpdf(data: any) {

    window.location.href = data;
  }

}
