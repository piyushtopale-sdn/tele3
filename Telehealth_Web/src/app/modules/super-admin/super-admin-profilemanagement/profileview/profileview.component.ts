import { Component, ElementRef, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { CoreService } from 'src/app/shared/core.service';
import { SuperAdminService } from '../../super-admin.service';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import intlTelInput from "intl-tel-input";
import Validation from 'src/app/utility/validation';
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
  editAdminProfile:any = FormGroup;
  iti: any;
  isSubmitted: boolean = false;
  changePasswordForm: any = FormGroup;
  @ViewChild('editadminmprofile') editadminmprofile: TemplateRef<any>;

  @ViewChild("mobile") mobile: ElementRef<HTMLInputElement>;
  @ViewChild("countryPhone") countryPhone: ElementRef;
  selectedCountryCode:  any = '+966';
  countrycodedb: any = '';
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
  searchText:any='';
  
  constructor(private coreService: CoreService, private fb: FormBuilder, private modalService: NgbModal, private service: SuperAdminService,private toastr: ToastrService,private router: Router,
    private loader: NgxUiLoaderService,private dateAdapter: DateAdapter<Date>,
        private datepipe: DatePipe,) {
    const loginData = this.coreService.getLocalStorage("loginData");
    this.loginId = loginData?._id;
    this.userData = loginData
    this.userRole = loginData?.role;
  
    

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
      country_code:[""],
      password:["", Validators.compose([       
        Validation.patternValidator(/\d/, { hasNumber: true }),
        Validation.patternValidator(/[A-Z]/, { hasCapitalCase: true }),
        Validation.patternValidator(/[a-z]/, { hasSmallCase: true }),
        Validation.patternValidator(/[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, { hasSpecialCharacters: true }),
        Validators.minLength(8),
      ])],
      confirmPassword: [""]
    }, { validators: [Validation.match("password", "confirmPassword")] });
    
    
  }

  static match(password: string, confirmPassword: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const passwordControl = formGroup.get(password);
      const confirmPasswordControl = formGroup.get(confirmPassword);
  
      if (!passwordControl || !confirmPasswordControl) {
        return null;
      }
  
      const passwordValue = passwordControl.value;
      const confirmPasswordValue = confirmPasswordControl.value;
  
      // If both are empty → no error
      if (!passwordValue && !confirmPasswordValue) {
        confirmPasswordControl.setErrors(null);
        return null;
      }
  
      // If mismatch → set error
      if (passwordValue !== confirmPasswordValue) {
        confirmPasswordControl.setErrors({ matching: true });
        return { matching: true };
      } else {
        confirmPasswordControl.setErrors(null);
        return null;
      }
    };
  }
  

  ngOnInit(): void {
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

  closePopup() {
    this.modalService.dismissAll("close");
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
  
  get editAdmin() {
    return this.editAdminProfile.controls;
  }
  editAdminProfileSubmit() {
    if (this.editAdminProfile.invalid) {
      this.editAdminProfile.markAllAsTouched();
      return;
    }
  
    let reqData = {
      fullName: this.editAdminProfile.value?.fullName,
      email: this.editAdminProfile.value?.email,
      mobile: this.editAdminProfile.value?.mobile,
      adminId: this.editAdminProfile.value?.adminId,
      country_code: this.selectedCountryCode
    };
  
    if (this.editAdminProfile.value.password) {
      reqData['password'] = this.editAdminProfile.value.password;
    }
  
    this.service.updateAdminProfile(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.coreService.showSuccess("", response.message);
        this.closePopup();
        this.router.navigate([`/super-admin/profile/assign-menus-permissions/${response?.body?._id}`]);
      }
    });
  }
  



}
