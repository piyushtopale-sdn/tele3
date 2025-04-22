import { PatientService } from "./../patient.service";
import { Component, OnInit, ViewEncapsulation, TemplateRef, ViewChild } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";
import { DatePipe } from "@angular/common";
import { SuperAdminService } from "../../super-admin/super-admin.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Router } from "@angular/router";
import { FormArray, FormBuilder, FormGroup,Validators } from "@angular/forms";
import Validation from "src/app/utility/validation";
import {
  NgxQrcodeElementTypes,
  NgxQrcodeErrorCorrectionLevels,
} from "@techiediaries/ngx-qrcode";
import { environment } from "src/environments/environment";
// Vital table
export interface PeriodicElement {
  date: string;
  height: string;
  weight: string;
  hrate: number;
  bmi: string;
  bp: string;
  pulse: number;
  resp: number;
  temp: number;
  bloodgroup: string;
  clearance: number;
  hepaticssummary: number;
}
const ELEMENT_DATA: PeriodicElement[] = [];

// Medication table
export interface MedicationPeriodicElement {
  medicine: string;
  dose: number;
  frequency: string;
  strength: number;
  startdate: string;
  enddate: string;
}
const MEDICATION_ELEMENT_DATA: MedicationPeriodicElement[] = [];

// Medicine table
export interface MedicinePeriodicElement {
  medicine: string;
  dose: number;
  frequency: string;
  strength: number;
  startdate: string;
  enddate: string;
}
const MEDICINE_ELEMENT_DATA: MedicinePeriodicElement[] = [];

// Immunization table
export interface ImmunizationPeriodicElement {
  name: string;
  administereddate: string;
  manufacturedname: string;
  medicalcentre: string;
  batchnumber: string;
  routeofadministration: string;
  nextimmunizationdate: string;
}
const IMMUNIZATION_ELEMENT_DATA: ImmunizationPeriodicElement[] = [];

// Patient History table
export interface PatienthistoryPeriodicElement {
  patienthistorytype: string;
  historyname: string;
  startdate: string;
}
const PATIENTHISTORY_ELEMENT_DATA: PatienthistoryPeriodicElement[] = [];

// Allergies table
export interface AllergiesPeriodicElement {
  allergytype: string;
  startdate: string;
}
const ALLERGIES_ELEMENT_DATA: AllergiesPeriodicElement[] = [];

// Lifestyle table
export interface LifestylePeriodicElement {
  lifestyletype: string;
  lifestyletypename: string;
  startdate: string;
}
const LIFESTYLE_ELEMENT_DATA: LifestylePeriodicElement[] = [];

// Family History table
export interface FamilyhistoryPeriodicElement {
  relationship: string;
  familyhistorytype: string;
  historyname: string;
  startdate: string;
}
const FAMILYHISTORY_ELEMENT_DATA: FamilyhistoryPeriodicElement[] = [];

// Dependent & Family Members table
export interface DependentPeriodicElement {
  name: string;
  ssnnumber: number;
  gender: string;
  dateofbirth: string;
  reletionship: string;
  mobilenumber: string;
}
const DEPENDENT_ELEMENT_DATA: DependentPeriodicElement[] = [];

// Medical History table
export interface MedicalhistoryPeriodicElement {
  allergytype: string;
  allergen: string;
  note: string;
  reaction: string;
  status: string;
  createddate: string;
}
const MEDICALHISTORY_ELEMENT_DATA: MedicalhistoryPeriodicElement[] = [];

// Social History table
export interface SocialPeriodicElement {
  alcohol: string;
  tobacco: string;
  drugs: string;
  occupation: string;
  travel: string;
}
const SOCIALHISTORY_ELEMENT_DATA: SocialPeriodicElement[] = [];

// Past Appointment table
export interface PastappointmentPeriodicElement {
  doctorname: string;
  hospitalname: string;
  appointmentstype: string;
  datetime: string;
  symptomorailment: string;
}
const PASTAPPOINTMENT_ELEMENT_DATA: PastappointmentPeriodicElement[] = [];

@Component({
  selector: "app-patient-myaccount",
  templateUrl: "./patient-myaccount.component.html",
  styleUrls: ["./patient-myaccount.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PatientMyaccountComponent implements OnInit {

  elementType = NgxQrcodeElementTypes.URL;
  correctionLevel = NgxQrcodeErrorCorrectionLevels.LOW;

  @ViewChild("activateDeactivate") activateDeactivate: TemplateRef<any>;
  // Vital table
  vitalsdisplayedColumns: string[] = [
    "date",
    "height",
    "weight",
    "hrate",
    "bmi",
    "bp",
    "pulse",
    "resp",
    "temp",
    "bloodgroup",
    "clearance",
    "hepaticssummary",
  ];
  vitalsdataSource = ELEMENT_DATA;

  // Medication table
  medicationdisplayedColumns: string[] = [
    "medicine",
    "dose",
    "frequency",
    "strength",
    "startdate",
    "enddate",
    "action",
  ];
  medicationdataSource = MEDICATION_ELEMENT_DATA;

  // Medicine table
  medicinedisplayedColumns: string[] = [
    "medicine",
    "dose",
    "frequency",
    "strength",
    "startdate",
    "enddate",
    "action",
  ];
  medicinedataSource = MEDICINE_ELEMENT_DATA;

  // Immunization table
  immunizationdisplayedColumns: string[] = [
    "name",
    "administereddate",
    "manufacturedname",
    "medicalcentre",
    "batchnumber",
    "routeofadministration",
    "nextimmunizationdate",
    "action",
  ];
  immunizationdataSource = IMMUNIZATION_ELEMENT_DATA;

  // Patient History table
  patienthistorydisplayedColumns: string[] = [
    "patienthistorytype",
    "historyname",
    "startdate",
    "action",
  ];
  patienthistorydataSource = PATIENTHISTORY_ELEMENT_DATA;

  // Allergies table
  allergiesdisplayedColumns: string[] = ["allergytype", "startdate", "action"];
  allergiesdataSource = ALLERGIES_ELEMENT_DATA;

  // Lifestyle table
  lifestyledisplayedColumns: string[] = [
    "lifestyletype",
    "lifestyletypename",
    "startdate",
    "action",
  ];
  lifestyledataSource = LIFESTYLE_ELEMENT_DATA;

  // Family History table
  familyhistorydisplayedColumns: string[] = [
    "relationship",
    "familyhistorytype",
    "historyname",
    "startdate",
    "action",
  ];
  familyhistorydataSource = FAMILYHISTORY_ELEMENT_DATA;

  // Dependent & Family Members table
  dependentdisplayedColumns: string[] = [
    "name",
    "ssnnumber",
    "gender",
    "dateofbirth",
    "reletionship",
    "mobilenumber",
    "action",
  ];
  dependentdataSource = DEPENDENT_ELEMENT_DATA;

  // Medical History table
  medicalhistorydisplayedColumns: string[] = [
    "allergytype",
    "allergen",
    "note",
    "reaction",
    "status",
    "createddate",
    "action",
  ];
  medicalhistorydataSource = MEDICALHISTORY_ELEMENT_DATA;

  // Social History table
  socialhistorydisplayedColumns: string[] = [
    "alcohol",
    "tobacco",
    "drugs",
    "occupation",
    "travel",
    "action",
  ];
  socialhistorydataSource = SOCIALHISTORY_ELEMENT_DATA;

  // Past Appointment table
  pastappointmentdisplayedColumns: string[] = [
    "doctorname",
    "hospitalname",
    "appointmentstype",
    "datetime",
    "symptomorailment",
    "action",
  ];
  pastappointmentdataSource = PASTAPPOINTMENT_ELEMENT_DATA;

  profile: any;
  patient_id: any;

  insuranceDetails: any;
  medicalDocuments: any;

  locationData: any;
  country: any = "";
  region: any = "";
  province: any = "";
  department: any = "";
  city: any = "";
  village: any = "";

  deleteFor: any = "";
  indexForDelete: any = "";
  value:any= '';
  pageSize: number = 5;
  totalLength: number = 0;
  page: any = 1;

  immunizationForm: any = FormGroup;
  isSubmitted: boolean = false;
  immunizationOptionsList: any[] = [];

  profileImage: any = ""
  delete_Immunization_id: any;
  changePasswordForm: any = FormGroup;
  notificationData: any;
  notificationStatus: any = "want";
  getData: any;
  patientDOB: any;

  hide1 = true;
  hide2 = true;
  hide3 = true;

  constructor(
    private _coreService: CoreService,
    private service: PatientService,
    private toastr: ToastrService,
    private datepipe: DatePipe,
    private sadminService: SuperAdminService,
    private coreService: CoreService,
    private modalService: NgbModal,
    private route: Router,
    private fb: FormBuilder
  ) {
    this.immunizationForm = this.fb.group({
      immunization: this.fb.array([]),
    });
    this.changePasswordForm = this.fb.group(
      {
        old_password: ["", [Validators.required]],
        new_password: [
          null,
          Validators.compose([
            Validators.required,
            // check whether the entered password has a number
            Validation.patternValidator(/\d/, {
              hasNumber: true,
            }),
            // check whether the entered password has upper case letter
            Validation.patternValidator(/[A-Z]/, {
              hasCapitalCase: true,
            }),
            // check whether the entered password has a lower case letter
            Validation.patternValidator(/[a-z]/, {
              hasSmallCase: true,
            }),
            // check whether the entered password has a special character
            Validation.patternValidator(
              /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
              {
                hasSpecialCharacters: true,
              }
            ),
            Validators.minLength(8),
          ]),
        ],
        confirm_password: ["", [Validators.required]],
      },
      { validators: [Validation.match("new_password", "confirm_password")] }
    );
  }

  ngOnInit(): void {
    let user = this._coreService.getLocalStorage("loginData");
    this.patient_id = user._id;
    let adminData = this._coreService.getLocalStorage("profileData");
    this.patientDOB = adminData?.dob;
    this.getAllDetails();
    this.getPastAppointment();
    this.addNewImmunization();
    this.getImmunizationOptionsList();
  }

  getAllDetails() {
    let params = {
      patient_id: this.patient_id
    }
    this.service.profileDetails(params).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      this.profileImage = response?.body?.personalDetails?.profile_pic_signed_url

      this.profile = {
        ...response?.body?.personalDetails,
        ...response?.body?.portalUserDetails,
      };

      this.insuranceDetails = response?.body?.insuranceDetails;
      // this.viewSubscriberDetails(
      //   response?.body?.insuranceDetails?.primary_subscriber_id
      // );

      this.locationData = response?.body?.locationDetails;
      if (this.locationData) {
        this.getCountryList();
        this.getRegionList(this.locationData?.country);
        this.getProvienceList(this.locationData?.region);
        this.getDepartmentList(this.locationData?.province);
        this.getCityList(this.locationData?.department);
      }

      this.vitalsdataSource = response?.body?.vitalsDetails;

      this.medicationdataSource =
        response?.body?.medicineDetails?.current_medicines;

      this.medicinedataSource = response?.body?.medicineDetails?.past_medicines;

      this.immunizationdataSource =
        response?.body?.immunizationDetails;

      this.patienthistorydataSource =
        response?.body?.historyDetails?.patient_history;

      this.allergiesdataSource = response?.body?.historyDetails?.allergies;

      this.lifestyledataSource = response?.body?.historyDetails?.lifestyle;

      this.familyhistorydataSource =
        response?.body?.historyDetails?.familial_history;

      this.dependentdataSource = response?.body?.familyDetails?.family_members;

      this.medicalhistorydataSource =
        response?.body?.familyDetails?.medical_history;

      this.socialhistorydataSource =
        response?.body?.familyDetails?.social_history;

      this.medicalDocuments = response?.body?.medicalDocument;
    });
  }

  handleDelete() {
    //----------MEDICINES------------------
    let curMedArray: any = [];
    let pastMedArray: any = [];

    if (this.deleteFor === "current_medicine") {
      const array = this.medicationdataSource;
      if (this.indexForDelete > -1) {
        array.splice(this.indexForDelete, 1);
      }

      curMedArray = array;
      pastMedArray = this.medicinedataSource;
    }

    if (this.deleteFor === "past_medicine") {
      const array = this.medicinedataSource;
      if (this.indexForDelete > -1) {
        array.splice(this.indexForDelete, 1);
      }

      curMedArray = this.medicationdataSource;
      pastMedArray = array;
    }

    if (
      this.deleteFor === "current_medicine" ||
      this.deleteFor === "past_medicine"
    ) {
      let reqData = {
        patient_id: this.patient_id,
        current_medicines: curMedArray,
        past_medicines: pastMedArray,
      };

      this.deleteMedicines(reqData);
    }

    //------------HISTORY-----------------------------------
    let patient_history: any = [];
    let allergies: any = [];
    let lifestyle: any = [];
    let familial_history: any = [];

    if (this.deleteFor === "patient_history") {
      const array = this.patienthistorydataSource;
      if (this.indexForDelete > -1) {
        array.splice(this.indexForDelete, 1);
      }

      patient_history = array;
      allergies = this.allergiesdataSource;
      lifestyle = this.lifestyledataSource;
      familial_history = this.familyhistorydataSource;
    }

    if (this.deleteFor === "allergy") {
      const array = this.allergiesdataSource;
      if (this.indexForDelete > -1) {
        array.splice(this.indexForDelete, 1);
      }

      patient_history = this.patienthistorydataSource;
      allergies = array;
      lifestyle = this.lifestyledataSource;
      familial_history = this.familyhistorydataSource;
    }

    if (this.deleteFor === "lifestyle") {
      const array = this.lifestyledataSource;
      if (this.indexForDelete > -1) {
        array.splice(this.indexForDelete, 1);
      }

      patient_history = this.patienthistorydataSource;
      allergies = this.allergiesdataSource;
      lifestyle = array;
      familial_history = this.familyhistorydataSource;
    }

    if (this.deleteFor === "family_history") {
      const array = this.familyhistorydataSource;
      if (this.indexForDelete > -1) {
        array.splice(this.indexForDelete, 1);
      }

      patient_history = this.patienthistorydataSource;
      allergies = this.allergiesdataSource;
      lifestyle = this.lifestyledataSource;
      familial_history = array;
    }

    if (
      this.deleteFor === "patient_history" ||
      this.deleteFor === "allergy" ||
      this.deleteFor === "lifestyle" ||
      this.deleteFor === "family_history"
    ) {
      let reqDataForHistory = {
        patient_id: this.patient_id,
        patient_history: patient_history,
        allergies: allergies,
        lifestyle: lifestyle,
        familial_history: familial_history,
      };

      this.deleteHistory(reqDataForHistory);
    }

    //-----------------FAMILY----------------------------------
    let family_members: any = [];
    let medical_history: any = [];
    let social_history: any = [];

    if (this.deleteFor === "family_members") {
      const array = this.dependentdataSource;
      if (this.indexForDelete > -1) {
        array.splice(this.indexForDelete, 1);
      }

      family_members = array;
      medical_history = this.medicalhistorydataSource;
      social_history = this.socialhistorydataSource;
    }

    if (this.deleteFor === "medical_history") {
      const array = this.medicalhistorydataSource;
      if (this.indexForDelete > -1) {
        array.splice(this.indexForDelete, 1);
      }

      family_members = this.dependentdataSource;
      medical_history = array;
      social_history = this.socialhistorydataSource;
    }

    if (this.deleteFor === "social_history") {
      const array = this.socialhistorydataSource;
      if (this.indexForDelete > -1) {
        array.splice(this.indexForDelete, 1);
      }

      family_members = this.dependentdataSource;
      medical_history = this.medicalhistorydataSource;
      social_history = array;
    }

    if (
      this.deleteFor === "family_members" ||
      this.deleteFor === "medical_history" ||
      this.deleteFor === "social_history"
    ) {
      let reqDataForFamily = {
        patient_id: this.patient_id,
        family_members: family_members,
        medical_history: medical_history,
        social_history: social_history,
      };

      this.deleteFamily(reqDataForFamily);
    }
  }

  deleteMedicines(reqData: any) {
    this.service.medicines(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      if (response.status) {
        this.toastr.success("Deleted Successfully");
        this.closePopup();
        this.getAllDetails();
      } else {
        this.toastr.error(response.message);
      }
    });
  }

  deleteHistory(reqData: any) {
    this.service.patientHistory(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      if (response.status) {
        this.toastr.success("Deleted Successfully");
        this.closePopup();
        this.getAllDetails();
      } else {
        this.toastr.error(response.message);
      }
    });
  }

  deleteFamily(reqData: any) {
    this.service.dependentFamilyMembers(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      if (response.status) {
        this.toastr.success("Deleted Successfully");
        this.closePopup();
        this.getAllDetails();
      } else {
        this.toastr.error(response.message);
      }
    });
  }

  calculateAge(dob: any) {
    let timeDiff = Math.abs(Date.now() - new Date(dob).getTime());
    let age = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);
    return age;
  }

  //-------------Calling address api's---------------
  getCountryList() {
    this.sadminService.getcountrylist().subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        result.body?.list.forEach((element) => {
          if (element?._id === this.locationData?.country) {
            this.country = element?.name;
          }
        });
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getRegionList(countryID: any) {
    if(countryID === null || countryID === undefined){
      return;
    }
    this.sadminService.getRegionListByCountryId(countryID).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        result.body?.list.forEach((element) => {
          if (element?._id === this.locationData?.region) {
            this.region = element?.name;
          }
        });
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getProvienceList(regionID: any) {
    if(regionID === null || regionID === undefined){
      return;
    }
    this.sadminService.getProvinceListByRegionId(regionID).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        result.body?.list.forEach((element) => {
          if (element?._id === this.locationData?.province) {
            this.province = element?.name;
          }
        });
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getDepartmentList(provinceID: any) {
    if(provinceID === null || provinceID === undefined){
      return;
    }
    this.sadminService.getDepartmentListByProvinceId(provinceID).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        result.body?.list.forEach((element) => {
          if (element?._id === this.locationData?.department) {
            this.department = element?.name;
          }
        });
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getCityList(departmentID: any) {
    if(departmentID === null || departmentID === undefined){
      return;
    }
    this.sadminService.getCityListByDepartmentId(departmentID).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        result.body?.list.forEach((element) => {
          if (element?._id === this.locationData?.city) {
            this.city = element?.name;
          }
        });
      },
      error: (err) => {
        console.log(err);
      },
    });

    this.sadminService.getVillageListByDepartmentId(departmentID).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        result.body?.list.forEach((element) => {
          if (element?._id === this.locationData?.village) {
            this.village = element?.name;
          }
        });
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  openVerticallyCenteredsecond(deleteModal: any, index: any, deleteFor: any) {
    this.indexForDelete = index;
    this.deleteFor = deleteFor;
    this.modalService.open(deleteModal, { centered: true, size: "sm" });
  }

  handleRouting(index: any) {
    sessionStorage.setItem("tabIndex", index);
    this.route.navigate(["/patient/profilecreation"]);
  }

  setDocToView: any = "";

  // Quick view modal
  openVerticallyCenteredquickview(quick_view: any, url: any) {
    this.setDocToView = url;
    this.modalService.open(quick_view, {
      centered: true,
      size: "lg",
      windowClass: "quick_view",
    });
  }

  primaryInsurance: any;
  secondaryInsurance: any;

  // viewSubscriberDetails(subscriberId: any) {
  //   if(subscriberId != undefined){
  //     this.insuranceSubscriber
  //     .viewSubscriberDetails(subscriberId)
  //     .subscribe((res: any) => {
  //       const response = this._coreService.decryptObjectData(JSON.parse(res));
  //       this.primaryInsurance = response.body.subscriber_details;
  //       this.secondaryInsurance =
  //         response?.body?.subscriber_details?.secondary_subscriber[0];

  //     });
  //   }
   
  // }

  getPastAppointment() {
    let reqData = {
      patient_portal_id: this.patient_id,
      // patient_portal_id: "63d0f8213c4b44b6397794ff",
      limit: this.pageSize,
      page: this.page,
      status: "PAST",
    };

    this.service.getPastAppointOfPatient(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.pastappointmentdataSource = response?.data?.data;
      this.totalLength = response?.data?.totalCount;
    });
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getPastAppointment();
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  handleAddImmunization(actionFor: any) {
    if (actionFor === "add") {
      
      this.isSubmitted = true;
      if (this.immunizationForm.get("immunization").invalid) {
        return;
      }
      this.isSubmitted = false;

      let reqData = {
        patient_id: this.patient_id,
        immunization: this.immunizationForm.value.immunization,
      };

      this.service.immunizations(reqData).subscribe((res) => {
        let response = this.coreService.decryptObjectData(res);
        
        if (response.status) {
          this.getAllDetails()
          this.closePopup();
          this.toastr.success(response.message);
        } else {
          this.toastr.error(response.message);
        }
      });
    } else {

      this.handleEditImmunization();
    }
  }

  handleEditImmunization() {
    let reqData = {
      patient_id: this.patient_id,
      immunization: this.immunization.at(0).value,
    };

    this.service.editImmunization(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.toastr.success(response.message)
        this.closePopup()
        this.getAllDetails()
      }
    });
  }

  //-----------------------------Immunization Form Handling-----------------------
  immunizationValidation(index) {
    let immunization = this.immunizationForm.get("immunization") as FormArray;
    const formGroup = immunization.controls[index] as FormGroup;
    return formGroup;
  }

  get immunization() {
    return this.immunizationForm.controls["immunization"] as FormArray;
  }

  addNewImmunization() {
    const newImmunization = this.fb.group({
      _id:[""],
      name: ["", [Validators.required]],
      manufactured_name: ["", [Validators.required]],
      medical_centre: ["", [Validators.required]],
      batch_number: ["", [Validators.required]],
      next_immunization_appointment: ["", [Validators.required]],
      administered_date: ["", [Validators.required]],
      route_of_administered: ["", [Validators.required]],
      hcp_provided_immunization: ["", [Validators.required]],
      allow_to_export: [false, [Validators.required]],
    });

    this.immunization.push(newImmunization);
  }

  deleteImmunization(index: number) {
    this.immunization.removeAt(index);
  }

  getImmunizationOptionsList() {
    this.service.immunizationList().subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.immunizationOptionsList = response?.body;
    });
  }

  isImmunizationUpdating: boolean = false;

  // Add Immunization Model
  openVerticallyCenteredAddImmunization(
    add_immunization_content: any,
    data: any
  ) {
    if (data) {
      this.isImmunizationUpdating = true;
      this.resetPopup();
      this.immunization.at(0).patchValue(data);
    } else {
      this.isImmunizationUpdating = false;
    }

    this.modalService.open(add_immunization_content, {
      centered: true,
      size: "xl",
      windowClass: "add_immunization",
    });
  }
  openVerticallyCentereddetale(delete_Immunization: any, data: any) {
    this.delete_Immunization_id = data._id
    this.modalService.open(delete_Immunization, { centered: true, size: "md" });
  }
  delete_ImmunizationById() {
    let reqData = {
      immunization_id: this.delete_Immunization_id,
      paitent_id: this.patient_id
    }
    this.service.deleteImmunization(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response.status == true) {
        this.toastr.success(response.message);
        this.modalService.dismissAll();
        this.getAllDetails()
      } else {
        this.toastr.error(response.message);
      }
    });
  }
  resetPopup() {
    this.immunizationForm.reset();
    this.immunization.clear();
    this.addNewImmunization();
  }

  closePopup() {
    this.resetPopup();
    this.modalService.dismissAll("close");
  }



  openVerticallyCentereddetaleChangePassword(changePassword: any) {  
    this.modalService.open(changePassword, { centered: true, size: "md" });
  }

  handleChangePassword() {
    this.isSubmitted = true;
    if (this.changePasswordForm.invalid) {
      return;
    }
    this.isSubmitted = false;

    let reqData = {
      id: this.patient_id,
      old_password: this.changePasswordForm.value.old_password,
      new_password: this.changePasswordForm.value.new_password,
    };

    this.service.changePassword(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.coreService.showSuccess("",response.message);
          this.modalService.dismissAll();
          this.changePasswordForm.reset();
         
        } else {
          this.coreService.showError("",response.message);
          this.modalService.dismissAll();
          // this.toastr.error("Current Password is incorrect");
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.coreService.showError("",errResponse.message);
      }
    );
  }

  get f() {
    return this.changePasswordForm.controls;
  }

  handleToggleChangeForActive(notificationData: any, event: any) {
    this.notificationData = {
      id: notificationData?._id,
      notification: event,
    };
    if (event === false) {
      this.notificationStatus = "don't want";
    } else {
      this.notificationStatus = "want";
    }
    this.modalService.open(this.activateDeactivate);
  }

  updateNotificationStatus() {
    this.service.updateNotification(this.notificationData).subscribe((res: any) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.toastr.success(response.message);
        this.modalService.dismissAll("Closed");
      }
    });
  }
  openVerticallyCenteredVaccCard(vaccCard: any, id: any) {
    this.modalService.open(vaccCard, {
      centered: true,
      size: "md",
      windowClass: "vaccCard",
    });
    this.value = environment.apiUrl+`/patient-service/patient/get-QRcode-Scan-Data?_id=${id}`;
    this.getVaccinationData(id);

  }
  getVaccinationData(id){
    
    let reqData ={
      _id:id
    }
    this.service.getIDbyImmunization(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData({data:res});
      if(response.status == true){
        this.getData = response.data;
      }
      
    });
   
  }
  downloadpdf(data:any) {
    
    window.location.href = data;
  }
}
