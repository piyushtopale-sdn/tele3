import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ChartOptions } from 'chart.js';
import { PatientService } from 'src/app/modules/patient/patient.service';
import { LabimagingdentalopticalService } from 'src/app/modules/super-admin/labimagingdentaloptical.service';
import { CoreService } from 'src/app/shared/core.service';
import { Location } from "@angular/common";

@Component({
  selector: 'app-viewlab-manual-result',
  templateUrl: './viewlab-manual-result.component.html',
  styleUrls: ['./viewlab-manual-result.component.scss']
})
export class ViewlabManualResultComponent {
  displayedLabColumns: string[] = [
    "date",    
    "result","referenceRange",
    "flag",
    "status"
  ];

  lineChartData: any;
  lineChartOptions: ChartOptions<'line'>;
  appointmentId: any;
  testId: any;
  testREsultDetails: any[] = [];
  centreDetails: any;
  patientID: any;
  testName: any;
  type: any;
  testResultId: any = '';
  procedureName: any;
  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;
  procedure_Details: any;
  dataSource: any[] = []
  shouldShowGraph: boolean = false;

  constructor(private fb: FormBuilder,
    private coreService: CoreService,
    private lad_radioAdminService: LabimagingdentalopticalService,
    private location: Location,
    private patientService: PatientService,
    private modalService: NgbModal,
    private activatedRoute: ActivatedRoute) {

    this.activatedRoute.queryParams.subscribe((params: any) => {
      
      this.appointmentId = params?.appointmentId;
      this.testId = params?.testID;
      this.patientID = params?.patientID;
      this.testName = params?.testName;
      this.type = params?.type;
      this.testResultId = params?.testResultId
      
    })
     

  }
  ngOnInit(): void {      

    if(this.type === 'back_to_appointment'){
      this.getLabResult();
    }else{
      this.getTestResultDetails(); 
    }
    
  }

 
  getTestResultDetails() {
    let reqData = {
      appointmentId: this.appointmentId,
      testId: this.testId,
      resultType: 'manual',
    };

    this.lad_radioAdminService.getLABTestResultDetails_API(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);      
      if (response.status) {
        this.testREsultDetails = response?.data;
        
        this.centreDetails = response?.data[0]?.centerDetails;
      }
    });
  }

  getUniqueProcedures(): string[] {
    const procedures = new Set<string>();
    if (this.testREsultDetails && this.testREsultDetails.length > 0) {      
      this.testREsultDetails.forEach(test => {
        if (test.manualResultData && test.manualResultData.length > 0) {
          test.manualResultData.forEach(data => procedures.add(data.procedure));
        }
      });
    }
    return Array.from(procedures);
  }

  // getResultForProcedure(manualResultData: any[], procedure: string) {
  //   const resultData = manualResultData ? manualResultData.find(data => data.procedure === procedure) : null;
  //   // Only show flag if it's not "NA" or "N"
  //   const flagDisplay = resultData && resultData.flag !== "NA" && resultData.flag !== "N" ? resultData.flag : "";
  //   return resultData ? `${flagDisplay} ${resultData.result}`.trim() : '-';
  // }

  getResultForProcedure(manualResultData: any[], procedure: string) {    
    const resultData = manualResultData ? manualResultData.find(data => data.procedure === procedure) : null;
  
    // Only show flag if it's not "NA" or "N"
    const flagDisplay = resultData && resultData.flag !== "NA" && resultData.flag !== "N" ? resultData.flag : "";
  
    let data = resultData ? `${flagDisplay} ${resultData.result}`.trim() : '-';
    let ref_range = resultData.referenceRange;
  
    // Return both data and flag
    return {
      data,
      flag: resultData ? resultData.flag : null,
      ref_range:ref_range ? ref_range : null
    };
  }
  
  
  getLabResult(){
    let reqData = {
      id:this.testResultId
    };
    this.lad_radioAdminService
      .getLabTestResultById(reqData)
      .subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });        
        if (response.status) {
          let resData = response?.data;
          this.testREsultDetails.push(resData);
          this.centreDetails = response?.data?.centerDetails;
        }
      })
  }
  

  handleBack() {
    // if(this.type === 'back_to_appointment'){
    //   this.route.navigate([`/individual-doctor/appointment/appointmentdetails/${this.appointmentId}`]);
    // }else{
    //   this.route.navigate([`/individual-doctor/patientmanagement/details/${this.patientID}`]);
    // }
    this.location.back();

  }

  openTestInfoPopup(labinfopopup:any, data:any) {
    if(data){
      this.procedureName = data;
      this.getLabTestDetails(data);
     
    }
    
    this.modalService.open(labinfopopup, {
      centered: true,
      size: "xl",
      windowClass: "labinfopopup",
    });
  }
  closePopup() {   
    this.modalService.dismissAll("close");
  
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getLabTestDetails(this.procedureName);
  }

  getLabTestDetails(procedure: any='') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      procedure:procedure,
      patientId: this.patientID,
    };

    this.patientService.getlab_TestProcedureDetails(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
    
      this.procedure_Details = response?.data?.data.flatMap((data) => {
        return data?.manualResultData.map((manualData) => {
          return {
            procedure: manualData.procedure,
            result: manualData.result,
            flag: manualData.flag,
            status: manualData.status,
            referenceRange: manualData.referenceRange,
            updatedAt: data.updatedAt, // Use updatedAt from the parent object
          };
        });
         
      });
      this.dataSource = this.procedure_Details;
      
      this.totalLength = response?.data?.totalRecords;
      this.initializeChartData(this.procedure_Details);
      this.initializeChartOptions();
    });
  }

  initializeChartData(data: any) {
    // Check if any flag is 'NA'
    this.shouldShowGraph = data.every(item => item.flag !== 'NA');
  
    if (this.shouldShowGraph) {
      this.lineChartData = {
        labels: data.map(item => new Date(item.updatedAt).toLocaleDateString('en-GB')),
        datasets: [
          {
            label: 'Results',
            data: data.map(item => parseFloat(item.result)),
            borderColor: 'brown',
            backgroundColor: 'rgba(165, 42, 42, 0.1)', // Brown background color
            fill: true,
            tension: 0.4,
          }
        ]
      };
    }
  }
  
  initializeChartOptions(dynamicMax: any = '') {
    this.lineChartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date',
          },
        },
        y: {
          beginAtZero: true,
          max: dynamicMax || undefined,
          title: {
            display: true,
            text: 'Result',
          },
        },
      },
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
}
