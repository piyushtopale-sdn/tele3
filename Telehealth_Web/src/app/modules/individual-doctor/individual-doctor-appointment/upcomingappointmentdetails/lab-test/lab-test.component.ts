import {
  Component,
  Input,
  Output,
  EventEmitter,
} from "@angular/core";

import { IndiviualDoctorService } from "../../../indiviual-doctor.service";
import { FourPortalService } from "src/app/modules/four-portal/four-portal.service";
import { CoreService } from "src/app/shared/core.service";
import { RoundedRect } from "chart.js/types/geometric";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { NgxUiLoaderService } from "ngx-ui-loader";



@Component({
  selector: 'app-lab-test',
  templateUrl: './lab-test.component.html',
  styleUrls: ['./lab-test.component.scss']
})
export class LabTestComponent {
  @Input() fromParent: any;
  @Output() refreshDetails = new EventEmitter<string>();
  @Input() appointmentId: any;
  @Input() patient_id: any;

  res_details: any;
  page: any = 1;
  pageSize: number = 2;
  totalLength: number = 0;
  displayedColumns: string[] = [
    "date",
    "testname",
    "centrename",
    "status",
    "action"
  ];
  orderHistory:any [] = [];
  _testHistoryData :any [] = [];
  userRole: any;
  constructor(
    private indiviualDoctorService: IndiviualDoctorService,
    private coreService: CoreService,
    private router : Router,
    private modalService: NgbModal,
    private labRadioService: FourPortalService,
    private loader: NgxUiLoaderService,

  ) {
    let loginData = JSON.parse(localStorage.getItem('loginData'))
    this.userRole = loginData?.role;
  }

  ngOnInit(): void {
    this.getAllLAbTests();
  }

  getAllLAbTests() {
    let reqData = {
      appointmentId: this.appointmentId,
      limit: this.pageSize,
      page: this.page
    };
    this.indiviualDoctorService
      .getLAbTestAddedByDoctor(reqData)
      .subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });   
         if (response.status) {
          this.res_details = response?.body?.result;
          this.totalLength = response?.body?.totalRecords;
        }
      }
    );
  }

  downloadTestResult(id: any) {  
    let reqData = {
      id:id
    };
    this.loader.start();
    this.labRadioService.getLabTestResultById(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.loader.stop();

      if (response.status) {
      this.loader.stop();

          let resData = response?.data;
          const uploadResult = resData?.uploadResultData[0];
          const signedUrl = uploadResult?.signedUrl;

          if (signedUrl) {
              this.triggerFileDownload(signedUrl, uploadResult?.key);
          } else {
              console.error("No signedUrl found in the response");
          }
      } else {
      this.loader.stop();

          console.error("Failed to fetch test result:", response.message);
      }
  }, (error) => {
    this.loader.stop();

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


  routeTo() {
    this.router.navigate([`/individual-doctor/eprescription/eprescriptionlab`], {
      queryParams: {
        appointmentId: this.appointmentId
      }
    })
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllLAbTests();
  }


  routeToViewResult(testResultId:any, appId:any, testName:any) {
    this.router.navigate([`/individual-doctor/patientmanagement/view-lab-results`],{
      queryParams : {
        appointmentId : appId,
        testResultId : testResultId, 
        testName: testName,     
        type : "back_to_appointment",
        patientID:this.patient_id
        
      }
    })
  }

  closePopup() {
    this.modalService.dismissAll("close");
  }
  openHistoryPopup(viewhistory: any, id:any) {
   
    this.modalService.open(viewhistory, {
      centered: true,
      size: "xl",
      windowClass: "show_history",
    });
    this.showHistoryTimeLine(id)
  }

  showHistoryTimeLine(id) {
    let reqData = {
      id:id,
      serviceType:'lab'
    };

    this.indiviualDoctorService.getPrescribeTestHistory(reqData).subscribe((res) => {
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
  downloadTestResult_forExternalLabs(link:any,name:any){
    this.triggerFileDownload(link, name);
  }
}

