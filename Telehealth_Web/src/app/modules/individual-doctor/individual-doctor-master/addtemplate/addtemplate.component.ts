import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { FormioOptions, FormioHookOptions } from "angular-formio";
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import { Router } from "@angular/router";
import { NgxUiLoaderService } from "ngx-ui-loader";

@Component({
  selector: "app-addtemplate",
  templateUrl: "./addtemplate.component.html",
  styleUrls: ["./addtemplate.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AddtemplateComponent implements OnInit {
  templateName: any = "";
  templateId: any = "";
  templateCategory: any = "";
  templateJSON: any = "";
  userId: any;
  page: any = 1;
  searchText: any = "";
  pageSize: number = 5;
  totalLength: number = 0;
  submitted: boolean = false;
  templateData: any;
  public form: any = {
    components: [],
  };
  formioOptions: FormioOptions = {
    disableAlerts: true,
  };

  constructor(
    private modalService: NgbModal,
    private _coreService: CoreService,
    private activatedRoute: ActivatedRoute,
    private doctorService: IndiviualDoctorService,
    private toastr: ToastrService,
    private routr: Router,
    private loader: NgxUiLoaderService
  ) {
    let userData = this._coreService.getLocalStorage("loginData");
    this.userId = userData._id;

    this.activatedRoute.queryParams.subscribe((params) => {
      this.templateId = params["id"];
    });
  }

  ngOnInit(): void {
    if (this.templateId == undefined) {
      this.templateId = "";
    }
    if (this.templateId != "" && this.templateId != undefined) {
      this.doctorService
        .editTemplateBuilder(this.templateId)
        .subscribe((res: any) => {
          let response = this._coreService.decryptObjectData({ data: res });
          if (response.status == true) {
            this.templateName = response.body.template_name;
            this.templateCategory = response.body.template_category;
            this.form = JSON.parse(response.body.template_json || "");
          } else {
            this.toastr.error(response.message);
          }
        });
    }
  }

  onChange(event) {
    var card = document.getElementsByClassName("formio-component-multiple");
    var boxes = document.getElementsByClassName("formio-component-selectboxes");
    var radio = document.getElementsByClassName("formio-component-radio2");

    if (card != null && (boxes.length > 0 || radio.length > 0)) {
      card[0]?.setAttribute("style", "display:none!important;");
    } else {
      card[0]?.setAttribute("style", "display:block!important;");
    }
    // this.jsonElement.nativeElement.innerHTML = '';
    // this.jsonElement.nativeElement.appendChild(document.createTextNode(JSON.stringify(event.form, null, 4)));
  }

  submitTemplate() {
    this.templateJSON = JSON.stringify(this.form);
    if(this.form.components.length <2){
      this._coreService.showError('Please Select fields to add','')
      return;
    }
    if (this.templateName == "" || this.templateCategory == "") {
      this.submitted = true;
      return;
    }
    this.loader.start();
    let data = {
      templateId: this.templateId,
      templateName: this.templateName,
      templateCategory: this.templateCategory,
      templateJSON: this.templateJSON,
      doctorId: this.userId,
    };

    this.doctorService.addtemplateBuilder(data).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this._coreService.setCategoryForService(1);
        this.routr.navigate(['/individual-doctor/templatebuilder'])
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });

  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };
  // Text field component modal
  openVerticallyCenteredtextfieldcomponent(textfieldcomponent: any) {
    this.modalService.open(textfieldcomponent, {
      centered: true,
      size: "lg",
      windowClass: "textfield_component",
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
}
