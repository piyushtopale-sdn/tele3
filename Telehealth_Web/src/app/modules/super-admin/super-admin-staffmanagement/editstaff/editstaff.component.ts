
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CoreService } from 'src/app/shared/core.service';
import { SuperAdminService } from '../../super-admin.service';
import { MatPaginator } from '@angular/material/paginator';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import * as moment from "moment";
import Validation from 'src/app/utility/validation';
import intlTelInput from "intl-tel-input";


@Component({
  selector: 'app-editstaff',
  templateUrl: './editstaff.component.html',
  styleUrls: ['./editstaff.component.scss']
})


export class EditstaffComponent implements OnInit {
  groupID: any;
  groupData: any;
  staffForm: any = FormGroup;
  isSubmitted: any;
  groupIcon: any;
  adminId: any;
  searchText: any = "";
  pharmacyList: any[] = [];
  relatedStaff: any[] = [];
  selectedStaff: any[] = [];
  association_group_selected_pharmacy: any; //coma seperated
  iti: any;
  selectedCountryCode: any;
  staffID: any ;
  selectedFiles: any = '';
  staffRole: any;
  countryPhone:any;



  @ViewChild("phone") phone: ElementRef<HTMLInputElement>;

  constructor(
    private service: SuperAdminService,
    private _coreService: CoreService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private router: Router,
    private sadminService: SuperAdminService,
    private activatedRoute: ActivatedRoute
  ) {
    this.staffForm = this.fb.group({
      staff_profile: [""],
      email: ["",
        [
          Validators.required,
          Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$"),
        ],
      ],
      language: ["", [Validators.required]],
      phone: ["",
        [Validators.required, Validators.pattern("^((\\+91-?)|0)?[0-9]{10}$")],
      ],
      address: [""],
      neighborhood: ["", [Validators.required]],
      country: ["", [Validators.required]],
      region: ["", [Validators.required]],
      province: ["", [Validators.required]],
      department: ["", [Validators.required]],
      city: ["", [Validators.required]],
      village: ["", [Validators.required]],
      pincode: [""],
      password: [
        null,
        Validators.compose([
          // check whether the entered password has a number
          Validation.patternValidator(/\d/, {
            hasNumber: true,
          }),
          // check whether the entered password has upper case letter
          Validation.patternValidator(/[A-Z]/, {
            hasCapitalCase: true,
          }),
          // check whether the entered password has a lower case letter
          Validation.patternValidator(/[a-z]/, {
            hasSmallCase: true,
          }),
          // check whether the entered password has a special character
          Validation.patternValidator(
            /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
            {
              hasSpecialCharacters: true,
            }
          ),
          Validators.minLength(8),
        ]),
      ],
      role: ["",],
      userName: [""],
      aboutStaff: [""],


    });
  }


  ngOnInit(): void {
    let id = this.activatedRoute.snapshot.paramMap.get("id");
    this.groupID = id;
    let loginUser = this._coreService.getLocalStorage("loginData");
    this.adminId = loginUser._id;
    this.viewStaffGroup();
    this.getCountryList();
  }

  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  };
  
  // ngAfterViewInit() {
  //     const input = this.countryPhone?.nativeElement;
    
  //     // const input = document.querySelector("#phone");
  //     this.iti = intlTelInput(input, {
  //       initialCountry: "BF",
  //       separateDialCode: true
  //     });
  //     this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
  //   }

    ngAfterViewInit() {
      // const input = this.phone.nativeElement;
      const input = this.countryPhone?.nativeElement;

      this.iti = intlTelInput(input, {
        initialCountry: "BF",
        separateDialCode: true,
      });
      this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
    }
  



  viewStaffGroup() {
    this.service.getStaffDetails(this.staffID).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      this.groupData = response.data[0];
      this.relatedStaff = response.data[1]?.pharmacy_details;

      let expiryDate = moment(this.groupData?.license_expiry).format("MM/DD/YYYY")
      let address = response.data[0].location_id;
      this.getRegionList(address?.country._id);
      this.getProvienceList(address?.region._id);
      this.getDepartmentList(address?.province._id);
      this.getCityList(address?.department._id);

      this.staffForm.patchValue({
        group_name: this.groupData?.superadmin_id?.fullName,
        mobile_phone: this.groupData?.superadmin_id?.mobile,
        ...this.groupData,
        ...this.groupData?.staff_id,
        country: address?.country._id,
        region: address?.region._id,
        province: address?.province._id,
        department: address?.department._id,
        city: address?.city._id,
        village: address?.village._id,
        pincode: address?.pincode,
      });


      this.selectedCountryCode = response.data[0].superadmin_id?.country_code;

      for (let staff of this.relatedStaff) {
        this.selectedStaff.push(staff?._id);
      }
    });
  }

  updateStaffGroup() {
    if (this.selectedStaff.length < 1) {
      this.toastr.error("Please select staff");
      return;
    }
    let formData: any = new FormData();
    let data = this.staffForm.value;


  
    formData.append("staff_profile", data.staff_profile);
    formData.append("email", data.email);
    formData.append("language", data.language);
    formData.append("phone", data.phone);
    formData.append("address", data.address);
    formData.append("neighborhood", data.neighborhood);
    formData.append("country", data.country);
    formData.append("region", data.region);
    formData.append("province", data.province);
    formData.append("department", data.department);
    formData.append("city", data.city);
    formData.append("village", data.village);
    formData.append("pincode", data.pincode);
    formData.append("id", this.groupID);
    // formData.append("userId", this.adminId);

    this.service.editStaff(formData).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData(res);
        if (response.status) {
          this.toastr.success("updated");
          this.closePopup();
          this.router.navigate(["super-admin/staffmanagement"]);
        } else {
          this.toastr.error("failed");
        }
      },
      (err) => {
        let response = this._coreService.decryptObjectData({ data: err.error });
        this.toastr.error(response.message);
      }
    );
  }

  onGroupIconChange(event: any) {
    if (event.target.files && event.target.files[0]) {
      let file = event.target.files[0];
      this.staffForm.patchValue({
        association_group_icon: file,
      });
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.groupIcon = event.target.result;
      };

      reader.readAsDataURL(event.target.files[0]);
    }
  }

  onFileChnage(event: any) {
    if (event.target.files.length > 0) {
      let file = event.target.files[0];
      this.staffForm.patchValue({
        license_card_id_proof: file,
      });
    }
  }

  get f() {
    return this.staffForm.controls;
  }

  handleSearchFilter(event: any) {
    this.searchText = event.target.value.trim();
  }

  get addStaffFormControl(): { [key: string]: AbstractControl } {
    return this.staffForm.controls;
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.selectedStaff.splice(0);
  this.association_group_selected_pharmacy = null;

    for (let pharmacy of this.relatedStaff) {
      this.selectedStaff.push(pharmacy?._id);
    }
  }

  openVerticallyCenteredaddpharmacy(editpharmacycontent: any) {
    // this.isSubmitted = true;
    // if (this.staffForm.invalid) {
    //   return;
function intlTelInput(input: any, arg1: { initialCountry: string; separateDialCode: boolean; }): any {
  throw new Error('Function not implemented.');

}

    // }
    // this.isSubmitted = false;

    this.modalService.open(editpharmacycontent, {
      centered: true,
      windowClass: "edit_pharmacy",
 
});
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  public selectFile(file: any) {
    this.selectedFiles = file.target.files[0]
  }

  public handleClose() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.staffID = '';
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
  //-----Calling address API's---------------
  countryList: any[] = [];
  regionList: any[] = [];
  provienceList: any[] = [];
  departmentList: any[] = [];
  cityList: any[] = [];
  villageList: any[] = [];

  getCountryList() {
    this.sadminService.getcountrylist().subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        this.countryList = result.body?.list;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getRegionList(countryID: any) {
    this.sadminService.getRegionListByCountryId(countryID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        this.regionList = result.body?.list;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getProvienceList(regionID: any) {
    this.sadminService.getProvinceListByRegionId(regionID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        this.provienceList = result.body?.list;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getDepartmentList(provinceID: any) {
    this.sadminService.getDepartmentListByProvinceId(provinceID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        this.departmentList = result.body?.list;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getCityList(departmentID: any) {
    this.sadminService.getCityListByDepartmentId(departmentID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        this.cityList = result.body.list;
      },
      error: (err) => {
        console.log(err);
      },
    });

    this.sadminService.getVillageListByDepartmentId(departmentID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        this.villageList = result.body.list;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

}

