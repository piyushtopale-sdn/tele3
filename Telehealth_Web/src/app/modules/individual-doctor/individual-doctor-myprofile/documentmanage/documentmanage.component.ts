import { Component, OnInit, Input } from "@angular/core";
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormControl,
} from "@angular/forms";
import { MatStepper } from "@angular/material/stepper";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";

@Component({
  selector: "app-documentmanage",
  templateUrl: "./documentmanage.component.html",
  styleUrls: ["./documentmanage.component.scss"],
})
export class DocumentmanageComponent implements OnInit {
  @Input() public mstepper: MatStepper;
  documentManagementForm!: FormGroup;
  isSubmitted: any = false;

  pageForAdd: any = true;
  doctorId: any = "";
  docDetails: any = [];
  showUrl = "";
  stepper: any;
  setDocToView: any = [];
  docDetailsurldetails: any = [];
  attachmentType: any;
  constructor(
    private fb: FormBuilder,
    private _coreService: CoreService,
    private toastr: ToastrService,
    private activatedRoute: ActivatedRoute,
    private route: Router,
    private modalService: NgbModal,
    private loader: NgxUiLoaderService,
    private doctorService : IndiviualDoctorService
  ) {
    this.documentManagementForm = this.fb.group({
      document: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.doctorId = loginData?._id;

    this.getDoctorDetails(this.mstepper);
  }

  //For Edit Doctord
  getDoctorDetails(fromParent: any) {
    let response = fromParent?.response;
    this.stepper = fromParent?.mainStepper
    // if (response?.data?.result[0]?.in_document_management != null) {
    //   this.docDetails =
    //     response?.data?.documentManagementList[0]?.document_details;

    //   this.docDetailsurldetails =
    //     response?.data?.result[0]?.in_document_management?.document_details;
    //   for (let data of this.docDetailsurldetails) {
    //     const imageId = data?._id
    //   }
    // }

    this.patchValues(this.docDetails);
  }

  patchValues(data: any) {
    if (data.length > 0) {
      data.forEach((element) => {
        this.addForm();
        this.setDocToView.push('');
      });
    } else {
      this.addForm();
    }
    // if(data === undefined){
    //   this.addForm();
    // }else{
    //   data.forEach((element)=>{
    //     this.addForm();
    //   })
    // }

    this.documentManagementForm.patchValue({
      document: data,
    });
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  savebuttonHandler(isNext: any = "") {
    this.isSubmitted = true;
    if (this.documentManagementForm.invalid) {
      return;
    }
    this.isSubmitted = false;
    this.loader.start();
    let newdoc = [];
    for (let i = 0; i < this.documentManagementForm.value.document.length; i++) {
      /* if (this.docDetails.length > 0) {
        const filteredPeople = this.docDetails.filter(element => element["image_url"] === this.documentManagementForm.value.document[i].image_url);
        if (filteredPeople.length > 0) {

        }
        else {
          newdoc.push(this.documentManagementForm.value.document[i])
        }
      }
 */
      newdoc.push(this.documentManagementForm.value.document[i])
    }

    let reqData = {
      document_details: newdoc.length > 0 ? newdoc : this.documentManagementForm.value.document,
      portal_user_id: this.doctorId,
    };

    this.doctorService.documentManage(reqData).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.loader.stop();
          this.toastr.success(response.message);
          // this.route.navigate(["/individual-doctor/editprofile"]);
          if (isNext === 'yes') {
            this.route.navigate(["/individual-doctor/editprofile"]);
          }
        }
      },
      (err) => {
        let errResponse = this._coreService.decryptObjectData({
          data: err.error,
        });
        this.loader.stop();
        this.toastr.error(errResponse.message);
      }
    );
  }

  documentValidation(index) {
    let document = this.documentManagementForm.get("document") as FormArray;
    const formGroup = document.controls[index] as FormGroup;
    return formGroup;
  }
  get document() {
    return this.documentManagementForm.controls["document"] as FormArray;
  }

  addForm() {
    const newDocument = this.fb.group({
      doc_name: [""],
      issue_date: [""],
      expiration_date: [""],
      image_url: [""],
      /*  _id: [""] */
    });
    this.document.push(newDocument);
  }

  deleteForm(index: number) {
    this.document.removeAt(index);
  }

  previousPage() {
    this.stepper.previous();
  }

  onFileSelected(event: any, index: number, type: any) {
    if (type === 'image') {
      var reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.onload = (event: any) => {
        this.setDocToView[index] = event.target.result;
      }
    }
    let file = event.target.files[0];
    this.attachmentType = file.type;
    const formData: FormData = new FormData();
    formData.append("portal_user_id", this.doctorId);
    formData.append("docType", "licence");
    formData.append("documents", file);

    this.doctorService.uploadFileForPortal(formData).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });

        this.document.at(index).patchValue({
          image_url: response.data[0],
        });
      },
      (err) => {
        let errResponse = this._coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.messgae);
      }
    );
  }

  openVerticallyCenteredquickview(quick_view: any, id: any, i: any) {
    let get_id = [];
    get_id = this.docDetails.filter(item => item.image_url === id);
    if (get_id.length > 0) {
      let imagelink = this.docDetailsurldetails.filter(item => item._id === get_id[0]._id);
      this.setDocToView[i] = imagelink[0].image_url;
      this.modalService.open(quick_view, {
        centered: true,
        size: "lg",
        windowClass: "quick_view",
      });
    } else {
      this.modalService.open(quick_view, {
        centered: true,
        size: "lg",
        windowClass: "quick_view",
      });
    }
    this.showUrl = this.setDocToView[i];
  }

  // downloadpdf(id:any,i:any) {
  //   let get_id = [];
  //   get_id = this.docDetails.filter(item => item.image_url === id);
  //     let imagelink = this.docDetailsurldetails.filter(item => item._id === get_id[0]._id);
  //     this.setDocToView[i] = imagelink[0].image_url;
  //   window.location.href =this.setDocToView[i];
  // }
}
