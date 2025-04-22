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

// Vital table
export interface PeriodicElement {
  date: string;
  height: string;
  weight: string;
  hrate: number;
  bmi: string;
  bpsystolic: string;
  bpdiastolic: string;
  pulse: number;
  temp: number;

  hepaticssummary: number;
}
const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: "app-vital",
  templateUrl: "./vital.component.html",
  styleUrls: ["./vital.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class VitalComponent implements OnInit {
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

  // Vital table
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
  profile: any;
  public mappedBloodPressureData: any[] = [];
  pageSizeVital: number = 20;
  fromDate: string = "";
  toDate: string ="";
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() patient_id: any;
  @Output() refreshDetails = new EventEmitter<string>();
  @Input() appointmentId: any;
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
  unit: any = "";
 
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
      h_rate: ['', ],
      bmi: ['', ],
      bp_systolic: ['', ],
      bp_diastolic: ['', ],
      pulse: ['', ],
      temp: ['', ],
      blood_glucose: ['', ],
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
    this.getVitalThresholdList();
    this.getAppointmentDetails();
    
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

  getVitalsAddedBydoctor(from:any ="", to:any="") {
    
    let reqData = {
      patientId: this.patient_id,
      // appointmentId: this.appointmentId,
      limit: this.pageSize,
      page: this.page,
      fromDate:from,
      toDate:to
      // ,"isCompare"
    }
    this.patientService.getPatientVitals(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({data:res});

      if (response.status) {
        this.vitalsdataSource = response?.data?.result;        
        this.totalLength = response?.data?.totalRecords;
      } 
    }); 
  }

  getVitalThresholdList(sort: any = '') {
    let reqData = {
      page: this.page,
      limit: this.pageSizeVital,
      searchText: "",
      sort: sort
    };

    this.patientService.getVitalThreshold(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
    
      if (response.status) {
        // this.totalLength = response?.body?.totalRecords;
        this.resultSource = response?.body?.result;

        const heightRecords = this.resultSource.filter(record => record.vitalsType === "HEIGHT");
        this.heightRange = heightRecords[0];

        const weightRecords = this.resultSource.filter(record => record.vitalsType === "WEIGHT");
        this.weightRange = weightRecords[0];
        
        const heartRateRecords = this.resultSource.filter(record => record.vitalsType === "HEART_RATE");
        this.HeartRateRange = heartRateRecords[0];

        const bpiRecords = this.resultSource.filter(record => record.vitalsType === "BPI");
        this.bpiRange = bpiRecords[0];

        const bloodPressureRecords = this.resultSource.filter(record => record.vitalsType === "BLOOD_PRESSURE");
        if(bloodPressureRecords.length > 0){
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

    /* old */
    let reqData = {
      patient_id: this.patient_id,
      appointment_id: this.appointmentId,
      role: "doctor",
      added_by: this.doctor_id,
      is_manual: true,
      vitals_data: [
        {
          ...this.vitalForm.value
        }
      ]
    }
    this.patientService.addVitals(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData(res);
      if (response.status) {
        this.closePopup()
        this.toastr.success(response.message);
        this.getVitalsAddedBydoctor();
      } else {
        this.toastr.error(response.message);
      }
    });

     /* new */
 
    //  let reqData = {
    //   patient_id: this.patient_id,
    //   appointment_id: this.appointmentId,
    //   role: "doctor",
    //   added_by: this.doctor_id,
    //   is_manual: true,
    //   vitals_data: [
    //     {
    //       height: {
    //           startDate: new Date().toISOString(),
    //           endDate: new Date().toISOString(),
    //           value: this.vitalForm.value.height,
    //           unit:"cm"
    //       },
    //       weight: {
    //           startDate: new Date().toISOString(),
    //           endDate: new Date().toISOString(),
    //           value: this.vitalForm.value.weight,
    //           unit:"kg"
    //       },
    //       h_rate: {
    //           startDate: new Date().toISOString(),
    //           endDate: new Date().toISOString(),
    //           value: this.vitalForm.value.h_rate,
    //           unit:"bpm"

    //       },
    //       bmi: {
    //           startDate: new Date().toISOString(),
    //           endDate: new Date().toISOString(),
    //           value: this.vitalForm.value.bmi
    //       },
    //       bp_systolic: {
    //           startDate: new Date().toISOString(),
    //           endDate: new Date().toISOString(),
    //           value: this.vitalForm.value.bp_systolic,
    //           unit:"mmHg"
    //       },
    //       bp_diastolic: {
    //           startDate: new Date().toISOString(),
    //           endDate: new Date().toISOString(),
    //           value: this.vitalForm.value.bp_diastolic,
    //           unit:"mmHg"
    //       },
    //       pulse: {
    //           startDate: new Date().toISOString(),
    //           endDate: new Date().toISOString(),
    //           value: this.vitalForm.value.pulse,
    //           unit:"bpm"
    //       },
    //       temp: {
    //           startDate: new Date().toISOString(),
    //           endDate: new Date().toISOString(),
    //           value: this.vitalForm.value.temp,
    //           unit:"°F"
    //       },
    //       blood_glucose: {
    //           startDate: new Date().toISOString(),
    //           endDate: new Date().toISOString(),
    //           value: this.vitalForm.value.blood_glucose,
    //           unit: "mg/dL"
    //       }
    //   }
    //   ]
    // }
    // this.patientService.addVitals_newAPI(reqData).subscribe((res) => {
      
    //   let response = this.coreService.decryptObjectData({data: res} );
      
    //   if (response.status) {
    //     this.closePopup()
    //     this.toastr.success(response.message);
    //     this.getVitalsAddedBydoctor();
    //   } else {
    //     this.toastr.error(response.message);
    //   }
    // });

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
    this.modalService.open(vitalModal, {
      centered: true,
      size: "lg",
      windowClass: "add_vital",
    });
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

   //delete popup
   openVerticallyCenteredsecond(deletePopup: any, vitalId: any) {
    this.vitalId = vitalId;
    this.modalService.open(deletePopup, { centered: true, size: "sm" });
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

  deleteVitals(){  
    this.patientService
      .deleteVitalsAPI(this.vitalId)
      .subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this.coreService.decryptObjectData(encryptedData);
        if (response.status) {
          // this.loader.stop();
          this.getVitalsAddedBydoctor();
          this.toastr.success(response.message);
          this.closePopup();
        } else {
          // this.loader.stop();
          this.toastr.error(response.message);
        }
      })
  }

  openvitalGraph(vgraphpopup: any, graphType: any) {
    this.graphType = graphType;
    
    const extractedData = this.vitalsdataSource.map(record => ({
      date: new Date(record.createdAt).toISOString().split('T')[0], // Extract the date part
      height: record.height,
      weight: record.weight,
      h_rate: record.h_rate,
      pulse: record.pulse,
      temp: record.temp,
      bp_diastolic: record.bp_diastolic,
      bp_systolic: record.bp_systolic,
      bmi: record.bmi,
      blood_glucose: record.blood_glucose
    }));
    const colorConfig = this.lineChartColorsMap[this.graphType] || {};

    switch (this.graphType) {
      case 'Height':
        this.lineChartData = [
          {
            data: extractedData.map(item => parseFloat(item.height)),
            label: 'Height',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = extractedData.map(item => item.date);
        break;
      case 'Weight':
        this.lineChartData = [
          {
            data: extractedData.map(item => parseFloat(item.weight)),
            label: 'Weight',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = extractedData.map(item => item.date);
        break;
      case 'Heart-Rate':
        this.lineChartData = [
          {
            data: extractedData.map(item => parseFloat(item.h_rate)),
            label: 'Heart Rate',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = extractedData.map(item => item.date);
        break;
      case 'BMI':
        this.lineChartData = [
          {
            data: extractedData.map(item => parseFloat(item.bmi)),
            label: 'BMI',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = extractedData.map(item => item.date);
        break;
      case 'BP Systolic':
        this.lineChartData = [
          {
            data: extractedData.map(item => parseFloat(item.bp_systolic)),
            label: 'BP Systolic',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = extractedData.map(item => item.date);
        break;
      case 'BP Diastolic':
        this.lineChartData = [
          {
            data: extractedData.map(item => parseFloat(item.bp_diastolic)),
            label: 'BP Diastolic',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = extractedData.map(item => item.date);
        break;
      case 'Pulse':
        this.lineChartData = [
          {
            data: extractedData.map(item => parseFloat(item.pulse)),
            label: 'Pulse',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = extractedData.map(item => item.date);
        break;
      case 'Temperature':
        this.lineChartData = [
          {
            data: extractedData.map(item => parseFloat(item.temp)),
            label: 'Temperature',
            fill: true,
            tension: 0.4,
            ...colorConfig,
          },
        ];
        this.lineChartLabels = extractedData.map(item => item.date);
        break;
        case 'Blood Glucose':
          this.lineChartData = [
            {
              data: extractedData.map(item => parseFloat(item.blood_glucose)),
              label: 'Blood Glucose',
              fill: true,
              tension: 0.4,
              ...colorConfig,
            },
          ];
          this.lineChartLabels = extractedData.map(item => item.date);
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


  opendetailsPopup(infopopup:any,data:any, type:any){
    this.currentDate = data?.createdAt;   
    switch (type) {
      case 'Height':
        this.infoLabel = "Height";
        this.currentValue = data?.height;
          this.criticalHigh = this.heightRange?.criticalHigh
        this.criticalLow = this.heightRange?.criticalLow
        this.normalHigh =this.heightRange?.high
        this.normalLow =this.heightRange?.low
        this.unit = this.heightRange?.unit
        break;
      case 'Weight':
        this.infoLabel = "Weight";
        this.currentValue = data?.weight;
        this.criticalHigh = this.weightRange?.criticalHigh
        this.criticalLow = this.weightRange?.criticalLow
        this.normalHigh =this.weightRange?.high
        this.normalLow =this.weightRange?.low
        this.unit = this.weightRange?.unit

        break;
      case 'Heart-Rate':
        this.infoLabel = "Heart-Rate";
        this.currentValue = data?.h_rate;   
        this.criticalHigh = this.HeartRateRange?.criticalHigh
        this.criticalLow = this.HeartRateRange?.criticalLow
        this.normalHigh =this.HeartRateRange?.high
        this.normalLow =this.HeartRateRange?.low   
        this.unit = this.HeartRateRange?.unit

        break;
      case 'BMI':        
       this.infoLabel = "BMI";
       this.currentValue = data?.bmi;
       this.unit = this.bpiRange?.unit;

        break;
      case 'BP Systolic':
        this.infoLabel = "BP Systolic";
        this.currentValue = data?.bp_systolic;
        this.criticalHigh = this.bloodPressureSystolic?.criticalHigh
        this.criticalLow = this.bloodPressureSystolic?.criticalLow
        this.normalHigh =this.bloodPressureSystolic?.high
        this.normalLow =this.bloodPressureSystolic?.low
        this.unit = this.bloodPressureSystolic?.unit

        break;
      case 'BP Diastolic':
        this.infoLabel = "BP Diastolic";
        this.currentValue = data?.bp_diastolic;
          this.criticalHigh = this.bloodPressureBPDiastolic?.criticalHigh
        this.criticalLow = this.bloodPressureBPDiastolic?.criticalLow
        this.normalHigh =this.bloodPressureBPDiastolic?.high
        this.normalLow =this.bloodPressureBPDiastolic?.low
        this.unit = this.bloodPressureBPDiastolic?.unit

        break;
      case 'Pulse':
        this.infoLabel = "Pulse";
        this.currentValue = data?.pulse;
          this.criticalHigh = this.pulseRange?.criticalHigh
        this.criticalLow = this.pulseRange?.criticalLow
        this.normalHigh =this.pulseRange?.high
        this.normalLow =this.pulseRange?.low
        this.unit = this.pulseRange?.unit

        break;
      case 'Temperature':
        this.infoLabel = "Temperature";
        this.currentValue = data?.temp;
          this.criticalHigh = this.temperatureRange?.criticalHigh
        this.criticalLow = this.temperatureRange?.criticalLow
        this.normalHigh =this.temperatureRange?.high
        this.normalLow =this.temperatureRange?.low
        this.unit = this.temperatureRange?.unit

        break;
      case 'Blood Glucose':
        this.infoLabel = "Blood Glucose";
        this.currentValue = data?.blood_glucose;
        this.criticalHigh = this.bloodGlucoseRange?.criticalHigh
        this.criticalLow = this.bloodGlucoseRange?.criticalLow
        this.normalHigh =this.bloodGlucoseRange?.high
        this.normalLow =this.bloodGlucoseRange?.low
        this.unit = this.bloodGlucoseRange?.unit

          break;
      default:
        break;
    }
    this.modalService.open(infopopup, {
      centered: true,
      size: "md",
      windowClass: "add_immunization",
    });
  }


}
