import { Component, ElementRef, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { CoreService } from 'src/app/shared/core.service';
import { SuperAdminService } from '../../super-admin.service';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import intlTelInput from "intl-tel-input";
import Validation from 'src/app/utility/validation';
import { MatCheckboxChange } from "@angular/material/checkbox";
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { DateAdapter } from "@angular/material/core";
import { DatePipe } from "@angular/common";
@Component({
  selector: 'app-profileview',
  templateUrl: './profileview.component.html',
  styleUrls: ['./profileview.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProfileviewComponent implements OnInit {
  userData: any;
  userRole: any;
  staffID: any;
  staffData: any;
  editStaff: any = FormGroup;
  editAdminProfile:any = FormGroup;
  iti: any;
  isSubmitted: boolean = false;
  changePasswordForm: any = FormGroup;
  @ViewChild('editstaffcontent') editstaffcontent: TemplateRef<any>;
  @ViewChild('editadminmprofile') editadminmprofile: TemplateRef<any>;

  autoComplete: google.maps.places.Autocomplete;
  @ViewChild("mobile") mobile: ElementRef<HTMLInputElement>;
  @ViewChild("countryPhone") countryPhone: ElementRef;
  selectedCountryCode:  any = '+966';
  countrycodedb: any = '';
  loc: any = {};
  selectedLanguages: any = [];
  staffProfileUrl: any;
  staffRole: any;
  groupID: any;
  groupData: any;
  searchText: any = "";
  pharmacyList: any[] = [];
  relatedPharmacies: any[] = [];
  selectedPharmacy: any[] = [];
  association_group_selected_pharmacy: any; //coma seperated
  groupIcon: any = "";
  locationData : any = {};
  chargesForm : any = FormGroup;
  adminProfile: any = FormGroup
  hide1 = true;
  hide2 = true;
  settings = [
    { label: 'Consultation Charges', value: 'ConsultationCharges' },
    { label: 'Lab Test Charges', value: 'LabTestCharges' },
    { label: 'Radiology Test Charges', value: 'RadiologyTestCharges' },
  ];
  dateRangeForm: FormGroup;
  fromDate: string = "";
  toDate: string = "";
  page: any = 1;
  pageSize: number = 10;
  totalLength: number = 0;
  sortColumn: string = 'fullName';
  sortOrder: -1 | 1 = -1;
  sortIconClass: string = 'arrow_upward';
  displayedColumns: string[] = [
    // "createdAt",
    "fullName",
    "email",
    "mobile",
    "status",
    "action",
  ];
  dataSource: any = [];
  loginId: any;
  adminUserId: any;
  unitMap: any = {};
  constructor(private coreService: CoreService, private fb: FormBuilder, private modalService: NgbModal, private service: SuperAdminService,private toastr: ToastrService,private router: Router,
    private loader: NgxUiLoaderService,private dateAdapter: DateAdapter<Date>,
        private datepipe: DatePipe,) {
    const loginData = this.coreService.getLocalStorage("loginData");
    const adminData = this.coreService.getLocalStorage("adminData");
    this.loginId = loginData?._id;
    this.userData = loginData
    this.userRole = loginData?.role;
    if(this.userRole == 'STAFF_USER'){      
      this.staffID = adminData?._id
    }else{
      this.groupID = adminData?._id
    }
    

    this.changePasswordForm = this.fb.group(
      {
        old_password: ["", [Validators.required]],
        new_password: [
          null,
          Validators.compose([
            Validators.required,
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
        confirm_password: ["", [Validators.required]],
      },
      { validators: [Validation.match("new_password", "confirm_password")] }
    );



    this.editStaff = this.fb.group({
      staff_profile: [""],
      staff_name: [""],
      first_name: ["", [Validators.required]],
      middle_name: [""],
      last_name: ["", [Validators.required]],
      dob: ["", [Validators.required]],
      language: ["", [Validators.required]],
      address: ["", [Validators.required]],
      neighbourhood: [""],
      country: ["", [Validators.required]],
      region: [""],
      province: [""],
      department: [""],
      city: [""],
      village: [""],
      pincode: [""],
      // degree: [""],
      mobile: ["", [Validators.required]],
      email: ["", [Validators.required]],
      // role: [""],
      // userName: [""],
      about_staff: [""],
    });

    this.chargesForm = this.fb.group({
      consultationCharges: [],
      labTestCharges: [],
      radiologyTestCharges: [],
      vatCharges: [],
      callButton: [null, [Validators.max(720)]],
      enableCallButton: [true],
    });


    this.adminProfile = this.fb.group({
      fullName: ["", [Validators.required]],
      email: ["", [Validators.required]],
      mobile: ["", [Validators.required, Validators.pattern(/^\d{2}-\d{3}-\d{4}$/)]],
      password:["",  Validators.compose([
        Validators.required,
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
      ]),],
      confirmPassword: ["", [Validators.required]]}, { validators: [Validation.match("password", "confirmPassword")] });


    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });

    this.editAdminProfile = this.fb.group({
      fullName: ["", [Validators.required]],
      email: ["", [Validators.required]],
      mobile: ["", [Validators.required, Validators.pattern(/^\d{2}-\d{3}-\d{4}$/)]],
      adminId:[""],
      country_code:[""]
    });
  }

  ngOnInit(): void {
    this.getSpokenLanguage();   
    this.listOfAllAdminList(`${this.sortColumn}:${this.sortOrder}`);
    this.get_generalSettingData();
  }

  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.listOfAllAdminList(`${column}:${this.sortOrder}`);
  }
  ngAfterViewInit() {
    this.getCountryCode();
    this.getCountrycodeintlTelInput();
  }
  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  };
  getCountryCode() {
    let country_code = '';
    const countryData = (window as any).intlTelInputGlobals.getCountryData();
    for (let i = 0; i < countryData.length; i++) {
      if (countryData[i].dialCode === this.selectedCountryCode.split("+")[1]) {
        country_code = countryData[i].iso2;

        break; // Break the loop when the country code is found
      }
    }
    const input = this.mobile?.nativeElement;
    if (input !== undefined) {

      this.iti = intlTelInput(input, {
        initialCountry: country_code,
        separateDialCode: true,
      });
      this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
    }
  }
  getCountrycodeintlTelInput() {    
    let country_code = 'sa';
    const countryData = (window as any).intlTelInputGlobals.getCountryData();
    for (let i = 0; i < countryData.length; i++) {
      
      if (countryData[i].dialCode === this.countrycodedb.split("+")[1]) {
        
        country_code = countryData[i].iso2;
        break; 
      }
    }
    const input = document.getElementById('countryPhone') as HTMLInputElement;
    if (!input) return;
    this.iti = intlTelInput(input, {
      initialCountry: country_code,
      separateDialCode: true,
    });
    this.countrycodedb = "+" + this.iti.getSelectedCountryData().dialCode;
    
  }

  getStaffDetails() {
    if (this.staffID === null || this.staffID === undefined) {
      return;
    }
    this.service.getStaffDetails(this.staffID).subscribe((res) => {
      let response = this.coreService.decryptObjectData(res);
      this.staffData = response?.data?.data[0];
      // this.relatedStaff = response.data[1]?.pharmacy_details;

      this.staffProfileUrl = response?.data?.documentURL;

      // let expiryDate = moment(this.groupData?.license_expiry).format("MM/DD/YYYY")
      let address = response?.data?.data[0]?.location_id
      this.locationData = address
      
  
      let details = response?.data?.data[0];
      this.selectedLanguages = details.language;
       

      let dateString: any = new Date(details?.dob);
      let dd = String(dateString.getDate()).padStart(2, "0");
      let mm = String(dateString.getMonth() + 1).padStart(2, "0");
      let yyyy = dateString.getFullYear();
      dateString = yyyy + "-" + mm + "-" + dd;
      this.editStaff.controls["staff_name"].setValue(
        details?.superadmin_id?.first_name + " " + details?.superadmin_id?.middle_name + " " + details?.superadmin_id?.last_name
      );
      this.editStaff.controls["first_name"].setValue(
        details?.superadmin_id?.first_name
      );
      this.editStaff.controls["middle_name"].setValue(
        details?.superadmin_id?.middle_name
      );
      this.editStaff.controls["last_name"].setValue(
        details?.superadmin_id?.last_name
      );
      this.editStaff.controls["dob"].setValue(dateString);
      this.editStaff.controls["language"].setValue(details.language);
      this.editStaff.controls["address"].setValue(
        details?.location_id?.address
      );
      this.editStaff.controls["neighbourhood"].setValue(
        details?.location_id?.neighborhood
      );
      this.editStaff.controls["country"].setValue(address?.country?._id);
      this.editStaff.controls["region"].setValue(address?.region?._id);
      this.editStaff.controls["province"].setValue(address?.province?._id);
      this.editStaff.controls["department"].setValue(address?.department?._id);
      this.editStaff.controls["city"].setValue(address?.city?._id);
      this.editStaff.controls["village"].setValue(address?.village?._id);
      this.editStaff.controls["pincode"].setValue(
        details.location_id.pincode
      );
      // this.editStaff.controls["degree"].setValue(
      //   details.superadmin_id.degree
      // );
      this.editStaff.controls["mobile"].setValue(
        details.superadmin_id?.mobile
      );
      this.editStaff.controls["email"].setValue(details.superadmin_id.email);
      // this.editStaff.controls["role"].setValue(details?.staff_role?._id);
      // this.editStaff.controls["userName"].setValue(
      //   details.superadmin_id.user_name
      // );
      this.editStaff.controls["about_staff"].setValue(details?.about_staff);
      this.countrycodedb = details.superadmin_id.country_code;
      // this.getCountrycodeintlTelInput();
    });
  }

  openVerticallyCenterededitstaff(editstaffcontent: any) {


    this.getStaffDetails();
    this.modalService.open(editstaffcontent, {
      centered: true,
      size: "xl",
      windowClass: "edit_staffnew",
    });
  }

  handleClose() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    // this.staffID = "";
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
  get addStaffFormControl(): { [key: string]: AbstractControl } {
    return this.editStaff.controls;
  }


  updateStaff() {
    this.isSubmitted = true;
    if (this.editStaff.invalid) {
      this.coreService.showError("", "Please Fill All Fields!")
      return null;
    }

    let formaData: any = new FormData();
    let data = this.editStaff.value;
    formaData.append("staff_profile", data.staff_profile);
    formaData.append("staff_name", data.first_name + " " + data.middle_name + " " + data.last_name);
    formaData.append("first_name", data.first_name);
    formaData.append("middle_name", data.middle_name);
    formaData.append("last_name", data.last_name);
    formaData.append("dob", data.dob);
    formaData.append("language", JSON.stringify(this.selectedLanguages));
    formaData.append("address", data.address);
    formaData.append("neighborhood", data.neighbourhood);
    formaData.append("country", data.country);
    formaData.append("region", data.region ? data.region : "");
    formaData.append("province", data.province ? data.province : "");
    formaData.append("department", data.department ? data.department : "");
    formaData.append("city", data.city ? data.city : "");
    formaData.append("village", data.village ? data.village : "");
    formaData.append("pincode", data.pincode);
    formaData.append("mobile", data.mobile);
    formaData.append("email", data.email);
    formaData.append("about_staff", data?.about_staff);
    formaData.append("id", this.staffID);
    formaData.append("country_code", this.selectedCountryCode);
    formaData.append("userId", this.staffID);
    for (let [key, value] of formaData) {
    }

    this.service.editStaff(formaData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData(res);
        if (response.status) {
          this.coreService.showSuccess("", response.message);
          this.handleClose();
          this.getStaffDetails();

        } else {
          this.coreService.showError("", response.message);
        }
      },
      (err) => {
        let response = this.coreService.decryptObjectData({ data: err.error });
        this.coreService.showError("", response.message);

      }
    );
  }
  onGroupIconChange(event: any) {
    if (event.target.files && event.target.files[0]) {
      let file = event.target.files[0];

      this.editStaff.patchValue({
        staff_profile: file,
      });
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.staffProfileUrl = event.target.result;
      };

      reader.readAsDataURL(event.target.files[0]);
    }
  }

  handleRemoveLogo() {
    this.staffProfileUrl = ''
  }
  onSelectionChange(event: any): void {
    this.selectedLanguages = this.editStaff.value.language;

  }

  roleList() {
    if (this.staffID === null || this.staffID === undefined) {
      return;
    }
    let reqData = {
      page: 1,
      limit: 0,
      searchText: "",
      userId: this.staffID,
    };
    this.service.allRoleSuperAdmin(reqData).subscribe(
      (res: any) => {
        let encryptedData = { data: res };
        let response = this.coreService.decryptObjectData(encryptedData);
        this.staffRole = response?.body?.data

      })

  }

  spokenLanguages: any[] = [];

  getSpokenLanguage() {
    this.service.spokenLanguage().subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      this.spokenLanguages = response.body?.spokenLanguage;
    });
  }

  handleChangePassword() {
    this.isSubmitted = true;
    if (this.changePasswordForm.invalid) {
      return;
    }
    this.isSubmitted = false;

    let reqData = {
      id: this.userData?._id,
      old_password: this.changePasswordForm.value.old_password,
      new_password: this.changePasswordForm.value.new_password,
    };

    this.service.changePassword(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.coreService.showSuccess("", response.message)
        this.changePasswordForm.reset();
      } else {
        this.coreService.showError("", response.message)
      }
    }, err => {
      let errResponse = this.coreService.decryptObjectData({ data: err.error });
      this.coreService.showError("", errResponse.message)
    })
  }

  get f() {
    return this.changePasswordForm.controls;
  }

  /***************************************association_group_profile***********************************************/


  viewAssociationGroup() {
    if(this.groupID == undefined){
      return;
    }
    this.service.viewAssociationGroup(this.groupID).subscribe((res) => {
      let response = this.coreService.decryptObjectData(res);
      this.groupData = response.data[0];
      this.groupIcon = response?.data[0]?.association_group_icon?.url;
      this.relatedPharmacies = response.data[1]?.pharmacy_details;
      for (let pharmacy of this.relatedPharmacies) {
        this.selectedPharmacy.push(pharmacy.portal_user_id);
      }
      this.association_group_selected_pharmacy = this.selectedPharmacy.join(',')
    });
  }

  listAllPharmacy() {
    this.service.listPharmacy(this.searchText).subscribe((res) => {
      let response = this.coreService.decryptObjectData(res);

      this.pharmacyList = response?.body;

    });
  }

  handleUpdatePharmacy() {
    this.isSubmitted = true;
    if (this.association_group_selected_pharmacy?.length < 1) {
      this.toastr.error("Select Any Pharmacy");
      return;
    }
    this.isSubmitted = false;
    this.loader.start();
    let reqData = {
      association_group_data: this.association_group_selected_pharmacy,
      id: this.groupID,
    };

    // return;

    this.service.editPharmacyForAssociationGroup(reqData).subscribe(
      (res) => {

        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.loader.stop();
          this.toastr.success(response.message);
          this.closePopup()
          this.viewAssociationGroup()
        }
      },
      (err) => {
        let errorResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.loader.stop();
        this.toastr.error(errorResponse.message);
      }
    );
  }

  handleSearchFilter(event: any) {
    this.searchText = event.target.value;
    this.listAllPharmacy();
  }

  closePopup() {
    this.modalService.dismissAll("close");
  }

  //  Order Medicine modal
  openVerticallyCenterededitpharmacy(editpharmacycontent: any) {
    this.modalService.open(editpharmacycontent, {
      centered: true,
      windowClass: "add_pharmacy",
    });
  }

 //-------------Pharmacy selection handling-------------
  toggle(item, event: MatCheckboxChange) {

    if (event.checked) {
      this.selectedPharmacy.push(item?.for_portal_user);
    } else {
      const index = this.selectedPharmacy.indexOf(item?.for_portal_user);
      if (index >= 0) {
        this.selectedPharmacy.splice(index, 1);
      }
    }
    this.association_group_selected_pharmacy = this.selectedPharmacy.join(",");
  }

  exists(id) {
    return this.selectedPharmacy.indexOf(id) > -1;
  }

  isIndeterminate() {
    return this.selectedPharmacy.length > 0 && !this.isChecked();
  }

  isChecked() {

    return this.selectedPharmacy.length === this.pharmacyList.length;
  }

  toggleAll(event: MatCheckboxChange) {
    if (event.checked) {
      this.pharmacyList.forEach((pharmacy) => {
        this.selectedPharmacy.push(pharmacy?.portal_user_id);
      });
    } else {
      this.selectedPharmacy.length = 0;
    }
  }


  openVerticallyCenterededit(data: any) {    
    this.modalService.open(this.editadminmprofile, {
      centered: true,
      size: "md",
      windowClass: "editprofile",
    });
    this.countrycodedb = data?.country_code
    this.editAdminProfile.patchValue({
      fullName: data?.fullName,
      email: data?.email, 
      mobile: data?.mobile,
      adminId:data?._id,
      country_code : this.countrycodedb
    })
    setTimeout(() => {
      this.getCountrycodeintlTelInput();
    }, 200);
  }

  routeToEdit(){
    this.router.navigate([`/super-admin/profile/edit-association/${this.groupID}`])
  }

  onSave() {
    const formValues = this.chargesForm.value;
    const reqData = [
      {
        settingName: "ConsultationCharges",
        settingValue: formValues.consultationCharges,
      },
      {
        settingName: "LabTestCharges",
        settingValue: formValues.labTestCharges,
      },
      {
        settingName: "RadiologyTestCharges",
        settingValue: formValues.radiologyTestCharges,
      },
      {
        settingName: "VatCharges",
        settingValue: formValues.vatCharges,
      },
      {
        settingName: "callButtonEnable",
        settingValue: formValues.callButton,
      },
      {
        enableCallButton: formValues?.enableCallButton?.enableCallButton ? formValues?.enableCallButton?.enableCallButton : formValues.enableCallButton
      }
    ];
    this.service.updateGeneralSetting(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });      
      if(response.status){
        this.get_generalSettingData();
       this.coreService.showSuccess("", response.message);     
      }else{
        this.coreService.showError("", response.message);    
      }
    });
  }

  get_generalSettingData() {
    let reqData = {
      role: "ALL"
    };
    this.service.getGeneralSetting(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        let apiResponse = response?.body;
  
        // Set units
        this.unitMap = {
          consultationCharges: apiResponse.find(item => item.settingName === "ConsultationCharges")?.unit || 'SAR',
          labTestCharges: apiResponse.find(item => item.settingName === "LabTestCharges")?.unit || 'SAR',
          radiologyTestCharges: apiResponse.find(item => item.settingName === "RadiologyTestCharges")?.unit || 'SAR',
          vatCharges: apiResponse.find(item => item.settingName === "VatCharges")?.unit || '%',
          callButton: apiResponse.find(item => item.settingName === "callButtonEnable")?.unit || 'min'
        };
  
        this.chargesForm.patchValue({
          consultationCharges: apiResponse.find(item => item.settingName === "ConsultationCharges")?.settingValue || 0,
          labTestCharges: apiResponse.find(item => item.settingName === "LabTestCharges")?.settingValue || 0,
          radiologyTestCharges: apiResponse.find(item => item.settingName === "RadiologyTestCharges")?.settingValue || 0,
          vatCharges: apiResponse.find(item => item.settingName === "VatCharges")?.settingValue || 0,
          callButton: apiResponse.find(item => item.settingName === "callButtonEnable")?.settingValue || 0,
          enableCallButton:apiResponse.find(item => item?.enableCallButton) || false,
        });
      }
    });
  }

  /* admin-creation */
  onMobileInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value.replace(/\D/g, ''); 
    let formattedNumber = '';
  
    if (input.length <= 2) {
      formattedNumber = input;
    } else if (input.length <= 5) {
      formattedNumber = `${input.slice(0, 2)}-${input.slice(2)}`;
    } else {
      formattedNumber = `${input.slice(0, 2)}-${input.slice(2, 5)}-${input.slice(5, 9)}`;
    }
  
    this.adminProfile.get('mobile')?.setValue(formattedNumber, { emitEvent: false });
    this.editAdminProfile.get('mobile')?.setValue(formattedNumber, { emitEvent: false });
  }
  get apc() {
    return this.adminProfile.controls;
  }
  onCreateProfile(){
    this.isSubmitted = true;
    if(this.adminProfile.invalid){
      this.coreService.showError("Please fill all the required fields!","Form Error")
      return;
    }
    this.isSubmitted = false;
    let reqData ={
      fullName: this.adminProfile.value.fullName,
      email: this.adminProfile.value.email.toLowerCase(),
      mobile: this.adminProfile.value.mobile,
      password: this.adminProfile.value.password,  
      country_code: this.selectedCountryCode,
    }
    this.loader.start();
    this.service.adminProfileCreate(reqData).subscribe((res) => {
      this.loader.stop();    
      let response = this.coreService.decryptObjectData({ data: res });  
      let userId = response?.body?._id;
      sessionStorage.setItem("admin-userId", userId);
      if(response.status){
       this.coreService.showSuccess("", response.message);
       this.router.navigate([`/super-admin/profile/assign-menus-permissions/${userId}`])
      }
    });
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.listOfAllAdminList();
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

    this.listOfAllAdminList();

  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'yyyy-MM-dd') || '';
  }

  listOfAllAdminList(sort:any='') {
    let reqData ={
      page: this.page,
      limit: this.pageSize,
      searchText: this.searchText,
      sort:sort,
      fromDate:this.fromDate,
      toDate:this.toDate,
      userId:this.loginId
    }
    this.service.getAllAdmminProfileList(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });   
      if(response.status){
        this.dataSource = response?.body?.result;
        this.totalLength = response?.body?.totalRecords;
      }
    });
  }
  handleSearchCategory(event: any) {
    this.searchText = event.target.value.trim();
    this.listOfAllAdminList();
  }
  handletoggleChange(event: any,id:any, data: any) {  
    
    let reqData = {};
    if(data=== 'lock'){
      reqData = {
        userId: id,
        action_name: data,
        action_value: event.checked,
      };
    }else{
      reqData = {
        userId: id,
        action_name: data,
        action_value: true,
      };
    }    
    this.loader.start();
    this.service.deleteLockAdminUser(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.loader.stop();
        this.closePopup();
        this.listOfAllAdminList();
        this.toastr.success(response.message);
      } else {
        this.loader.stop();
        this.closePopup();
        this.toastr.error(response.message);
      }
    });
  }
  
  openVerticallyCenteredDelete(
    deletemodal: any, id: any
  ) {
    this.adminUserId = id;
    this.modalService.open(deletemodal, {
      centered: true,
      size: "md",
      windowClass: "edit_speciality_service",
    });
  }

  limitInput(event: any): void {
    const input = event.target;
    if (input.value > 720) {
      input.value = 720;
      // If using Reactive Forms:
      this.chargesForm.get('callButton')?.setValue(720);
    }
  }
  preventSpecialCharacters(event: KeyboardEvent): void {
    const invalidChars = ['e', 'E', '+', '-', '.'];
  
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
    }
  }
  
  editAdminProfileSubmit(){
  let reqData ={
    fullName: this.editAdminProfile.value?.fullName,
    email: this.editAdminProfile.value?.email, 
    mobile: this.editAdminProfile.value?.mobile,
    adminId:this.editAdminProfile.value?.adminId,
    country_code : this.selectedCountryCode
  }
   this.service.updateAdminProfile(reqData).subscribe((res) => {
    let response = this.coreService.decryptObjectData({ data: res });   
    if(response.status){
    this.coreService.showSuccess("",response.message);
    this.closePopup();
    this.router.navigate([`/super-admin/profile/assign-menus-permissions/${response?.body?._id}`]);
    }
  });
  }



}
