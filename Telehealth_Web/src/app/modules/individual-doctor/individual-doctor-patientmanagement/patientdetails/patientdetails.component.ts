import { PatientService } from "src/app/modules/patient/patient.service";
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  Input,
  Pipe,
  ChangeDetectorRef
} from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";
import { DatePipe,Location } from "@angular/common";
import { DateAdapter } from "@angular/material/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Router } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { FourPortalService } from "src/app/modules/four-portal/four-portal.service";
import { PharmacyService } from "src/app/modules/pharmacy/pharmacy.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { MatAutocomplete } from "@angular/material/autocomplete";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { MatCheckboxChange } from "@angular/material/checkbox"; 

interface VitalRange {
  High: number | undefined;
  Low: number | undefined;
  CriticalHigh: number | undefined;
  CriticalLow: number | undefined;
  Unit: string | undefined;
}
@Component({
  selector: "app-patientdetails",
  templateUrl: "./patientdetails.component.html",
  styleUrls: ["./patientdetails.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PatientdetailsComponent implements OnInit {
  @Pipe({
    name: 'replaceUnderscore'
  })
  currentUrl: any = [];
  @Input() patientId: any;
  lineChartLabels: any[] = [];
  lineChartData: any[] = [];
  lineChartOptions = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => {
            return `${tooltipItem.raw} cms`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Dates',
        },
      },
      y: {
        title: {
          display: true,
          text: '',
        },
        beginAtZero: true,
      },
    },
  };
  lineChartColorsMap = {
    Height: {
      backgroundColor: 'rgba(0, 200, 255, 0.2)',
      borderColor: 'rgba(0, 200, 255, 1)',
      pointBackgroundColor: 'rgba(0, 200, 255, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(0, 200, 255, 1)',
    },
    Weight: {
      backgroundColor: 'rgba(255, 159, 64, 0.2)',
      borderColor: 'rgba(255, 159, 64, 1)',
      pointBackgroundColor: 'rgba(255, 159, 64, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(255, 159, 64, 1)',
    },
    'Heart-Rate': {
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      pointBackgroundColor: 'rgba(75, 192, 192, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
    },
    BMI: {
      backgroundColor: 'rgba(153, 102, 255, 0.2)',
      borderColor: 'rgba(153, 102, 255, 1)',
      pointBackgroundColor: 'rgba(153, 102, 255, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(153, 102, 255, 1)',
    },
    'BP Systolic': {
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      pointBackgroundColor: 'rgba(255, 99, 132, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
    },
    'BP Diastolic': {
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      pointBackgroundColor: 'rgba(54, 162, 235, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
    },
    Pulse: {
      backgroundColor: 'rgba(255, 206, 86, 0.2)',
      borderColor: 'rgba(255, 206, 86, 1)',
      pointBackgroundColor: 'rgba(255, 206, 86, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(255, 206, 86, 1)',
    },
    Temperature: {
      backgroundColor: 'rgba(255, 127, 80, 0.2)', 
      borderColor: 'rgba(255, 127, 80, 1)',       
      pointBackgroundColor: 'rgba(255, 127, 80, 1)', 
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(255, 127, 80, 1)',
    },
    'Blood Glucose': {
      backgroundColor: 'rgba(255, 99, 71, 0.2)',  // Light red background (Tomato color)
      borderColor: 'rgba(255, 99, 71, 1)',        // Red border
      pointBackgroundColor: 'rgba(255, 99, 71, 1)', // Red points
      pointBorderColor: '#fff',                     // White border for points
      pointHoverBackgroundColor: '#fff',            // White background when hovering
      pointHoverBorderColor: 'rgba(255, 99, 71, 1)', // Red border when hovering
    }
    
    
  };


  openbyvideo: any = false;

  vitalsdisplayedColumns: string[] = [
    "date",
    "height",
    "weight",
    "hrate",
    "bmi",
    "bpsystolic",
    "bpdiastolic",
    "pulse",
    "temp",
    "blood_glucose",
    "action"
  ];
  vitalsdataSource: any[] = []

  medicationdisplayedColumns: string[] = [
    "orderid",
    "medicinename",
    "dose",
    "doseunit",
    "routeofadminst",
    "quantity",
    "fequency",
    "takefor",
  ];
  medicationdataSource: any[] = []


  allergiesdisplayedColumns: string[] = [
    'date',
    "allergyname",
    "allergytype",
    "reaction",
    "saverity",
    "startdate",
    "note",
    "action"

  ];
  allergiesdataSource: any[] = []

  socialdisplayedColumns: string[] = [
    'date',
    "alcohol",
    "tobacco",
    "drugs",
    "action"
  ];
  socialdataSource: any[] = []

  familyhistorydisplayedColumns: string[] = [
    "fullname",
    "mobile",
    "gender",
    "relationship",
    "action"
  ];
  familyhistoryparentdisplayedColumns: string[] = [
    "fullname",
    "mobile",
    "gender",
    "action"
  ];
  familyhistoryparent: any[] = []
  familyhistorydataSource: any[] = []
  

  socialhistorydisplayedColumns: string[] = [
    "alcohol",
    "tobacco",
    "drugs",
    "occupation",
    "travel",
  ];
  socialhistorydataSource: any[] = []

  assessmentsList: any[] = [];

  pastappointmentdisplayedColumns: string[] = [
    "dateandtime",
    "orderid",
    "doctor",
    "patient",
    "status",
  ];
  pastappointmentdataSource: any[] = []

  diagnosisdisplayedColumns: string[] = [
    "datetime",
    "appointmentId",
    "subject",
    "object",
    "assessment",
    "icd",
    "plan",
    "action"
  ];
  dataDiagnosisSource: any[] = [];
  totalICDList: any;
  NoteId: any;

  displayedLabColumns: string[] = [
    "orderid",
    "testname",
    "centrename",
    "status",
    "action"
  ];
  dataLabSource: any[] = [];

  displayedRadioColumns: string[] = [
    "orderid",
    "testname",
    "centrename",
    "status",
    "action"
  ];
  dataRadioSource: any[] = [];

  documentdisplayedColumns: string[] = [
    'date',
    "documnet_name",
    "issueDate",
    "expirydate",
    "action"

  ];
  medicalDocuments: any[] = [];

  selectedSection: string = 'allergies';

  profile: any;
  doctor_id: any = "";
  patient_id: any;
  appointmentId: any;

  vitalId: any;

  isReadOnly: boolean = true;
  locationData: any;

  deleteFor: any = "";
  indexForDelete: any = "";

  pageSize: number = 5;
  totalLength: number = 0;
  page: any = 1;

  isSubmitted: boolean = false;

  vitalForm: any = FormGroup;
  notesForm: any = FormGroup;
  socialHistoryForm: any = FormGroup;
  medicalHistoryForm: any = FormGroup;

  queryParams: any;
  isAssesments: boolean = false;
  isFamilyMember: boolean = false;
  res_details_med: any;
  selectedIndex: number = 0;
  displayedData: any;
  social_displayedData: any;
  family_displayedData: any;

  currentPage = 1;
  itemsPerPage = 5;


  orderHistory: any[] = [];
  _testHistoryData: any[] = [];
  dateRangeForm: FormGroup;
  fromDate: string = "";
  toDate: string = "";
  totalDocLength: any;
  backType: any;
  type: any;
  deletededItemId: any;
  medicalFormType: string = "";
  selectedMHId: any;
  selectedSHId: any;
  graphType: any;
  currentDate: any;
  infoLabel: any;
  currentValue: any;
  heightRange: any;
  weightRange: any;
  HeartRateRange: any;
  bpiRange: any;
  bloodPressureSystolic: any;
  bloodPressureBPDiastolic: any;
  pulseRange: any;
  temperatureRange: any;
  bloodGlucoseRange: any;
  criticalHigh: any = "";
  criticalLow: any ="";
  normalHigh: any ="";
  normalLow: any ="";
  heartrangeHigh: any = "";
  heartrangeLow: any = "";
  heartrangeunit:any="";
  pulserangeHigh: any = "";
  pulserangeLow: any = "";
  pulseunit:any="";
  tempHigh: any = "";
  tempLow: any = "";
  tempunit:any="";
  bloodglucoseHigh: any = "";
  bloodglucoseLow: any = "";
  bloodglucoseunit: any = "";
  bmiHigh: any = "";
  bmiLow: any = "";
  bpsystolicHigh: any = "";
  bpsystolicLow: any = "";
  bpdiastolicHigh: any = "";
  bpsystolicUnit: any ="";
  bpdiastolicUnit: any="";
  bpdiastolicLow: any = "";
  heightHigh: any = "";
  heightLow: any = "";
  heightunit: any = "";
  weightunit: any = "";
  weightHigh: any = "";
  weightLow: any = "";
  unit: any ="";
  profile_pic: any;
  adminCheck: any;
  showAddButtton:boolean = false;
  userRole: any;
  patientGender: any;
  selectedSection1: string = 'height';
  heightdisplayedData: any[];
  weightdisplayedData: any;
  bmidisplayedData: any[];
  heart_ratedisplayedData: any[];
  bpsystolicdisplayedData: any[];
  bpdiastolicdisplayedData: any[];
  pulsedisplayedData: any[];
  tempdisplayedData: any[];
  blood_glucosedisplayedData: any[];

  //bpvitals
  VitalData: any[] = [];
  bpRanges: any = {};
  heightdisplayedColumns: string[] = [
    'date',
    'height',
    'ismanual'
  ];
  heightdataSource: any[] = []

  weightdisplayedColumns: string[] = [
    'date',
    'weight',
    'ismanual'

  ];
  weightdataSource: any[] = []
  heart_ratedisplayedColumns: string[] = [
    'date',
    'heart_rate',
    'ismanual'

  ];
  heart_ratedataSource: any[] = []
  bmidisplayedColumns: string[] = [
    'date',
    'bmi',
    'ismanual'

  ];
  bmidataSource: any[] = []
  bpsystolicdisplayedColumns: string[] = [
    'date',
    'bpsystolic',
    'ismanual'

  ];
  bpsystolicdataSource: any[] = []
  bpdiastolicdisplayedColumns: string[] = [
    'date',
    'bpdiastolic',
    'ismanual'

  ];
  bpdiastolicdataSource: any[] = []
  pulsedisplayedColumns: string[] = [
    'date',
    'pulse',
    'ismanual'

  ];
  pulsedataSource: any[] = []
  tempdisplayedColumns: string[] = [
    'date',
    'temp',
    'ismanual'

  ];

  tempdataSource: any[] = []
  blood_glucosedisplayedColumns: string[] = [
    'date',
    'blood_glucose',
    'ismanual'

  ];

  blood_glucosedataSource: any[] = []
  res_detailsLab: any;
  displayedColumnsLab: string[] = [
    "date",
    "testname",
    "centrename",
    "status",
  ];
  res_detailsRadio: any;
  displayedColumnsRadio: string[] = [
    "date",
    "testname",
    "centrename",
    "status"
  ];
  res_detailsPrescribeMed: any;
  displayedColumnsPrescribeMed: string[] = [
    "prescribeddate",
    "medicinename",
    "dose",
    "doseunit",
    "routeofadminst",
    "quantity",
    "fequency",
    "takefor",
  ];
  selected_tab: string;
  res_MedPrescribed: any;
  filteredICDList: any[] = [];
  noDataFound: boolean = false; 
  selectedICDCodes: any[] = [];
  searchControl = new FormControl(""); // Search input control
    parentDetails: any;
  updateNotes: any;

  constructor(
    private acctivatedRoute: ActivatedRoute,
    private _coreService: CoreService,
    private service: PatientService,
    private toastr: ToastrService,
    private datepipe: DatePipe,
    private pharmacyService: PharmacyService,
    private coreService: CoreService,
    private modalService: NgbModal,
    private route: Router,
    private fb: FormBuilder,
    private labRadioService: FourPortalService,
    private activateRoute: ActivatedRoute,
    private dateAdapter: DateAdapter<Date>,
    private loader: NgxUiLoaderService,
    private doctorService: IndiviualDoctorService,
    private location: Location,
    private _superAdminService: SuperAdminService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef

  ) {
    this.loader.stop();
    this.vitalForm = this.fb.group({
      height: ['', [Validators.required]],
      weight: ['', [Validators.required]],
      h_rate: [""],
      bmi: [""],
      bp_systolic: [""],
      bp_diastolic: [""],
      pulse: [""],
      resp: [""],
      temp: [""],
      blood_glucose: [""],
    });

    this.notesForm = this.fb.group({
      subject: ["", [Validators.required]],
      object: ["", [Validators.required]],
      assessment: ["", [Validators.required]],
      plan: ["", [Validators.required]],
      icd10: ["", [Validators.required]]

    });

    this.socialHistoryForm = this.fb.group({
      alcohol: [false],
      tobacco: [false],
      drugs: [false]
    });

    this.medicalHistoryForm = this.fb.group({
      allergen: ["", Validators.required],
      allergyType: ["", Validators.required],
      reaction: ["", Validators.required],
      status: ["", Validators.required],
      note: [""],
    });

    this.vitalForm.get('height').valueChanges.subscribe(() => {
      this.calculateBMI();
    });

    this.vitalForm.get('weight').valueChanges.subscribe(() => {
      this.calculateBMI();
    });
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });

    
  }

  calculateBMI(): void {
    const height = this.vitalForm.get('height').value;
    const weight = this.vitalForm.get('weight').value;

    if (height && weight) {
      const heightInMeters = height / 100; // Convert height from cm to meters
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2); // Calculate BMI

      this.vitalForm.get('bmi').setValue(bmi); // Update BMI value in the form
    }
  }


  ngOnInit(): void {
    this.currentUrl = this.route.url;
    this.onNavigate(this.currentUrl);
    this.activateRoute.paramMap.subscribe((params) => {
      
      this.loader.stop();

      this.patient_id = params.get('id'); // Get the 'id' parameter
      this.patientId = this.patient_id
    });
    this.activateRoute.queryParams.subscribe((res) => {
      this.queryParams = res;
      this.backType = this.queryParams?.type;
      this.appointmentId = this.queryParams?.appointmentId;
      if(this.queryParams.id)
         this.patient_id = this.queryParams.id

    });
    this.activateRoute.queryParamMap.subscribe((params) => {
      if(params.get('appointmentId'))
         this.appointmentId = params.get('appointmentId');
      if(params.get('showAddButtton') === 'true'){
        this.showAddButtton = true
      }else{
        this.showAddButtton = false
      }  
    });
    
    if (this.queryParams != '' && this.patientId != '' && this.patientId !== undefined) {      
      this.queryParams = this.patientId;
      this.openbyvideo = this.patientId.openbyvideo;
      this.patient_id = this.patientId
    }
    if (Object.keys(this.queryParams).length != 0) {

      this.isAssesments = true;

      this.adminCheck = this.queryParams?.adminView
      
      if(this.queryParams?.appointmentId && this.queryParams?.patientId){
        this.appointmentId = this.queryParams?.appointmentId;
        this.patient_id = this.queryParams?.patientId
      }
      this.getAssessmentList();
    } else {
      let patientId = this.acctivatedRoute.snapshot.paramMap.get("id");
      this.patientId = patientId;     
      this.patient_id = patientId;
    }

    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.doctor_id = loginData?._id;
    this.userRole = loginData?.role;


    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.dateRangeForm.patchValue({
      fromDate: firstDay,
      toDate: lastDay
    });

    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(lastDay);



    this.getAlVitals(this.fromDate, this.toDate);
    this.getAllDetails();
    //bpvitals
    this.fetchVitals();

  }


  getAllDetails() {
    let params = {
      patient_id: this.patient_id,
    };

    this.service.profileDetails(params).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.profile = {
            ...response?.body?.personalDetails,
            ...response?.body?.portalUserDetails,
          };

          this.locationData = response?.body?.locationDetails;
          let data1 = []

       data1 = response?.body?.personalDetails?.medicalInformation?.medicalHistory
            ? response?.body?.personalDetails?.medicalInformation?.medicalHistory
            : [];
            this.allergiesdataSource = data1.filter(item => !item.isDeleted);

          this.familyhistorydataSource = response?.body?.familyDetails
            ? response?.body?.familyDetails
            : [];

          this.socialdataSource =
            response?.body?.personalDetails?.medicalInformation?.socialHistory;
          this.medicalDocuments = response?.body?.medicalDocument;
          this.isFamilyMember = response?.body?.personalDetails?.isFamilyMember;
          this.profile_pic = response?.body?.personalDetails?.profile_pic_signed_url;
          this.patientGender = this.profile?.gender;


          if (this.isFamilyMember == true) {
            this.patientParentFullDetails(); 
          }

          this.updateDisplayedHistory();
        }
      },
      (err) => {
        let errResponse = this._coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
}

  getAlVitals(from: any = "", to: any = "") {
    let reqData = {
      patientId: this.patient_id,
      limit: this.pageSize,
      page: this.page,
      fromDate: from,
      toDate: to
    }
    this.service.getPatientAllVitals_newAPI(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      if (response.status) {
        this.vitalsdataSource = response?.data?.result
        this.totalLength = response?.data?.totalRecords;
        this.getVitalThresholdList();
        this.heightdataSource = this.vitalsdataSource.filter(val => val?.height?.value).map(vital => {
          return {
            endDate: vital.height?.endDate,
            unit: vital.height?.unit,
            value: vital.height?.value,
            ismanual:vital?.is_manual
          };
        });
        this.weightdataSource = this.vitalsdataSource.filter(val => val?.weight?.value).map(vital => {
          return {
            endDate: vital.weight?.endDate,
            unit: vital.weight?.unit,
            value: vital.weight?.value,
            ismanual:vital?.is_manual
          };
        });
        this.heart_ratedataSource = this.vitalsdataSource.filter(val => val?.h_rate?.value).map(vital => {
          return {
            endDate: vital.h_rate?.endDate,
            unit: vital.h_rate?.unit,
            value: vital.h_rate?.value,
            ismanual:vital?.is_manual
          };
        });
        this.bmidataSource = this.vitalsdataSource.filter(val => val?.bmi?.value).map(vital => {
          return {
            endDate: vital.bmi?.endDate,            
            value: vital.bmi?.value,
            ismanual:vital?.is_manual
          };
        });
        this.bpsystolicdataSource = this.vitalsdataSource.filter(val => val?.bp_systolic?.value).map(vital => {
          return {
            endDate: vital.bp_systolic?.endDate,
            unit: vital.bp_systolic?.unit,
            value: vital.bp_systolic?.value,
            ismanual:vital?.is_manual
          };
        });
        this.bpdiastolicdataSource = this.vitalsdataSource.filter(val => val?.bp_diastolic?.value).map(vital => {          
            return {
              endDate: vital.bp_diastolic?.endDate,
              unit: vital.bp_diastolic?.unit,
              value: vital.bp_diastolic?.value,
              ismanual: vital?.is_manual
            };         
        });
        this.pulsedataSource = this.vitalsdataSource.filter(val => val?.pulse?.value).map(vital => {
          return {
            endDate: vital.pulse?.endDate,
            unit: vital.pulse?.unit,
            value: vital.pulse?.value,
            ismanual:vital?.is_manual
          };
        });
        this.tempdataSource = this.vitalsdataSource.filter(val => val?.temp?.value).map(vital => {
          return {
            endDate: vital.temp?.endDate,
            unit: vital.temp?.unit,
            value: vital.temp?.value,
             ismanual: vital?.is_manual
          };
        });
        this.blood_glucosedataSource = this.vitalsdataSource.filter(val => val?.blood_glucose?.value).map(vital => {
          return {
            endDate: vital.blood_glucose?.endDate,
            unit: vital.blood_glucose?.unit,
            value: vital.blood_glucose?.value,
            ismanual:vital?.is_manual
          };
        });
        this.updateDisplayedData();
      }
    });
  }

  handleAddVitals() {
    this.isSubmitted = true;
    const isInvalid = this.vitalForm.invalid;

    if (isInvalid) {
      this.vitalForm.markAllAsTouched();
      this.coreService.showError("", "Please fill all required fields.");
      return;
    }

    this.isSubmitted = false;
    const vitalsObject = {};

    const formValues = this.vitalForm.value;
  
    const addVital = (key, value, unit:any='') => {
      if (value) {
        vitalsObject[key] = {
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          value: value,
          unit: unit || undefined, 
          // is_manual: true
        };
      }
    };
  
    addVital("height", formValues.height, "cm");
    addVital("weight", formValues.weight, "kg");
    addVital("h_rate", formValues.h_rate, "bpm");
    addVital("bmi", formValues.bmi);
    addVital("bp_systolic", formValues.bp_systolic, "mmHg");
    addVital("bp_diastolic", formValues.bp_diastolic, "mmHg");
    addVital("pulse", formValues.pulse, "bpm");
    addVital("temp", formValues.temp, "°C");
    addVital("blood_glucose", formValues.blood_glucose, "mg/dL");
  
    if (Object.keys(vitalsObject).length === 0) {
      this.coreService.showError("", "Please fill at least one vital field.");
      return;
    }
  
    const reqData = {
      patient_id: this.patient_id,
      appointment_id: this.appointmentId,
      role: "doctor",
      added_by: this.doctor_id,
      is_manual: true,
      vitals_data: [vitalsObject], 
    };

    this.service.addVitals_newAPI(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({data:res});
      if (response.status) {
        this.toastr.success(response.message);
        this.getAlVitals(this.fromDate, this.toDate);
        this.closePopup()
      } else {
        this.toastr.error(response.message);
      }
    });
  }

  getAllMedicationInfoList(from: any = '', to: any = '') {
     
    let reqData = {
      patientId: this.patient_id,
      limit: this.pageSize,
      page: this.page,
      fromDate: from,
      toDate: to
    };
    this.pharmacyService.orderList(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      
      if (response.status) {
        this.res_details_med = response?.data?.data;
        this.totalLength = response?.data?.totalRecords;
      }
    });
  }

  getAssessmentList(from: any = '', to: any = '') {
    let reqData = {
      patientId: this.patient_id,
      fromDate: from,
      toDate: to
    };

    this.service.getAssessmentList(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        const assessmentData = response?.data?.result;
        this.assessmentsList = assessmentData;
      }
    });
  }

  getPastAppointment(from: any = '', to: any = '') {
    let reqData = {
      patientId: this.patient_id,
      limit: this.pageSize,
      page: this.page,
      status: "COMPLETED",
      type: "past",
      fromDate: from,
      toDate: to
    };

    this.service.getPastAppointOfPatient(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      if (response.status) {
        this.pastappointmentdataSource = response?.data?.data;
        this.totalLength = response?.data?.totalRecords;
      }
    });
  }

  getAllDignosis(from: any = '', to: any = '') {
    let reqData ={};
    if(this.showAddButtton === false) {    
      reqData = {
        page: this.page,
        limit: this.pageSize,
        patientId: this.patient_id,
        fromDate: from,
        toDate: to
      }
    }else {
      reqData = {
        page: this.page,
        limit: this.pageSize,
        appointmentId: this.appointmentId
      }
    }
    this.service.getDiagnosisListApi(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.totalLength = response?.body?.totalRecords;
        this.dataDiagnosisSource = response?.body?.result;
        // this.dataDiagnosisSource = this.dataDiagnosisSource.map(item => ({
        //   ...item,
        //   slicedIcdCode: this.sliceIcdCodes(item.icdCode),
        // }));

      }
    });
  }

truncateWords(text: string, maxWords: number = 10): string {
  if (!text) return '';
  
  const words = text.split(' ');
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(' ') + '...';
  }
  return text;
}
  
  // sliceIcdCodes(icdCodes: any[]) {
  //   if (!icdCodes || icdCodes.length === 0) return [];
  //   const sliced = icdCodes.slice(0, 3);
  //   return sliced.length < icdCodes.length
  //     ? sliced.map(i => i.code).join(', ') + '...'
  //     : sliced.map(i => i.code).join(', ');
  // }

  openVerticallyCenteredconsultation_notes(
    consultation_notes_content: any,
    data: any= "",type:any
  ) {
    
    if (data) {
      this.NoteId = data?._id
      this.notesForm.patchValue({
        subject: data?.subject,
        object: data?.object,
        assessment: data?.assessment,
        plan: data?.plan,
        icd10: data?.icdCode ? data.icdCode.map((icd: any) => icd.code) : []
      })
    }
    this.getAllICDList();
    this.searchControl.valueChanges
    .pipe(debounceTime(300), distinctUntilChanged()) // Delay API calls
    .subscribe((searchText) => {
      this.filterICDList(searchText);
  });
    this.modalService.open(consultation_notes_content, {
      centered: true,
      size: "lg",
      windowClass: "add_immunization",
    });

  }

  getAllICDList() {
    let reqData = {
      limit: 0,
      page: 1
    };

    this.doctorService.getAllCodesFilter(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);
      
      if (response.status) {
        this.totalICDList = response?.body?.data || [];
        this.filteredICDList = [...this.totalICDList]; // Show all initially
      }
      
    });
  }


  getAllLabTests(from: any = '', to: any = '') {

    let reqData = {
      patientId: this.patient_id,
      limit: this.pageSize,
      page: this.page,
      serviceType: 'lab',
      fromDate: from,
      toDate: to
    };
    if (this.isFamilyMember === true) {
      reqData['familyMember'] = "familyMember";
    }
    this.labRadioService.appointment_listEMR(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });  
      if (response.status) {
        this.dataLabSource = response?.data?.data;
        this.totalLength = response?.data?.totalRecords;       
      }

    }
    ); 
      
  }

  getAllRadioTests(from: any = '', to: any = '') {
   
    let reqData = {
      patientId: this.patient_id,
      limit: this.pageSize,
      page: this.page,
      serviceType: 'radiology',
      fromDate: from,
      toDate: to
    };
    if (this.isFamilyMember === true) {
      reqData['familyMember'] = "familyMember";
    }
    this.labRadioService.appointment_listEMR(reqData)
    .subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {

        this.dataRadioSource = response?.data?.data;
        this.totalLength = response?.data?.totalRecords;
      }
    });    
  }

  downloadTestResult(id: any) {
    let reqData = {
      id: id
    };
    this.labRadioService.getLabTestResultById(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        let resData = response?.data;
        const uploadResult = resData?.uploadResultData[0];
        const signedUrl = uploadResult?.signedUrl;

        if (signedUrl) {
          this.triggerFileDownload(signedUrl, uploadResult?.key);
        } else {
          console.error("No signedUrl found in the response");
        }
      } else {
        console.error("Failed to fetch test result:", response.message);
      }
    }, (error) => {
      console.error("Error fetching test result:", error);
    });
  }

  triggerFileDownload(url: string, filename: string) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.download = filename || 'download.pdf';
    anchor.click();
  }


  deleteItem() {

    if (this.type === 'vital') {
      this.service
        .deleteVitalsAPI(this.deletededItemId)
        .subscribe((res: any) => {
          let encryptedData = { data: res };
          let response = this.coreService.decryptObjectData(encryptedData);
          if (response.status) {
            // this.loader.stop();
            this.getAlVitals();
            this.toastr.success(response.message);
            this.closePopup();
          } else {
            // this.loader.stop();
            this.toastr.error(response.message);
          }
        })
    }

    if (this.type === 'social') {
      let reqData = {
        id: this.deletededItemId,
        patientId: this.patient_id
      }
      this.service
        .deleteSocialHistory(reqData)
        .subscribe((res: any) => {
          let encryptedData = { data: res };
          let response = this.coreService.decryptObjectData(encryptedData);
          if (response.status) {
            // this.loader.stop();
            this.getAllDetails();
            this.toastr.success(response.message);
            this.closePopup();
          } else {
            // this.loader.stop();
            this.toastr.error(response.message);
          }
        })
    }

    if (this.type === 'medical') {
      let reqData = {
        id: this.deletededItemId,
        patientId: this.patient_id
      }
      this.service.deleteMedicalHistory(reqData)
        .subscribe((res: any) => {
          let encryptedData = { data: res };
          let response = this.coreService.decryptObjectData(encryptedData);
          if (response.status) {
            // this.loader.stop();
            this.getAllDetails();
            this.toastr.success(response.message);
            this.closePopup();
          } else {
            // this.loader.stop();
            this.toastr.error(response.message);
          }
        })
    }
  }

  openVerticallyCenteredsecondV(deleteModal: any, id: any, type: any) {
    this.type = type;
    this.deletededItemId = id;
    this.modalService.open(deleteModal, { centered: true, size: "sm" });
  }

  openVerticallyCenteredsecond(deleteModal: any, index: any, deleteFor: any) {
    this.indexForDelete = index;
    this.deleteFor = deleteFor;
    this.modalService.open(deleteModal, { centered: true, size: "sm" });
  }

  handleRouting(index: any) {
    sessionStorage.setItem("tabIndexForDoctor", index);
    this.route.navigate([
      `/individual-doctor/patientmanagement/edit/${this.patient_id}`,
    ]);
  }

  setDocToView: any = "";
  // Quick view modal
  openVerticallyCenteredquickview(quick_view: any, url: any) {
    this.setDocToView = url;

    this.modalService.open(quick_view, {
      centered: true,
      size: "xl",
      windowClass: "quick_view",
    });
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAlVitals();
  }

  handlePageEventMedication(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    // this.getAllMedicationInfoList();
    this.tabSelection( this.selected_tab,this.fromDate,this.toDate)
  }

  handlePageEventPast(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getPastAppointment();
  }

  handlePageEventLab(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    // this.getAllLabTests();
    this.tabSelection( this.selected_tab,this.fromDate,this.toDate)

  }
  handlePageEventLabprescribedTest(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getLabTestPrescribed();
  }

  handlePageEventRadioPrescribedTest(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getRadioTestPrescribed();
  }

  handlePageEventMedPrescribed(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllprescribedMed();
  }

  handlePageEventRadio(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    // this.getAllRadioTests();
    this.tabSelection( this.selected_tab,this.fromDate,this.toDate)
  }

  handlePageEventDoc(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getMedicalDocument();
  }

  closePopup() {
    this.medicalHistoryForm.reset();
    this.socialHistoryForm.reset();
    this.modalService.dismissAll("close");
    this.medicalFormType = '';
    this.notesForm.reset(); // Reset the form
    this.notesForm.get("icd10")?.setValue([]); // Clear the dropdown selection
    this.selectedICDCodes = []; // Clear selected items list
    this.noDataFound = false; // Reset "No Data Found" flag
    this.searchControl.setValue(""); // Clear search input
    // this.filteredICDList = [...this.totalICDList]; // Reset the filtered list
    this.modalService.dismissAll("close"); // Close the modal
    this.cdr.detectChanges(); // Ensure UI updates
  }



  // Add Vital Model
  // openVitalModal(vitalModal: any) {


  //   this.modalService.open(vitalModal, {
  //     centered: true,
  //     size: "lg",
  //     windowClass: "add_vital",
  //   });
  // }

  openVitalModal(vitalModal: any) {
    this.getAllVitalRanges();

    const modalRef = this.modalService.open(vitalModal, {
      centered: true,
      size: "lg",
      windowClass: "add_vital",
    });

    this.heightRange = {
      low: this.heightLow,
      high: this.heightHigh,
      gender: this.profile?.gender, 
      unit: this.heightunit 
    };
    
    this.weightRange = {
      low: this.weightLow,
      high: this.weightHigh,
      gender: this.profile?.gender,
      unit: this.weightunit
    };
    
    this.HeartRateRange = {
      low: this.heartrangeLow,
      high: this.heartrangeHigh,
      gender: this.profile?.gender,
      unit: this.heartrangeunit
    };
    
    this.bloodPressureSystolic = {
      low: this.bpsystolicLow,
      high: this.bpsystolicHigh,
      gender: this.profile?.gender,
      unit: this.bpsystolicUnit
    };
    
    this.bloodPressureBPDiastolic = {
      low: this.bpdiastolicLow,
      high: this.bpdiastolicHigh,
      gender: this.profile?.gender,
      unit: this.bpdiastolicUnit
    };
    
    this.pulseRange = {
      low: this.pulserangeLow,
      high: this.pulserangeHigh,
      gender: this.profile?.gender,
      unit:this.pulseunit
    };
    
    this.temperatureRange = {
      low: this.tempLow,
      high: this.tempHigh,
      gender: this.profile?.gender,
      unit:this.tempunit
    };
    
    this.bloodGlucoseRange = {
      low: this.bloodglucoseLow,
      high: this.bloodglucoseHigh,
      gender: this.profile?.gender,
      unit: this.bloodglucoseunit
    };

    
  }

  handleBack() {
    
    if (this.backType === 'emr') {
      this.route.navigate([`/individual-doctor/appointment/appointmentdetails/${this.appointmentId}`]);
    } else if (this.backType === 'back_to_appointment_list') {
      this.location.back();
    }else {
      this.location.back();
    }

    if (this.adminCheck === 'admin-view'){
      this.location.back();

    }

  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedIndex = event.index;
    let fromDate;
    let toDate;
    if (this.selectedIndex === 5 || this.selectedIndex === 6 || this.selectedIndex === 8) {
      fromDate = this.formatDate(new Date(this.fromDate), 'type');
      toDate = this.formatDate(new Date(this.toDate), 'type');
    }

    switch (this.selectedIndex) {
      case 0:
        this.getAlVitals(this.fromDate, this.toDate);
        break;
      case 1:
        this.getAllDetails();
        break;
      case 2:
        this.getAssessmentList(this.fromDate, this.toDate);
        break;
      case 3:
        this.getAllDignosis(this.fromDate, this.toDate);       
        break;
      case 4:
        this.getAllMedicationInfoList(this.fromDate, this.toDate);
        this.tabSelection('order_medicine',fromDate, toDate);  
        break;
      case 5:
        this.getAllLabTests(fromDate, toDate);      
        this.tabSelection('laboratory_test',fromDate, toDate);  
        break;
      case 6:
        this.getAllRadioTests(fromDate, toDate);
        this.tabSelection('radio_test',fromDate, toDate);  
        break;
      case 7:
        this.getPastAppointment(fromDate, toDate);
        break;
      case 8:
        this.getMedicalDocument();
        break;
      default:
        console.warn('No handler for selectedIndex', this.selectedIndex);
        break;
    }

  }


  showSection(section: string) {   
    this.selectedSection1 = section;
    this.currentPage = 1;
    this.updateDisplayedData();
  }
  showSection1(section: string){
    this.selectedSection = section;   
    this.currentPage = 1;
    this.updateDisplayedHistory();
  }

  /* pagination for history tab */
  updateDisplayedData() {    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    if (this.selectedSection === 'allergies') {

      this.displayedData = this.allergiesdataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection === 'social') {

      this.social_displayedData = this.socialdataSource?.slice(startIndex, endIndex);
    }
    if (this.selectedSection === 'family') {

      this.family_displayedData = this.familyhistorydataSource.slice(startIndex, endIndex);
    }

    if (this.selectedSection1 === 'height') {
      this.heightdisplayedData = this.heightdataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection1 === 'weight') {
      this.weightdisplayedData = this.weightdataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection1 === 'bmi') {
      this.bmidisplayedData = this.bmidataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection1 === 'heart_rate') {
      this.heart_ratedisplayedData = this.heart_ratedataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection1 === 'bpsystolic') {
      this.bpsystolicdisplayedData = this.bpsystolicdataSource.slice(startIndex, endIndex);
      this.bpRanges = this.getFilteredBpVitals(this.profile?.gender)?.[0] ?? {}; 
    }
    if (this.selectedSection1 === 'bpdiastolic') {
      this.bpdiastolicdisplayedData = this.bpdiastolicdataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection1 === 'pulse') {
      this.pulsedisplayedData = this.pulsedataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection1 === 'temp') {
      this.tempdisplayedData = this.tempdataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection1 === 'blood_glucose') {
      this.blood_glucosedisplayedData = this.blood_glucosedataSource.slice(startIndex, endIndex);
    }
  }

  updateDisplayedHistory() {    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    if (this.selectedSection === 'allergies') {

      this.displayedData = this.allergiesdataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection === 'social') {

      this.social_displayedData = this.socialdataSource?.slice(startIndex, endIndex);
    }
    if (this.selectedSection === 'family') {

      this.family_displayedData = this.familyhistorydataSource.slice(startIndex, endIndex);
    }    
  }

  changePage(page: number) {
    this.currentPage = page;
    this.updateDisplayedData();
    this. updateDisplayedHistory();
  }

  get totalPages() {
    let page;
    if (this.selectedSection === 'allergies') {
      page = Math.ceil(this.allergiesdataSource.length / this.itemsPerPage);

    }
    if (this.selectedSection === 'social') {
      page = Math.ceil(this.socialdataSource?.length / this.itemsPerPage);

    }
    if (this.selectedSection === 'family') {
      page = Math.ceil(this.familyhistorydataSource?.length / this.itemsPerPage);

    }
    if (this.selectedSection1 === 'height') {
      page = Math.ceil(this.heightdataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection1 === 'weight') {
      page = Math.ceil(this.weightdataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection1 === 'bmi') {
      page = Math.ceil(this.bmidataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection1 === 'heart_rate') {
      page = Math.ceil(this.heart_ratedataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection1 === 'bpsystolic') {
      page = Math.ceil(this.bpsystolicdataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection1 === 'bpdiastolic') {
      page = Math.ceil(this.bpdiastolicdataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection1 === 'pulse') {
      page = Math.ceil(this.pulsedataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection1 === 'temp') {
      page = Math.ceil(this.tempdataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection1 === 'blood_glucose') {
      page = Math.ceil(this.blood_glucosedataSource.length / this.itemsPerPage);
    }

    return page;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get totalRecords(): number {
    let count
    if (this.selectedSection === 'allergies') {
      count = this.allergiesdataSource.length;

    }
    if (this.selectedSection === 'social') {
      count = this.socialdataSource.length;

    }
    if (this.selectedSection === 'family') {
      count = this.familyhistorydataSource.length;

    }
    if (this.selectedSection1 === 'height') {
      count = this.heightdataSource.length;
    }
    if (this.selectedSection1 === 'weight') {
      count = this.weightdataSource.length;
    }
    if (this.selectedSection1 === 'bmi') {
      count = this.bmidataSource.length;
    }
    if (this.selectedSection1 === 'heart_rate') {
      count = this.heart_ratedataSource.length;
    }
    if (this.selectedSection1 === 'bpsystolic') {
      count = this.bpsystolicdataSource.length;
    }
    if (this.selectedSection1 === 'bpdiastolic') {
      count = this.bpdiastolicdataSource.length;
    }
    if (this.selectedSection1 === 'pulse') {
      count = this.pulsedataSource.length;
    }
    if (this.selectedSection1 === 'temp') {
      count = this.tempdataSource.length;
    }
    if (this.selectedSection1 === 'blood_glucose') {
      count = this.blood_glucosedataSource.length;
    }
    return count; // Total records from your data source
  }

  routeToViewResult(appId: any, testid: any, testName: any) {
    this.route.navigate([`/individual-doctor/patientmanagement/view-lab-results`], {
      queryParams: {
        appointmentId: appId,
        testID: testid,
        patientID: this.patient_id,
        testName: testName
      }
    })
  }
  openHistoryPopup(viewhistory: any, id: any) {

    this.modalService.open(viewhistory, {
      centered: true,
      size: "xl",
      windowClass: "show_history",
    });
    this.showHistoryTimeLine(id)
  }

  showHistoryTimeLine(id) {
    let reqData = {
      id: id
    };

    this.labRadioService.maintainLabOrder_testHistory(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.orderHistory = response?.data?.orderHistory;
        this._testHistoryData = response?.data?.testHistory;
      }
    });
  }

  isLastItem(item: any, array: any[]) {
    return array.indexOf(item) === array.length - 1;
  }

  removeUnderscores(status: string): string {
    return status.replace(/_/g, ' ');
  }

  onDateChange(type: string, event: Date, tabName: any ): void {
    if (type === 'from') {
      this.dateRangeForm.get('fromDate')?.setValue(event);
    } else if (type === 'to') {
      this.dateRangeForm.get('toDate')?.setValue(event);
    }

    const fromDate = this.dateRangeForm.get('fromDate')?.value;
    const toDate = this.dateRangeForm.get('toDate')?.value;

    this.fromDate = this.formatDate(fromDate);
    this.toDate = this.formatDate(toDate);



    this.getTabName(tabName, this.fromDate, this.toDate);
    this.tabSelection( this.selected_tab,this.fromDate,this.toDate)

  }


  getTabName(name: any, from: any, to: any) {
    let fromDate;
    let toDate;
    if (name === 'past_appointment' || name === 'laboratory' || name === 'radiology') {
      fromDate = this.formatDate(from, 'type');
      toDate = this.formatDate(to, 'type');
    }
    switch (name) {
      case 'vitals':
        this.getAlVitals(from, to);
        break;
      case 'assessment':
        this.getAssessmentList(from, to);
        break;
      case 'past_appointment':
        this.getPastAppointment(fromDate, toDate);
        break;
      case 'diagnosis':
        this.getAllDignosis(from, to);
        break;
      case 'medical_info':
        this.getAllMedicationInfoList(from, to);
        break;
      case 'laboratory':
        this.getAllLabTests(fromDate, toDate);
        break;
      case 'radiology':
        this.getAllRadioTests(fromDate, toDate);
        break; 
      default:
        break;
    }
  }

  formatDate(date: Date, type: any = ''): string {
    if (type === 'type') {

      return this.datepipe.transform(date, 'yyyy-MM-dd') || '';

    } else {

      return this.datepipe.transform(date, 'MM-dd-yyyy') || '';
    }
  }


  myFilter = (d: Date | null): boolean => {
    return true;
  };

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

  getMedicalDocument(from: any = '', to: any = '') {
    let reqData = {
      patientId: this.patient_id,
      page: this.page,
      limit: this.pageSize,
      type: 'self'
    };

    this.service.getMedicalDoument(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.medicalDocuments = response?.data?.result;
        this.totalDocLength = response?.data?.totalRecords
      }
    });
  }
  isPDF(fileKey: string): boolean {
    return fileKey.endsWith('.pdf');
  }
  routeTOdetails(id: any) {
    if(this.adminCheck === "admin-view") {
    this.route.navigate([`/individual-doctor/appointment/appointmentdetails/${id}`],
      {
        queryParams: {
          type: 'emr',
          adminCheck :this.adminCheck
        }

      }
    )
  }else{
    this.route.navigate([`/individual-doctor/appointment/appointmentdetails/${id}`],
      {
        queryParams: {
          type: 'emr'
        }

      }
    )
  }
  }
  openVerticallyPopupformedicalHistory(medicalHistory: any, element: any = '') {
    if (element) {
      this.selectedMHId = element?._id;
      this.medicalFormType = 'edit-medical-history'
      this.medicalHistoryForm.patchValue({
        allergen: element?.allergen,
        allergyType: element?.allergyType,
        reaction: element?.reaction,
        status: element?.status,
        note: element?.note,
      })
    }

    this.modalService.open(medicalHistory, {
      centered: true,
      size: "md",
      windowClass: "add_immunization",
    });

  }

  submitMedicalHistory() {
    this.medicalHistoryForm.markAllAsTouched();
    let todaysDate = new Date().toISOString();

    let reqData = {
      patientId: this.patient_id,
      allergen: this.medicalHistoryForm.value.allergen,
      allergyType: this.medicalHistoryForm.value.allergyType,
      reaction: this.medicalHistoryForm.value.reaction,
      status: this.medicalHistoryForm.value.status,
      note: this.medicalHistoryForm.value.note,
      createdAt: todaysDate
    };
    if (this.medicalFormType === 'edit-medical-history') {
      reqData['id'] = this.selectedMHId
      this.service.updateMedicalHistory(reqData).subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.closePopup();
          this.coreService.showSuccess("", response.message);
          this.getAllDetails();
        } else {
          this.closePopup();

        }
      });
    } else {
      if (this.medicalHistoryForm.valid) {
        this.service.addMedicalHistory(reqData).subscribe((res) => {
          let response = this.coreService.decryptObjectData({ data: res });
          if (response.status) {
            this.closePopup();
            this.coreService.showSuccess("", response.message);
            this.getAllDetails();
          } else {
            this.closePopup();

          }
        });
      }
    }
  }


  openVerticallyPopupforsocialHistory(socialHistory: any, element: any = '') {

    if (element) {
      this.selectedSHId = element?._id;
      this.medicalFormType = 'edit-social-history'
      this.socialHistoryForm.patchValue({
        alcohol: element?.alcohol,
        tobacco: element?.tobacco,
        drugs: element?.drugs
      })
    }

    this.modalService.open(socialHistory, {
      centered: true,
      size: "md",
      windowClass: "add_immunization",
    });

  }

  submitSocialHistory() {
    let todaysDate = new Date().toISOString();
    let reqData = {
      patientId: this.patient_id,
      alcohol: this.socialHistoryForm.value.alcohol,
      tobacco: this.socialHistoryForm.value.tobacco,
      drugs: this.socialHistoryForm.value.drugs,
      createdAt: todaysDate
    };
    if (this.medicalFormType === 'edit-social-history') {
      reqData['id'] = this.selectedSHId
      this.service.updateSocialHistory(reqData).subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.closePopup();
          this.coreService.showSuccess("", response.message);
          this.getAllDetails();
        } else {
          this.closePopup();

        }
      });
    } else {
      this.service.addSocialHistory(reqData).subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.closePopup();
          this.coreService.showSuccess("", response.message);
          this.getAllDetails();
        } else {
          this.closePopup();

        }
      });
    }
  }

  routeToDetailsPage(id) {
    this.loader.start();
    if(this.adminCheck === 'admin-view'){
      this.route.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.route.navigate([`/individual-doctor/patientmanagement/details/${id}`]);
      });
    }else{
      this.route.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.route.navigate([`/individual-doctor/patientmanagement/details/${id}`]);
      });
    }
  }
  openvitalGraph(vgraphpopup: any, graphType: any) {
    this.graphType = graphType;

    const colorConfig = this.lineChartColorsMap[this.graphType] || {};
    const dateFormatter = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
  });
  

    switch (this.graphType) {
      case 'Height':
        this.lineChartData = [
          {
            data: this.heightdataSource.map(item => parseFloat(item.value)),
            label: 'Height',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = this.heightdataSource.map(item => dateFormatter.format(new Date(item?.endDate)));
        // this.lineChartLabels = this.heightdataSource.map(item => item?.endDate);
        break;
      case 'Weight':
        this.lineChartData = [
          {
            data: this.weightdataSource.map(item => parseFloat(item.value)),
            label: 'Weight',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = this.weightdataSource.map(item =>dateFormatter.format(new Date(item?.endDate)));
        break;
      case 'Heart-Rate':
        this.lineChartData = [
          {
            data: this.heart_ratedataSource.map(item => parseFloat(item.value)),
            label: 'Heart Rate',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = this.heart_ratedataSource.map(item =>dateFormatter.format(new Date(item?.endDate)));
        break;
      case 'BMI':
        this.lineChartData = [
          {
            data: this.bmidataSource.map(item => parseFloat(item.value)),
            label: 'BMI',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = this.bmidataSource.map(item =>dateFormatter.format(new Date(item?.endDate)));
        break;
      case 'BP Systolic':
        this.lineChartData = [
          {
            data: this.bpsystolicdataSource.map(item => parseFloat(item.value)),
            label: 'BP Systolic',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = this.bpsystolicdataSource.map(item =>dateFormatter.format(new Date(item?.endDate)));
        break;
      case 'BP Diastolic':
        this.lineChartData = [
          {
            data: this.bpdiastolicdataSource.map(item => parseFloat(item.value)),
            label: 'BP Diastolic',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = this.bpdiastolicdataSource.map(item =>dateFormatter.format(new Date(item?.endDate)));
        break;
      case 'Pulse':
        this.lineChartData = [
          {
            data: this.pulsedataSource.map(item => parseFloat(item.value)),
            label: 'Pulse',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = this.pulsedataSource.map(item =>dateFormatter.format(new Date(item?.endDate)));
        break;
      case 'Temperature':
        this.lineChartData = [
          {
            data: this.tempdataSource.map(item => parseFloat(item.value)),
            label: 'Temperature',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = this.tempdataSource.map(item =>dateFormatter.format(new Date(item?.endDate)));
        break;
      case 'Blood Glucose':
        this.lineChartData = [
          {
            data: this.blood_glucosedataSource.map(item => parseFloat(item.value)),
            label: 'Blood Glucose',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = this.blood_glucosedataSource.map(item =>dateFormatter.format(new Date(item?.endDate)));
        break;
      default:
        console.error("Invalid graph type selected.");
        break;
    }
    this.modalService.open(vgraphpopup, {
      centered: true,
      size: "xl",
      windowClass: "add_immunization",
    });
  }

  getVitalThresholdList(sort: any = '') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      searchText: "",
      sort: sort
    };

    this.service.getVitalThreshold(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
    
      if (response.status) {
        // this.totalLength = response?.body?.totalRecords;
        let resultSource = response?.body?.result;
        
        if(resultSource !== undefined) {
          const heightRecords =resultSource.filter(record => record?.vitalsType === "HEIGHT");
          this.heightRange = heightRecords[0];

          const weightRecords =resultSource.filter(record => record?.vitalsType === "WEIGHT");
          this.weightRange = weightRecords[0];
          
          const heartRateRecords =resultSource.filter(record => record?.vitalsType === "HEART_RATE");
          this.HeartRateRange = heartRateRecords[0];

          const bpiRecords =resultSource.filter(record => record?.vitalsType === "BPI");
          this.bpiRange = bpiRecords[0];

          const bloodPressureRecords =resultSource.filter(record => record?.vitalsType === "BLOOD_PRESSURE");
          if(bloodPressureRecords.length > 0){
            this.bloodPressureSystolic = bloodPressureRecords[0].BPSystolic;
            this.bloodPressureBPDiastolic = bloodPressureRecords[0].BPDiastolic;
          }
          
          const pulseRecords =resultSource.filter(record => record?.vitalsType === "PULSE");
          this.pulseRange = pulseRecords[0];

          const temparatureRecords =resultSource.filter(record => record?.vitalsType === "TEMPERATURE");
          this.temperatureRange = temparatureRecords[0];
          

          const bloodGlucoseRecords =resultSource.filter(record => record?.vitalsType === "BLOOD_GLUCOSE");
          this.bloodGlucoseRange = bloodGlucoseRecords[0]
        }      
      }
    });
  }
  // opendetailsPopup(infopopup: any, data: any, type: any) {
   
  //   this.currentDate = data?.createdAt;
  //   switch (type) {
  //     case 'Height':
  //       this.infoLabel = "Height";
  //       this.currentValue = data?.value;
  //       this.criticalHigh = this.heightRange?.criticalHigh
  //       this.criticalLow = this.heightRange?.criticalLow
  //       this.normalHigh = this.heightRange?.high
  //       this.normalLow = this.heightRange?.low
  //       this.unit = this.heightRange?.unit
  //       break;
  //     case 'Weight':
  //       this.infoLabel = "Weight";
  //       this.currentValue = data?.value;
  //       this.criticalHigh = this.weightRange?.criticalHigh
  //       this.criticalLow = this.weightRange?.criticalLow
  //       this.normalHigh = this.weightRange?.high
  //       this.normalLow = this.weightRange?.low
  //       this.unit = this.weightRange?.unit

  //       break;
  //     case 'Heart-Rate':
  //       this.infoLabel = "Heart-Rate";
  //       this.currentValue = data?.value;
  //       this.criticalHigh = this.HeartRateRange?.criticalHigh
  //       this.criticalLow = this.HeartRateRange?.criticalLow
  //       this.normalHigh = this.HeartRateRange?.high
  //       this.normalLow = this.HeartRateRange?.low
  //       this.unit = this.HeartRateRange?.unit

  //       break;
  //     case 'BMI':
  //       this.infoLabel = "BMI";
  //       this.currentValue = data?.value;
  //       this.unit = this.bpiRange?.unit;

  //       break;
  //     case 'BP Systolic':
  //       this.infoLabel = "BP Systolic";
  //       this.currentValue = data?.value;
  //       this.criticalHigh = this.bloodPressureSystolic?.criticalHigh
  //       this.criticalLow = this.bloodPressureSystolic?.criticalLow
  //       this.normalHigh = this.bloodPressureSystolic?.high
  //       this.normalLow = this.bloodPressureSystolic?.low
  //       this.unit = this.bloodPressureSystolic?.unit

  //       break;
  //     case 'BP Diastolic':
  //       this.infoLabel = "BP Diastolic";
  //       this.currentValue = data?.value;
  //       this.criticalHigh = this.bloodPressureBPDiastolic?.criticalHigh
  //       this.criticalLow = this.bloodPressureBPDiastolic?.criticalLow
  //       this.normalHigh = this.bloodPressureBPDiastolic?.high
  //       this.normalLow = this.bloodPressureBPDiastolic?.low
  //       this.unit = this.bloodPressureBPDiastolic?.unit

  //       break;
  //     case 'Pulse':
  //       this.infoLabel = "Pulse";
  //       this.currentValue = data?.value;
  //       this.criticalHigh = this.pulseRange?.criticalHigh
  //       this.criticalLow = this.pulseRange?.criticalLow
  //       this.normalHigh = this.pulseRange?.high
  //       this.normalLow = this.pulseRange?.low
  //       this.unit = this.pulseRange?.unit

  //       break;
  //     case 'Temperature':
  //       this.infoLabel = "Temperature";
  //       this.currentValue = data?.value;
  //       this.criticalHigh = this.temperatureRange?.criticalHigh
  //       this.criticalLow = this.temperatureRange?.criticalLow
  //       this.normalHigh = this.temperatureRange?.high
  //       this.normalLow = this.temperatureRange?.low
  //       this.unit = this.temperatureRange?.unit

  //       break;
  //     case 'Blood Glucose':
  //       this.infoLabel = "Blood Glucose";
  //       this.currentValue = data?.value;
  //       this.criticalHigh = this.bloodGlucoseRange?.criticalHigh
  //       this.criticalLow = this.bloodGlucoseRange?.criticalLow
  //       this.normalHigh = this.bloodGlucoseRange?.high
  //       this.normalLow = this.bloodGlucoseRange?.low
  //       this.unit = this.bloodGlucoseRange?.unit

  //       break;
  //     default:
  //       break;
  //   }
  //   this.modalService.open(infopopup, {
  //     centered: true,
  //     size: "md",
  //     windowClass: "add_immunization",
  //   });
  // }

  //New for PopupData
  opendetailsPopup(infopopup: any, data: any, type: any) {
    this.currentDate = data?.createdAt;

    let ranges;

    const typeMapping: { [key: string]: string } = {
      WEIGHT: "Weight",
      HEART_RATE: "Heart Rate",
      PULSE: "Pulse",
      TEMPERATURE: "Temperature",
      BLOOD_GLUCOSE: "Blood Glucose",
      HEIGHT: "Height",
    };

    if (type === 'systolic') {
        ranges = this.getBpRanges();  
        
        this.infoLabel = "BP Systolic";
        this.currentValue = data?.value;
        this.criticalHigh = ranges?.BPSystolicCriticalHigh;
        this.criticalLow = ranges?.BPSystolicCriticalLow;
        this.normalHigh = ranges?.BPSystolicHigh;
        this.normalLow = ranges?.BPSystolicLow;
        this.unit = ranges?.unit; 
    }
    else if (type === 'diastolic') {
        ranges = this.getBpRanges();  

        this.infoLabel = "BP Diastolic";
        this.currentValue = data?.value;
        this.criticalHigh = ranges?.BPDiastolicCriticalHigh;
        this.criticalLow = ranges?.BPDiastolicCriticalLow;
        this.normalHigh = ranges?.BPDiastolicHigh;
        this.normalLow = ranges?.BPDiastolicLow;
        this.unit = ranges?.unit; 
    }
    else {
        const formattedType = typeMapping[type] || type;
        ranges = this.getVitalRanges(type);
        this.infoLabel = formattedType;
        this.currentValue = data?.value;
        this.unit = ranges?.unit;
        this.criticalHigh = ranges?.CriticalHigh;
        this.criticalLow = ranges?.CriticalLow;
        this.normalHigh = ranges?.High;
        this.normalLow = ranges?.Low;
    }

    this.modalService.open(infopopup, {
      centered: true,
      size: "md",
      windowClass: "add_immunization",
    });
  }



  openVerticallyCentered_addconsultation_notes(
    consultation_notes_content: any,
   
  ) {    
    this.modalService.open(consultation_notes_content, {
      centered: true,
      size: "lg",
      windowClass: "add_immunization",
    });
    this.getAllICDList();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged()) // Delay API calls
      .subscribe((searchText) => {
        this.filterICDList(searchText);
    });
  }

  handleSaveNotes() {
    this.isSubmitted = true;
  
    if (this.notesForm.invalid) {
      this.notesForm.markAllAsTouched();
      this.coreService.showError("", "Please fill all required fields.");
      return;
    }
    //Use `this.selectedICDCodes` instead of form value to avoid stale data
    const mappedIcdCodes = this.selectedICDCodes.map((icd: any) => {
      return {
        id: icd._id, // Correct ID mapping
        code: icd.disease_title 
          ? `${icd.code}:${icd.disease_title}` //Add `:` only if disease_title exists
          : icd.code
      };
    });
    const reqData = {
      subject: this.notesForm.value.subject,
      object: this.notesForm.value.object,
      assessment: this.notesForm.value.assessment,
      icdCode: mappedIcdCodes, //Updated data
      plan: this.notesForm.value.plan,
      doctorId: this.doctor_id,
      patientId: this.patient_id,
      appointmentId: this.appointmentId,
      id: this.updateNotes ? this.NoteId : ""
    };
  
    if (this.updateNotes) {
      this.doctorService.updateDiagnosisApi(reqData).subscribe((res) => {
        const response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.coreService.showSuccess(response.message, "");
          this.closePopup();
        } else {
          this.coreService.showError(response.message, "");
        }
      });
    } else {
      this.doctorService.addDiagnosis(reqData).subscribe((res) => {
        const response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.coreService.showSuccess(response.message, "");
          this.getAllDignosis(this.fromDate, this.toDate);  
          this.getAllICDList();
          this.closePopup();
        } else {
          this.coreService.showError(response.message, "");
        }
      });
    }
  }
  
    routeToLab() {
      this.route.navigate([`/individual-doctor/eprescription/eprescriptionlab`], {
        queryParams: {
          appointmentId: this.appointmentId,
          showAddButtton:this.showAddButtton
        }
      })
    }
    routeToMedicine() {
      this.route.navigate([`/individual-doctor/eprescription/eprescriptionmedicine`], {
        queryParams: {
          appointmentId: this.appointmentId,
          showAddButtton:this.showAddButtton

        }
      })
    } 
    routeToRadiology() {
      this.route.navigate([`/individual-doctor/eprescription/eprescriptionimaging`], {
        queryParams: {
          appointmentId: this.appointmentId,
          showAddButtton:this.showAddButtton
        }
      })
    }
     tabSelection(section: string,fromDate:any='', toDate:any=''){          
      fromDate = this.formatDate(new Date(this.fromDate), 'type');
      toDate = this.formatDate(new Date(this.toDate), 'type');  
      this.selected_tab = section;
      if (section === 'laboratory_test') {
        this.getAllLabTests(fromDate,toDate);      
      }
      if (section === 'lab_test_prescribed') {
      this.getLabTestPrescribed();
      }
      if (section === 'radio_test') {
        this.getAllRadioTests(fromDate,toDate);      
      }
      if (section === 'radio_test_prescribed') {
      this.getRadioTestPrescribed();
      }
      if (section === 'order_medicine') {
        this.getAllMedicationInfoList(fromDate,toDate);      
      }
      if (section === 'prescribed_medicine') {
      this.getAllprescribedMed();
      }
    }
    getLabTestPrescribed() {
      const fromDate = this.dateRangeForm?.value?.fromDate;
      const toDate = this.dateRangeForm?.value?.toDate;
  
      let reqData: any = {
          limit: this.pageSize,
          page: this.page,
          patientId: this.patientId
      };
  
      if (fromDate && toDate) {
          reqData.startDate = this.formatDate(new Date(fromDate), 'yyyy-MM-dd');  
          reqData.endDate = this.formatDate(new Date(toDate), 'yyyy-MM-dd');  
      }
  
  
      this.doctorService.getLAbTestAddedByDoctor(reqData).subscribe((res) => {
          let response = this.coreService.decryptObjectData({ data: res });
  
          if (response.status) {
              this.res_detailsLab = response?.body?.result;
              this.totalLength = response?.body?.totalRecords;
          }
      });
  }
  

  getRadioTestPrescribed() {
    const fromDate = this.dateRangeForm?.value?.fromDate;
    const toDate = this.dateRangeForm?.value?.toDate;
  
    let reqData: any = {
      limit: this.pageSize,
      page: this.page,
      patientId: this.patientId
    };
  
    if (fromDate && toDate) {
      reqData.startDate = this.formatDate(fromDate, 'yyyy-MM-dd');  
      reqData.endDate = this.formatDate(toDate, 'yyyy-MM-dd');  
    }

    this.doctorService.getradioTestAddedByDoctor(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
  
      if (response.status) {
        this.res_detailsRadio = response?.body?.result;
        this.totalLength = response?.body?.totalRecords;          
      }
    });
  }
  
  
  getAllprescribedMed() {
    const fromDate = this.dateRangeForm?.value?.fromDate;
    const toDate = this.dateRangeForm?.value?.toDate;
    let reqData: any = {
      limit: this.pageSize,
      page: this.page,
      patientId:this.patientId
    };
    if (fromDate && toDate) {
      reqData.fromDate = this.formatDate(fromDate, 'yyyy-MM-dd');
      reqData.toDate = this.formatDate(toDate, 'yyyy-MM-dd');
    }
    this.doctorService.getAllEprescriptionTests(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.res_detailsPrescribeMed = response?.body?.result;          
        this.totalLength = response?.body?.totalRecords;
      }
    });
  }

  patientParentFullDetails() {
    let reqData = {
      patient_id: this.patient_id,
    };

    this.service.patientParentFullDetails(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });

      if (response.status) {
        this.familyhistoryparent = response?.body;
      }
    });
}


  //BpVitals
  fetchVitals() {
    const params = {
      page: 1,  // Example page number
      limit: 10 // Example limit
    };

    this.service.getBloodPressureVitals(params).subscribe(
      (res: any) => {
        let response = this._coreService.decryptObjectData({ data: res });
        
        
        if (response.status) {
          this.VitalData = response.body.result;
        }
      },
      (error) => {
        console.error("Error fetching BP vitals:", error);
      }
    );
  }
  
  getFilteredBpVitals(gender: string) {
  
    return this.VitalData
      .filter(vital =>
        vital.vitalsType === 'BLOOD_PRESSURE' &&
        vital.referenceRange.some(ref => 
          ref.gender === gender || ref.gender === 'All'
        )
      )
      .map(vital => {
        const systolic = vital.referenceRange[0]; // BPSystolic
        const diastolic = vital.referenceRange[1]; // BPDiastolic        
  
        return {
          BPSystolicHigh: systolic?.high ?? null,
          BPSystolicLow: systolic?.low ?? null,
          BPSystolicCriticalHigh: systolic?.criticalHigh ?? null,
          BPSystolicCriticalLow: systolic?.criticalLow ?? null,
          BPSystolicunit: systolic?.unit ?? null,
  
          BPDiastolicHigh: diastolic?.high ?? null,
          BPDiastolicLow: diastolic?.low ?? null,
          BPDiastolicCriticalHigh: diastolic?.criticalHigh ?? null,
          BPDiastolicCriticalLow: diastolic?.criticalLow ?? null,
          BPDiasystolicunit: diastolic?.unit ?? null,
        };
      });
  }
  
  getFilteredVitals(vitalType: string, gender: string):VitalRange[] {
    return this.VitalData
      .filter(vital => 
        vital.vitalsType === vitalType &&
        vital.referenceRange.some(ref => 
          ref.gender === gender || ref.gender === 'All'
        )
      )
      .map(vital => {
        const reference = vital.referenceRange.find(ref => 
          ref.gender === gender || ref.gender === 'All'
        );
  
        return {
          High: reference?.high ?? undefined,
          Low: reference?.low ?? undefined,
          CriticalHigh: reference?.criticalHigh ?? undefined,
          CriticalLow: reference?.criticalLow ?? undefined,
          Unit: reference?.unit ?? undefined,
        };
      });
  }


  // Heart Rate Ranges
getHeartRateRanges() {
  const ranges = this.getFilteredVitals("HEART_RATE", this.profile?.gender)[0];
  this.heartrangeHigh = ranges?.High || 190;
  this.heartrangeLow = ranges?.Low || 100;
  this.heartrangeunit = ranges?.Unit || "bpm";
}

// Pulse Ranges
getPulseRanges() {
  const ranges = this.getFilteredVitals("PULSE", this.profile?.gender)[0];
  this.pulserangeHigh = ranges?.High || 100;
  this.pulserangeLow = ranges?.Low || 60;
  this.pulseunit = ranges?.Unit || "bpm";
}

// Temperature Ranges
getTemperatureRanges() {
  const ranges = this.getFilteredVitals("TEMPERATURE", this.profile?.gender)[0];
  this.tempHigh = ranges?.High || 37.5;
  this.tempLow = ranges?.Low || 36.1;
  this.tempunit =ranges?.Unit || "C";
}

// Blood Glucose Ranges
getBloodGlucoseRanges() {
  const ranges = this.getFilteredVitals("BLOOD_GLUCOSE", this.profile?.gender)[0];
  this.bloodglucoseHigh = ranges?.High || 140;
  this.bloodglucoseLow = ranges?.Low || 80;
  this.bloodglucoseunit = ranges?.Unit || "mg/dL" ;
}

// BMI Ranges
getBMIRanges() {
  const ranges = this.getFilteredVitals("BMI", this.profile?.gender)[0];
  this.bmiHigh = ranges?.High || 24.9;
  this.bmiLow = ranges?.Low || 18.5;
}

// BP Systolic Ranges
getBPSystolicRanges() {
  const bpRanges = this.getFilteredBpVitals(this.profile?.gender)[0];
  this.bpsystolicHigh = bpRanges?.BPSystolicHigh || 120;
  this.bpsystolicLow = bpRanges?.BPSystolicLow || 90;
  this.bpsystolicUnit = bpRanges?.BPSystolicunit || "mmHg";
}

// BP Diastolic Ranges
getBPDiastolicRanges() {
  const bpRanges = this.getFilteredBpVitals(this.profile?.gender)[0];
  this.bpdiastolicHigh = bpRanges?.BPDiastolicHigh || 80;
  this.bpdiastolicLow = bpRanges?.BPDiastolicLow || 60;
  this.bpdiastolicUnit = bpRanges?.BPDiasystolicunit || "mmHg";

}
// Height Ranges
getHeightRanges() {
  const ranges = this.getFilteredVitals("HEIGHT", this.profile?.gender)[0];
  this.heightHigh = ranges?.High || 193.6;
  this.heightLow = ranges?.Low || 163.2;
  this.heightunit = ranges?.Unit || "cms";
}

// Weight Ranges
getWeightRanges() {
  const ranges = this.getFilteredVitals("WEIGHT", this.profile?.gender)[0];
  this.weightHigh = ranges?.High || 80;
  this.weightLow = ranges?.Low || 50;
  this.weightunit = ranges?.Unit || "kgs";
}


getAllVitalRanges() {
  this.getHeartRateRanges();
  this.getPulseRanges();
  this.getTemperatureRanges();
  this.getBloodGlucoseRanges();
  this.getBMIRanges();
  this.getBPSystolicRanges();
  this.getBPDiastolicRanges();
  this.getHeightRanges();
  this.getWeightRanges();
}

  getVitalRanges(vitalType: string): VitalRange {
    const defaultVitalRanges: { [key: string]: VitalRange } = {
      WEIGHT: { High: 90, Low: 60, CriticalHigh: 150, CriticalLow: 45, Unit: "Kgs" },
      HEART_RATE: { High: 100, Low: 60, CriticalHigh: 140, CriticalLow: 40, Unit: "Bpm" },
      PULSE: { High: 100, Low: 60, CriticalHigh: 130, CriticalLow: 40, Unit: "Bpm" },
      TEMPERATURE: { High: 37.5, Low: 36.1, CriticalHigh: 42, CriticalLow: 30, Unit: "C" },
      BLOOD_GLUCOSE: { High: 140, Low: 80, CriticalHigh: 160, CriticalLow: 60, Unit: "mg/dL" },
      HEIGHT: { High: 185, Low: 155, CriticalHigh: 195 ,CriticalLow: 135,Unit: "Cms"}

    };

    const defaultRange: VitalRange = defaultVitalRanges[vitalType] || {
      High: undefined,
      Low: undefined,
      CriticalHigh: undefined,
      CriticalLow: undefined,
      Unit: undefined,
    };

    const vitalRanges = this.getFilteredVitals(vitalType, this.profile?.gender)[0] || defaultRange;
    
    return {
      High: vitalRanges.High ?? defaultRange.High,
      Low: vitalRanges.Low ?? defaultRange.Low,
      CriticalHigh: vitalRanges.CriticalHigh ?? defaultRange.CriticalHigh,
      CriticalLow: vitalRanges.CriticalLow ?? defaultRange.CriticalLow,
      Unit: vitalRanges.Unit ?? defaultRange.Unit,
    };
  }

  getVitalClass(value: number, vitalType: string): string {
    const ranges = this.getVitalRanges(vitalType);

    if (!ranges) return 'result-unknown';

    if (value <= ranges.CriticalLow) return 'result-criticalLow';
    if (value <= ranges.Low) return 'result-low';
    if (value >= ranges.CriticalHigh) return 'result-criticalHigh';
    if (value >= ranges.High) return 'result-high';
    
    return 'result-normal';
  }




  getBpRanges() {
    return {
      BPSystolicHigh: this.bpRanges?.BPSystolicHigh || 120, 
      BPSystolicLow: this.bpRanges?.BPSystolicLow || 90,
      BPSystolicCriticalHigh: this.bpRanges?.BPSystolicCriticalHigh || 145,
      BPSystolicCriticalLow: this.bpRanges?.BPSystolicCriticalLow || 70,
      
      BPDiastolicHigh: this.bpRanges?.BPDiastolicHigh || 80,
      BPDiastolicLow: this.bpRanges?.BPDiastolicLow || 60,
      BPDiastolicCriticalHigh: this.bpRanges?.BPDiastolicCriticalHigh || 100,
      BPDiastolicCriticalLow: this.bpRanges?.BPDiastolicCriticalLow || 40
    };
  }
  getBpClass(value: number, type: 'systolic' | 'diastolic'): string {
    const ranges = this.getBpRanges();
    
    if (type === 'systolic') {
      if (value <= ranges.BPSystolicCriticalLow) return 'result-criticalLow';
      if (value <= ranges.BPSystolicLow) return 'result-low';
      if (value >= ranges.BPSystolicCriticalHigh) return 'result-criticalHigh';
      if (value >= ranges.BPSystolicHigh) return 'result-high';
      return 'result-normal';
    } else {
      if (value <= ranges.BPDiastolicCriticalLow) return 'result-criticalLow';
      if (value <= ranges.BPDiastolicLow) return 'result-low';
      if (value >= ranges.BPDiastolicCriticalHigh) return 'result-criticalHigh';
      if (value >= ranges.BPDiastolicHigh) return 'result-high';
      return 'result-normal';
    }
  }
  filterICDList(searchText: string) {
    if (!searchText?.trim()) {
      this.filteredICDList = [...this.totalICDList]; // Reset to full list
      this.noDataFound = false;
      return;
    }
  
    let reqData = { limit: 0, page: 1, searchText }; // Pass searchText in API request
  
    this.doctorService.getAllCodesFilter(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);
  
      if (response.status) {
        this.filteredICDList = response?.body?.data || []; // Load results from API
        this.noDataFound = this.filteredICDList.length === 0;
      } else {
        this.filteredICDList = [];
        this.noDataFound = true;
      }
  
      this.cdr.detectChanges(); // Force UI update
    });
  }
  

  toggleSelection(item: any, event: MatCheckboxChange) {
    event.source.focus(); // Keep focus on checkbox
    event.source._elementRef.nativeElement.click(); // Simulate click without closing
  
    let selectedICDs = this.notesForm.get("icd10")?.value || [];
  
    if (this.isSelected(item._id)) {
      // Remove from selected list
      selectedICDs = selectedICDs.filter((id) => id !== item._id);
      this.selectedICDCodes = this.selectedICDCodes.filter(
        (selected) => selected._id !== item._id
      );
    } else {
      // Add to selected list
      selectedICDs.push(item._id);
      this.selectedICDCodes.push(item);
    }
  
    this.notesForm.patchValue({ icd10: selectedICDs });
  }

  isSelected(id: string) {
    return this.notesForm.get("icd10")?.value.includes(id);
  }

  removeSelected(item: any) {
    let selectedICDs = this.notesForm.get("icd10")?.value || [];
  
    // Remove from selected list
    selectedICDs = selectedICDs.filter((id) => id !== item._id);
    this.selectedICDCodes = this.selectedICDCodes.filter(
      (selected) => selected._id !== item._id
    );
  
    // Update form
    this.notesForm.patchValue({ icd10: selectedICDs });
  }

  downloadTestResult_forExternalLabs(link:any,name:any){
    this.triggerFileDownload(link, name);
  }

  onNavigate(url:any): void {
    const menuitems = JSON.parse(localStorage.getItem('activeMenu'));
    if(menuitems){
      this.currentUrl = url
    
     const matchedMenu = menuitems.find(menu => menu.route_path === this.currentUrl);
     this.route.navigate([url]).then(() => {
       
       this.doctorService.setActiveMenu(matchedMenu?.name);
     });
    }
   
  }
}
