import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  Input,
  Output,
  EventEmitter,
} from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { PatientService } from "src/app/modules/patient/patient.service";
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { DatePipe } from '@angular/common';

interface VitalRange {
  High: number | undefined;
  Low: number | undefined;
  CriticalHigh: number | undefined;
  CriticalLow: number | undefined;
  Unit: string | undefined;
}

@Component({
  selector: 'app-new-vital',
  templateUrl: './new-vital.component.html',
  styleUrls: ['./new-vital.component.scss'],
  encapsulation: ViewEncapsulation.None,

})
export class NewVitalComponent {
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
  vitalsdataSource: any[] = [];
  resultSource: any[] = [];
  heightRange: any;
  weightRange: any;
  HeartRateRange: any;
  bpiRange: any;
  bloodPressureSystolic: any;
  bloodPressureBPDiastolic: any;
  pulseRange: any;
  temperatureRange: any;
  bloodGlucoseRange: any;
  patientAllDetails: any;
  patientGender: any;
  patientDOB: any;
  public mappedBloodPressureData: any[] = [];
  pageSizeVital: number = 20;
  fromDate: string = "";
  toDate: string = "";
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() patient_id: any;
  @Output() refreshDetails = new EventEmitter<string>();
  @Input() appointmentId: any;
  @Input() profile: any;
  doctor_id: any = ""
  bloodGroupList: any[] = [];
  vitalForm: any = FormGroup;
  userRole: any;
  page: any = 1;
  pageSize: number = 5;
  totalLength: number = 0;
  vitalId: any;
  isSubmitted: boolean = false;
  graphType: any;
  currentDate: any;
  currentValue: any;
  infoLabel: string;
  criticalHigh: any = "";
  criticalLow: any = "";
  normalHigh: any = "";
  normalLow: any = "";
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
  weightHigh: any = "";
  weightLow: any = "";
  weightunit: any = "";
  unit: any = "";
  selectedSection: string = 'height';
  currentPage = 1;
  itemsPerPage = 10;
  displayedData: any;
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
    rangesfortemp: any = {};

    

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private patientService: PatientService,
    private coreService: CoreService,
    private toastr: ToastrService,
    private datePipe: DatePipe
  ) {
    let loginData = JSON.parse(localStorage.getItem('loginData'))
    this.userRole = loginData?.role;
    this.doctor_id = loginData?._id
    this.vitalForm = this.fb.group({
      height: ['', [Validators.required]],
      weight: ['', [Validators.required]],
      h_rate: ['',],
      bmi: ['',],
      bp_systolic: ['',],
      bp_diastolic: ['',],
      pulse: ['',],
      temp: ['',],
      blood_glucose: ['',],
    });

    this.vitalForm.get('height').valueChanges.subscribe(() => {
      this.calculateBMI();
    });

    this.vitalForm.get('weight').valueChanges.subscribe(() => {
      this.calculateBMI();
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
    this.getVitalsAddedBydoctor();
    this.getAppointmentDetails();
    // this.getVitalThresholdList();
    //bpvitals
    this.fetchVitals();


  }

  

  getAppointmentDetails() {
    this.patientService
      .viewAppointmentDetails(this.appointmentId)
      .subscribe(
        async (res) => {
          let response = await this.coreService.decryptObjectData({
            data: res,
          });
          this.patientAllDetails = response?.data?.patientDetails;
          this.patientGender = response?.data?.patientDetails?.gender;
          this.patientDOB = response?.data?.patientDetails?.dob;
        },
        (err) => {
          let errResponse = this.coreService.decryptObjectData({
            data: err.error,
          });
          this.toastr.error(errResponse.message);
        }
      );
  }

  getVitalsAddedBydoctor(from: any = "", to: any = "") {

    let reqData = {
      patientId: this.patient_id,
      // appointmentId: this.appointmentId,
      limit: this.pageSize,
      page: this.page,
      fromDate: from,
      toDate: to
      // ,"isCompare"
    }
    this.patientService.getPatientAllVitals_newAPI(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });      
      if (response.status) {
        this.vitalsdataSource = response?.data?.result;
        this.totalLength = response?.data?.totalRecords;

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

  getVitalThresholdList(sort: any = '') {


    function calculateAge(dateOfBirth: string): string {
      const dob = new Date(dateOfBirth); // Convert the string to a Date object
      const today = new Date(); // Current date
    
      let age = today.getFullYear() - dob.getFullYear(); // Difference in years
    
      // Adjust if the current date is before the birthday in the current year
      const isBeforeBirthday =
        today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
    
      if (isBeforeBirthday) {
        age--;
      }

      if(age >=0 && age<60){
        return "0-59"
      }else if(age>=60){
        return "60 +"
      }

      return "all"

    }

    const age = calculateAge(this.patientDOB)
    
    let reqData = {
      page: this.page,
      limit: this.pageSizeVital,
      searchText: "",
      sort: sort,
      gender: this.patientGender,
      ageFilter:age
    };

    this.patientService.getVitalThreshold(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });

      if (response.status) {
        // this.totalLength = response?.body?.totalRecords;
        this.resultSource = response?.data?.result;
        const heightRecords = this.resultSource.filter(record => record.vitalsType === "HEIGHT");
        this.heightRange = heightRecords[0];
        const weightRecords = this.resultSource.filter(record => record.vitalsType === "WEIGHT");
        this.weightRange = weightRecords[0]?.filteredReferenceRange[0];

        const heartRateRecords = this.resultSource.filter(record => record.vitalsType === "HEART_RATE");
        this.HeartRateRange = heartRateRecords[0]?.filteredReferenceRange[0];

        const bpiRecords = this.resultSource.filter(record => record.vitalsType === "BPI");
        this.bpiRange = bpiRecords[0];

        const bloodPressureRecords = this.resultSource.filter(record => record.vitalsType === "BLOOD_PRESSURE");
        if (bloodPressureRecords.length > 0) {
          this.bloodPressureSystolic = bloodPressureRecords[0].BPSystolic;
          this.bloodPressureBPDiastolic = bloodPressureRecords[0].BPDiastolic;
        }

        const pulseRecords = this.resultSource.filter(record => record.vitalsType === "PULSE");
        this.pulseRange = pulseRecords[0];

        const temparatureRecords = this.resultSource.filter(record => record.vitalsType === "TEMPERATURE");
        this.temperatureRange = temparatureRecords[0];


        const bloodGlucoseRecords = this.resultSource.filter(record => record.vitalsType === "BLOOD_GLUCOSE");
        this.bloodGlucoseRange = bloodGlucoseRecords[0]
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
  
    this.patientService.addVitals_newAPI(reqData).subscribe((res) => {

      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.closePopup()
        this.toastr.success(response.message);
        this.getVitalsAddedBydoctor();
      } else {
        this.toastr.error(response.message);
      }
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

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  // Add Vital Model
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

  closePopup() {
    this.vitalForm.reset()
    this.modalService.dismissAll('close')
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getVitalsAddedBydoctor();
  }



  onDateChange(type: string, event: Date): void {
    const formattedDate = this.formatDate(event);
    if (type === 'from') {
      this.fromDate = formattedDate;
    } else if (type === 'to') {
      this.toDate = formattedDate;
    }

    if (this.fromDate && this.toDate) {
      this.getVitalsAddedBydoctor(this.fromDate, this.toDate);
    }
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'MM-dd-yyyy') || '';
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


  opendetailsPopup(infopopup: any, data: any, type: any) {
   
    this.currentDate = data?.createdAt;
    let ranges;
    const typeMapping: { [key: string]: string } = {
      WEIGHT: "Weight",
      HEART_RATE: "Heart Rate",
      PULSE: "Pulse",
      TEMPERATURE: "Temperature",
      BLOOD_GLUCOSE: "Blood Glucose",
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

  showSection(section: string) {
    this.selectedSection = section;
    this.currentPage = 1;
    this.updateDisplayedData();
  }


  /* pagination for */
  updateDisplayedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    if (this.selectedSection === 'height') {
      this.heightdisplayedData = this.heightdataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection === 'weight') {
      this.weightdisplayedData = this.weightdataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection === 'bmi') {
      this.bmidisplayedData = this.bmidataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection === 'heart_rate') {
      this.heart_ratedisplayedData = this.heart_ratedataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection === 'bpsystolic') {
      this.bpsystolicdisplayedData = this.bpsystolicdataSource.slice(startIndex, endIndex);
      this.bpRanges = this.getFilteredBpVitals(this.profile?.gender)?.[0] ?? {}; 
    }
    if (this.selectedSection === 'bpdiastolic') {
      this.bpdiastolicdisplayedData = this.bpdiastolicdataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection === 'pulse') {
      this.pulsedisplayedData = this.pulsedataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection === 'temp') {
      this.tempdisplayedData = this.tempdataSource.slice(startIndex, endIndex);
    }
    if (this.selectedSection === 'blood_glucose') {
      this.blood_glucosedisplayedData = this.blood_glucosedataSource.slice(startIndex, endIndex);
    }

  }

  changePage(page: number) {
    this.currentPage = page;
    this.updateDisplayedData();
  }

  get totalPages() {
    let page;
    if (this.selectedSection === 'height') {
      page = Math.ceil(this.heightdataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection === 'weight') {
      page = Math.ceil(this.weightdataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection === 'bmi') {
      page = Math.ceil(this.bmidataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection === 'heart_rate') {
      page = Math.ceil(this.heart_ratedataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection === 'bpsystolic') {
      page = Math.ceil(this.bpsystolicdataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection === 'bpdiastolic') {
      page = Math.ceil(this.bpdiastolicdataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection === 'pulse') {
      page = Math.ceil(this.pulsedataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection === 'temp') {
      page = Math.ceil(this.tempdataSource.length / this.itemsPerPage);
    }
    if (this.selectedSection === 'blood_glucose') {
      page = Math.ceil(this.blood_glucosedataSource.length / this.itemsPerPage);
    }

    return page;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get totalRecords(): number {
    let count
    if (this.selectedSection === 'height') {
      count = this.heightdataSource.length;
    }
    if (this.selectedSection === 'weight') {
      count = this.weightdataSource.length;
    }
    if (this.selectedSection === 'bmi') {
      count = this.bmidataSource.length;
    }
    if (this.selectedSection === 'heart_rate') {
      count = this.heart_ratedataSource.length;
    }
    if (this.selectedSection === 'bpsystolic') {
      count = this.bpsystolicdataSource.length;
    }
    if (this.selectedSection === 'bpdiastolic') {
      count = this.bpdiastolicdataSource.length;
    }
    if (this.selectedSection === 'pulse') {
      count = this.pulsedataSource.length;
    }
    if (this.selectedSection === 'temp') {
      count = this.tempdataSource.length;
    }
    if (this.selectedSection === 'blood_glucose') {
      count = this.blood_glucosedataSource.length;
    }
    return count; // Total records from your data source
  }

   //BpVitals
   fetchVitals() {
    const params = {
      page: 1,  
      limit: 10 
    };

    this.patientService.getBloodPressureVitals(params).subscribe(
      (res: any) => {
        let response = this.coreService.decryptObjectData({ data: res });                 
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
}
