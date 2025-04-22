import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";

export interface PeriodicElement {
  medicine: string;
  packorunit: string;
  frequency: string;
  duration: number;
}
import { FourPortalService } from "../../four-portal.service";
import { DatePipe, Location } from "@angular/common";
import { NgxUiLoaderService } from "ngx-ui-loader";




const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: 'app-appointment-details',
  templateUrl: './appointment-details.component.html',
  styleUrls: ['./appointment-details.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppointmentDetailsComponent implements OnInit {
  fromDate: string = "";
  toDate: string = "";
  patient_details: any;
  displayedColumns: string[] = [
    "testName",
    "dateTime",
    "status",
    "viewResult"
  ];
  dataSource: MatTableDataSource<AbstractControl>;
  test_details: any[] = [];

  resultForm: FormGroup
  innerMenuPremission: any = [];
  userPermission: any;
  userRole: string;
  appointmentId: any;
  orderDetails: any;
  doctorName: any;
  testID: any;
  selectedValue: string;
  orderStatus: any;
  showStatus: string;
  previousStatus: any;
  selectedFile: File | null = null;
  fileError: string | null = null;
  orderHistory:any [] = [];
  _testHistoryData :any [] = [];

  constructor(
    private modalService: NgbModal,
    private coreService: CoreService,
    private fb: FormBuilder,
    private labradioService: FourPortalService,
    private activatedRoute: ActivatedRoute,
    private loader: NgxUiLoaderService,
    private location : Location

  ) {
    let portalUser = this.coreService.getLocalStorage("loginData");
    this.userRole = portalUser.role;
    let paramId = this.activatedRoute.snapshot.paramMap.get("id");
    this.appointmentId = paramId;
    this.userPermission = portalUser.permissions;

    this.resultForm = this.fb.group({
      resultStatus: ["", [Validators.required]],
      comment: [""]
    });

  }

  ngOnInit(): void {

    this.getOrderDetails();
  }

  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission() {
    let menuID = sessionStorage.getItem("currentPageMenuID");
    let checkData = this.findObjectByKey(this.userPermission, "parent_id", menuID)
    if (checkData) {
      if (checkData.isChildKey == true) {
        var checkSubmenu = checkData.submenu;
        if (checkSubmenu.hasOwnProperty("order_request")) {
          this.innerMenuPremission = checkSubmenu['order_request'].inner_menu;
        } else {
        }
      } else {
        var checkSubmenu = checkData.submenu;
        let innerMenu = [];
        for (let key in checkSubmenu) {
          innerMenu.push({ name: checkSubmenu[key].name, slug: key, status: true });
        }
        this.innerMenuPremission = innerMenu;

      }
    }
  }

  giveInnerPermission(value) {
    if (this.userRole === "PHARMACY_STAFF") {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    } else {
      return true;

    }
  }

  getOrderDetails() {
    let reqData = {
      appointment_id: this.appointmentId
    }
    this.labradioService
      .appointment_deatils(reqData)
      .subscribe(
        async (res) => {
          
          let response = await this.coreService.decryptObjectData({ data: res });          
          if (response.status) {
            this.patient_details = response?.data?.patientDetails;
            this.orderDetails = response?.data?.appointmentDetails;
            this.orderStatus = this.orderDetails?.appointmentStatus;
            this.doctorName = response?.data?.doctor_basic_info?.doctorName
            this.dataSource = this.orderDetails?.testDetails;
            this.previousStatus = this.orderStatus;
            this.test_details = this.orderDetails?.testDetails
            
          }

        })
  }

  // onFileChange(event: Event): void {
  //   const input = event.target as HTMLInputElement;
  //   if (input.files && input.files.length > 0) {
  //     const file = input.files[0];
  //     if (file.type === 'application/pdf') {
  //       this.selectedFile = file;
  //       this.fileError = null;
  //     } else {
  //       this.selectedFile = null;
  //       this.fileError = 'Only PDF files are allowed.';
  //     }
  //   }
  // }

  onSubmit() {
    const isInvalid = this.resultForm.invalid || !this.selectedFile;
    if (isInvalid) {
      this.resultForm.markAllAsTouched();
      if (!this.selectedFile) {
        this.fileError = 'PDF file must be less than 50 MB.';
      }
      this.coreService.showError('', 'Please fill all required fields and upload a valid PDF file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile!); // `!` ensures non-null assertion
    formData.append('appointmentId', this.appointmentId);
    formData.append('testId', this.testID);
    formData.append('comment', this.resultForm.value.comment);
    formData.append('resultStatus', this.resultForm.value.resultStatus);
    formData.append('resultType', 'upload');
    this.loader.start();
    this.labradioService.uploadTestREsultsApiForm(formData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.loader.stop();
        this.coreService.showSuccess("", response.message);
        this.getOrderDetails();
        this.closePopup();
      } else {
        this.loader.stop();
        this.coreService.showError("", response.message);

      }
    })
  }
  openVerticallyCentereduploadresult(
    uploadresult: any, id: any
  ) {    
    this.testID = id;
    this.modalService.open(uploadresult, {
      centered: true,
      size: "md",
      windowClass: "master_modal add_lab",
    });
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.resultForm.reset();
    this.orderStatus = this.previousStatus;
  }

  onStatusChange(selectedValue: string, statusUpdate: any): void {
    this.selectedValue = selectedValue;
    if (selectedValue === 'COMPLETED') {
      this.showStatus = 'completed';

    } else {
      this.showStatus = 'under process';
    }


    this.modalService.open(statusUpdate, {
      centered: true,
      size: "md",
      windowClass: "master_modal add_lab",
    });

  }


  updateOrderStatus() {
    let reqData = {
      appointmentId: this.appointmentId,
      actionName: 'status',
      actionValue: this.selectedValue

    }
    this.labradioService.updateOrderStatus_API(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.coreService.showSuccess("", response.message);
        this.getOrderDetails();
        this.closePopup();
      } else {
        this.coreService.showError("", response.message);

      }
    })
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
    };

    this.labradioService.maintainLabOrder_testHistory(reqData).subscribe((res) => {
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

  downloadTestResult(id: any) {    
    let reqData = {
      id:id
    };
    this.labradioService.getLabTestResultById(reqData).subscribe((res) => {
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

  get allTestsCompleted(): boolean {
    if( this.test_details.length > 0){
      return this.test_details.every(test => test?.status === 'COMPLETED');
    }else{
      return false;
    }
    
  }

  routeBack(){
    this.location.back();
  }


  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
  
      if (file.type === 'application/pdf') {
        if (file.size > 50 * 1024 * 1024) {
          this.selectedFile = null;
          this.fileError = 'The file size must be less than 50MB.';
        } else {
          this.selectedFile = file;
          this.fileError = null; // Reset error if file is valid
        }
      } else {
        this.selectedFile = null;
        this.fileError = 'Only PDF files are allowed.';
      }
    }
  }
}
