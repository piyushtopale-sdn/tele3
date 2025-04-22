import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "../indiviual-doctor.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { ToastrService } from "ngx-toastr";
import FileSaver from 'file-saver'

@Component({
  selector: "app-individual-doctor-mydocument",
  templateUrl: "./individual-doctor-mydocument.component.html",
  styleUrls: ["./individual-doctor-mydocument.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class IndividualDoctorMydocumentComponent implements OnInit {
  providerForm: FormGroup;
  isSubmitted: boolean = false;
  uploadFile: any;
  portalUserId: any;
  providerData: any;
  startDate: any = "";
  endDate: any = "";
  toggleValue: boolean = false;
  ProviderDoc: any;
  length: number;
  constructor(
    private modalService: NgbModal,
    private doctorService: IndiviualDoctorService,
    private _coreService: CoreService,
    private loader: NgxUiLoaderService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private coreService: CoreService
  ) {
    this.providerForm = this.fb.group({
      upload_date: [new Date(), [Validators.required]],
      title: ["", [Validators.required]],
      upload_doc: ["", [Validators.required]],
    });
  }

  ngOnInit(): void {
    let loginData = JSON.parse(sessionStorage.getItem("loginData"));
    this.portalUserId = loginData?._id;
    this.getPortalDocumentList();
  
  }
  get forgotFormControl(): { [key: string]: AbstractControl } {
    return this.providerForm.controls;
  }
  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  // Upload Document modal
  openVerticallyCentereduploaddocs(uploaddocs: any) {
    this.modalService.open(uploaddocs, {
      centered: true,
      size: "",
      windowClass: "upload_docs",
      
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
  closePopup() {
    this.providerForm.reset({
      upload_date: new Date()
    });
    this.modalService.dismissAll("close popup");
    // this.addNewService();
    this.uploadFile=''
  }
  onDateChange(event: any) {
    const day = event.value.getDate();
    const month = event.value.getMonth() + 1;
    const year = event.value.getFullYear();

    // Padding with leading zeros if necessary
    const dayString = day < 10 ? "0" + day : day;
    const monthString = month < 10 ? "0" + month : month;

    this.startDate = `${dayString}/${monthString}/${year}`;
  }
  onDateChange2(event: any) {
    const day = event.value.getDate();
    const month = event.value.getMonth() + 1;
    const year = event.value.getFullYear();

    // Padding with leading zeros if necessary
    const dayString = day < 10 ? "0" + day : day;
    const monthString = month < 10 ? "0" + month : month;

    this.endDate = `${dayString}/${monthString}/${year}`;
    this.getPortalDocumentList();
  }
  onFileSelected(event: any) {
    const selectedFiles: FileList = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const file: File = selectedFiles[0];
      if (file.type.includes("pdf") || file.type.includes("image")) {
        this.uploadFile = file;

        const reader: FileReader = new FileReader();
        reader.readAsDataURL(file);
      } else {
        this.coreService.showError("", "Only PDF and image files are allowed.");
      }
    }
  }

 

  onSubmit() {
    this.isSubmitted = true;
    if (this.providerForm.invalid) {
      return;
    }
    this.isSubmitted = false;
    const day = this.providerForm.get("upload_date").value.getDate();
    const month = this.providerForm.get("upload_date").value.getMonth() + 1;
    const year = this.providerForm.get("upload_date").value.getFullYear();
    const dayString = day < 10 ? "0" + day : day;
    const monthString = month < 10 ? "0" + month : month;
    const Upload_date = `${dayString}/${monthString}/${year}`;
    this.loader.start();
    const formData: any = new FormData();
    formData.append("document", this.uploadFile);
    formData.append("upload_date", Upload_date);
    formData.append("title", this.providerForm.value.title);
    formData.append("docType", "ProviderDocument");
    formData.append("for_portal_user_id", this.portalUserId);

    this.doctorService.uploadDocumentProvider(formData).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.loader.stop();
          this.toastr.success(response.message);
          this.closePopup();
          this.getPortalDocumentList();
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      },
      (err: any) => {
        this.toastr.error(err.error.message);
        this.loader.stop();
      }
    );
  }

  getPortalDocumentList() {
    this.loader.start();

    let data = {
      portalUserId: this.portalUserId,
      startDate: this.startDate,
      endDate: this.endDate,
    };
    this.doctorService.getPortaldocumentList(data).subscribe(
      (res) => {
        let data = this._coreService.decryptObjectData({ data: res });
        if (data.status === true) {
          this.providerData = data?.body?.documents;
          this.loader.stop();
        } else {
          this.providerData=[]
          this.toastr.error(data.message);
          this.loader.stop();
        }
      },
      (err: any) => {
        this.loader.stop();
      }
    );
  }

  toggleStatus1(event, id) {
    this.loader.start();
    let data = {
      documentId: id,
      status: event?.checked,
      action: "inactive",
    };
    this.doctorService.statusUpdateProviderDoc(data).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.loader.stop();
          this.toastr.success(response.message);
          this.getPortalDocumentList();
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      },
      (err: any) => {
        this.toastr.error(err.error.message);
        this.loader.stop();
      }
    );
  }

  openVerticallyCenteredsecond(deletePopup: any, docId: any) {
    this.ProviderDoc = docId;
    this.modalService.open(deletePopup, { centered: true, size: "sm" });
  }

  deleteProviderDoc() {
    this.loader.start();

    let data = {
      documentId: this.ProviderDoc,
      status: "true",
      action: "deleted",
    };
    this.doctorService.statusUpdateProviderDoc(data).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
       
          this.loader.stop();
          this.toastr.success(response.message);
          this.getPortalDocumentList();
          this.closePopup();
     
          // this.loader.stop();
          // this.toastr.error(response.message);
          // this.getPortalDocumentList();
        
      },
      (err: any) => {
        this.toastr.error(err.error.message);
        this.loader.stop();
        this.getPortalDocumentList();



      }
    );
  }
 
  openVerticallyCenteredsecond1(data1: any) {
    this.loader.start();

    let data={
      url:data1?.doc_name
    }
    this.doctorService.getProviderDoc(data).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
           FileSaver.saveAs(response.data, "pdf");
          this.loader.stop();
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      },
      (err: any) => {
        this.toastr.error(err.error.message);
        this.loader.stop();
      }
    );

  }
}
