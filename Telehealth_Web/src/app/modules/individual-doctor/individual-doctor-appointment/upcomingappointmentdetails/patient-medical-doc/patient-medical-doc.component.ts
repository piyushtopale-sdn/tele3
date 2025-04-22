import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FourPortalService } from 'src/app/modules/four-portal/four-portal.service';
import { PatientService } from 'src/app/modules/patient/patient.service';
import { CoreService } from 'src/app/shared/core.service';

@Component({
  selector: 'app-patient-medical-doc',
  templateUrl: './patient-medical-doc.component.html',
  styleUrls: ['./patient-medical-doc.component.scss']
})
export class PatientMedicalDocComponent {
  @Input() fromParent: any;
  @Output() refreshDetails = new EventEmitter<string>();
  @Input() patient_id: any;


  documentdisplayedColumns: string[] = [
    'date',
    "documnet_name",
    "issueDate",
    "expirydate",
    "action"

  ];
  medicalDocuments: any[] = [];
  dateRangeForm: FormGroup;
  fromDate: string = "";
  toDate: string = "";
  pageSize: number = 5;
  totalDocLength: number = 0;
  setDocToView: any = "";
  page: any = 1;

  constructor(
    private service: PatientService,
    private datepipe: DatePipe,
    private coreService: CoreService,
    private modalService: NgbModal,
    private route: Router,
    private fb: FormBuilder,
    private activateRoute: ActivatedRoute,
    private dateAdapter: DateAdapter<Date>,
    private sanitizer: DomSanitizer,
    private labRadioService: FourPortalService,

  ) {
   
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });
  }

  ngOnInit(): void {
    this.activateRoute.queryParams.subscribe((res) => {
      

    });    

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.dateRangeForm.patchValue({
      fromDate: firstDay,
      toDate: lastDay
    });

    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(lastDay);

    this.getMedicalDocument();


  }

  getMedicalDocument(from:any='', to:any='') {
    let reqData = {
      patientId: this.patient_id,
      page:this.page,
      limit: this.pageSize,
      type:'self'
    };

    this.service.getMedicalDoument(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });      
      if (response.status) {
        this.medicalDocuments = response?.data?.result;
        this.totalDocLength = response?.data?.totalRecords
      }
    });
  }

  handlePageEventDoc(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getMedicalDocument();
  }

  onDateChange(type: string, event: Date): void {
    if (type === 'from') {
      this.dateRangeForm.get('fromDate')?.setValue(event);
    } else if (type === 'to') {
      this.dateRangeForm.get('toDate')?.setValue(event);
    }

    const fromDate = this.dateRangeForm.get('fromDate')?.value;
    const toDate = this.dateRangeForm.get('toDate')?.value;

    this.fromDate = this.formatDate(fromDate);
    this.toDate = this.formatDate(toDate);
  }

  formatDate(date: Date, type:any=''): string {
    if(type === 'type'){
      
      return this.datepipe.transform(date, 'yyyy-MM-dd') || '';

    }else{

      return this.datepipe.transform(date, 'MM-dd-yyyy') || '';
    }
  }

  myFilter = (d: Date | null): boolean => {
    return true;
  };

  isPDF(fileKey: string): boolean {
    return fileKey.endsWith('.pdf');
  }

  downloadTestResult(id: any) {  
    let reqData = {
      id:id
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

  openVerticallyCenteredquickview(quick_view: any, url: any) {
    this.setDocToView = url;
    
    this.modalService.open(quick_view, {
      centered: true,
      size: "xl",
      windowClass: "quick_view",
    });
  }

}
