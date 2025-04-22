import { PharmacyService } from 'src/app/modules/pharmacy/pharmacy.service';
import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { CoreService } from 'src/app/shared/core.service';
import { IEncryptedResponse } from 'src/app/shared/classes/api-response';
import { PharmacyStaffResponse } from '../addstaff/addstaff.component.type';
import { FormBuilder, FormGroup,Validators ,AbstractControl} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import intlTelInput from 'intl-tel-input';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { DateAdapter } from '@angular/material/core';
import { IndiviualDoctorService } from 'src/app/modules/individual-doctor/indiviual-doctor.service';
export interface PeriodicElement {
  staffname: string;
  role: string;
  phone: string;
  datejoined: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  // { staffname: '', role: '', phone: '', datejoined: '' },
];

@Component({
  selector: 'app-viewstaff',
  templateUrl: './viewstaff.component.html',
  styleUrls: ['./viewstaff.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class ViewstaffComponent implements OnInit {

  displayedColumns: string[] = ['staffname', 'role', 'phone', 'datejoined', 'active', 'lockuser', 'action'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('countryPhone') countryPhone: ElementRef<HTMLInputElement>;

  dataSource = ELEMENT_DATA;
  userID: string = ''
  pageSize: number = 5
  totalLength: number = 0;
  page: any = 1;
  staffID: string = ''
  action: string = '';
  actionObject: object = null;
  staffRole: any[]= [];
  isSubmitted: boolean = false;
  selectedFiles: any = '';
  staff_name: any = '';
  role: string = 'all';
  editStaff: any;
  iti: any;
  selectedCountryCode: string;
  groupID: any;
  profileIcon: any = '/assets/img/create_profile.png'
  staffProfileUrl: any;
  teamInitial: any = ""
  filterForm: any = FormGroup
  searchText: any = '';
  countrycodedb: any;
  loc: any = {};
  selectedLanguages:any =[];

  sortColumn: string = 'staff_name';
  sortOrder: 1 | -1 = 1;
  sortIconClass: string = 'arrow_upward';
  userRole: any;
  userPermission: any;
  innerMenuPremission: any = [];
  locationData : any = {};
  maxDate = new Date();
  staff_profile_file: FormData;
  staff_profile: any = '';
  currentUrl : any =[]
  constructor(
    private modalService: NgbModal,
    private _pharmacyService: PharmacyService,
    private _coreService: CoreService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private _superAdminService: SuperAdminService,
    private loader: NgxUiLoaderService,
    private dateAdapter: DateAdapter<Date>,
    private services: IndiviualDoctorService,
  ) {
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    this.filterForm = this.fb.group({
      searchtext: [""],
      role: [""]
    })
    this.editStaff = this.fb.group({
      staff_profile: [""],
      staff_name: [""],
      first_name: ["", [Validators.required]],
      middle_name: [""],
      last_name: ["", [Validators.required]],
      first_name_arabic: ["", [Validators.required]],
      middle_name_arabic: [""],
      last_name_arabic: ["", [Validators.required]],
      dob: ["", [Validators.required]],
      language: [""],
      address: ["", [Validators.required]],
      neighbourhood: [""],
      country: [""],
      region: [""],
      province: [""],
      department: [""],
      city: [""],
      village: [""],
      pincode: [""],
      degree: [""],
      phone: ["", [Validators.required, Validators.pattern(/^\d{2}-\d{3}-\d{4}$/)]],
      email: ["", [Validators.required]],
      role: ["", [Validators.required]],
      about: [""],
      staff_createdby: [""],
      doj:[new Date()]
    })

    const userData = this._coreService.getLocalStorage('loginData')
    this.userPermission = this._coreService.getLocalStorage("loginData").permissions;

    this.userID = userData._id
    this.userRole = userData?.role
    this.getAllRole()
    // this.getAllStaff()
  }
  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1? -1 : 1;
    this.sortIconClass = this.sortOrder === 1? 'arrow_upward' : 'arrow_downward';
    this.getAllStaff(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    let id = this.activatedRoute.snapshot.paramMap.get("id");
    this.staffID = id;
    this.getAllStaff(`${this.sortColumn}:${this.sortOrder}`)
    this.getSpokenLanguage();
    this.handleSearchFilter()
    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl)

      // setTimeout(() => {
      //   this.checkInnerPermission();
      // }, 300);  
  }

  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission(){ 
    let menuID = sessionStorage.getItem("currentPageMenuID");
    let checkData = this.findObjectByKey(this.userPermission, "parent_id",menuID)
    if(checkData){
      if(checkData.isChildKey == true){
        var checkSubmenu = checkData.submenu;     
        if (checkSubmenu.hasOwnProperty("health_plan")) {
          this.innerMenuPremission = checkSubmenu['health_plan'].inner_menu;  
        } else {
        }
      }else{
        var checkSubmenu = checkData.submenu;
        let innerMenu = [];
        for (let key in checkSubmenu) {
          innerMenu.push({name: checkSubmenu[key].name, slug: key, status: true});
        }
        this.innerMenuPremission = innerMenu;
        
      }    
    }     
  }

  giveInnerPermission(value){   
    if(this.userRole === "PHARMACY_STAFF"){
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    }else{
      return true;

    }    
  }






  /*
code for country code starts
*/
  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  }
  autoComplete: google.maps.places.Autocomplete;
  getCountrycodeintlTelInput() {
    var country_code = '';
    const countryData = (window as any).intlTelInputGlobals.getCountryData();
    for (let i = 0; i < countryData.length; i++) {
      if (countryData[i].dialCode === this.countrycodedb.split("+")[1]) {
        country_code = countryData[i].iso2;
        break; // Break the loop when the country code is found
      }
    }
    const input = document.getElementById('mobile') as HTMLInputElement;
    const adressinput = document.getElementById('address') as HTMLInputElement;
    this.iti = intlTelInput(input, {
      initialCountry: country_code,
      separateDialCode: true,
    });
    this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
    const options = {
      fields: [
        "address_components",
        "geometry.location",
        "icon",
        "name",
        "formatted_address",
      ],
      strictBounds: false,
    };
    this.autoComplete = new google.maps.places.Autocomplete(
      adressinput,
      options
    );
    this.autoComplete.addListener("place_changed", (record) => {
      const place = this.autoComplete.getPlace();
      const getAddress = this.getAddressComponents(place.address_components)

      this.loc.type = "Point";
      this.loc.coordinates = [
        place.geometry.location.lng(),
        place.geometry.location.lat(),
      ];
      this.editStaff.patchValue({
        address: place.formatted_address,
        loc: this.loc,
        country: getAddress.country,
        city: getAddress.city,
        village: getAddress.village,
        region: getAddress.region,
        province: getAddress.province,
        department: getAddress.department,
        pincode: getAddress.pincode,
      });
    })
  }

  getAddressComponents(addressComponents) {
    let result = {
      region: null,
      province: null,
      country: null,
      city: null,
      village: null,
      department: null,
      pincode: null
    };

    for (const component of addressComponents) {
      if (component.types.includes('administrative_area_level_1')) {
        result.region = component.long_name;
      }
      if (component.types.includes('administrative_area_level_2')) {
        result.province = component.long_name;
      }
      if (component.types.includes('country')) {
        result.country = component.long_name;
      }
      if (component.types.includes('locality')) {
        result.city = component.long_name;
      }
      if (component.types.includes('sublocality') || component.types.includes('neighborhood') || component.types.includes('political')) {
        result.village = component.long_name;
      }
      if (component.types.includes('administrative_area_level_3')) {
        result.department = component.long_name;
      }
      if (component.types.includes('postal_code')) {
        result.pincode = component.long_name;
      }
    }

    return result;
  }

  get addStaffFormControl(): { [key: string]: AbstractControl } {
    return this.editStaff.controls;
  }

  /*
    code for country code ends
    */

  public selectFile(file: any) {
    this.selectedFiles = file.target.files[0]
  }

  public handleClose() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.editStaff.reset()
    this.staffID = '';
    this.staff_profile = ''
  }

  private getAllRole() {
    let param = {
      userId: this.userID,
      page: 1,
      limit: 0,
      searchText: "",
    };
    this._pharmacyService.allRoles(param).subscribe((res) => {
      let result = this._coreService.decryptObjectData({ data: res });
      if (result?.status) {
        const staffRole = result?.body?.data
        staffRole.map((role)=>{
         this.staffRole.push(
          {
            label : role.name,
            value : role._id
          }
         )
        })
      }
    })
  }

  //  New Invitation modal
  openVerticallyCenterededitstaff(editstaffcontent: any, id: any) {
    this.staffID = id
    this.modalService.open(editstaffcontent, { centered: true, size: 'xl', windowClass: "edit_staffnew" });
    this.getSpecificStaffDetails(id);
  }

  getSpecificStaffDetails(id) {
    // throw new Error('Method not implemented.');
    try {
      let userId = id
      this._pharmacyService.getStaffDetails(id).subscribe((result: any) => {
        // this.countryCode()
        const staffDetails = this._coreService.decryptObjectData(result);
        this.selectedLanguages = staffDetails.data.staffInfo[0].language;
        let details = staffDetails.data.staffInfo[0];
        const documentInfo = staffDetails?.data?.documentURL;
        this.staff_profile = documentInfo
        let address = details.in_location;
        this.locationData = {...address}
        let dateString = this.convertDate(details.dob);
        this.editStaff.controls["first_name"].setValue(details.first_name);
        this.editStaff.controls["middle_name"].setValue(details.middle_name);
        this.editStaff.controls["last_name"].setValue(details.last_name);
        this.editStaff.controls["first_name_arabic"].setValue(details.first_name_arabic);
        this.editStaff.controls["middle_name_arabic"].setValue(details.middle_name_arabic);
        this.editStaff.controls["last_name_arabic"].setValue(details.last_name_arabic);
        this.editStaff.controls["dob"].setValue(dateString);
        this.editStaff.controls["language"].setValue(details.language);
        this.editStaff.controls["address"].setValue(details.in_location.address);
        this.editStaff.controls["neighbourhood"].setValue(details.in_location.neighborhood);
        this.editStaff.controls["country"].setValue(address?.country);
        this.editStaff.controls["region"].setValue(address?.region);
        this.editStaff.controls["province"].setValue(address?.province);
        this.editStaff.controls["department"].setValue(address?.department);
        this.editStaff.controls["city"].setValue(address?.city);
        this.editStaff.controls["village"].setValue(address?.village);
        this.editStaff.controls["pincode"].setValue(details.in_location.pincode);
        this.editStaff.controls["degree"].setValue(details.degree);
        this.editStaff.controls["phone"].setValue(staffDetails.data.profileData[0].phone_number);
        this.editStaff.controls["email"].setValue(staffDetails.data.profileData[0].email);
        this.editStaff.controls["role"].setValue(details.role._id);
        this.editStaff.controls["about"].setValue(details.about);
        this.editStaff.controls["doj"].setValue(details?.doj);
        this.countrycodedb = staffDetails?.data?.profileData[0]?.country_code;
        this.getCountrycodeintlTelInput();
      })
    } catch (e) {
      throw e
    }
  }

  convertDate(date) {
    let dateString: any = new Date(date);
    let dd = String(dateString.getDate()).padStart(2, "0");
    let mm = String(dateString.getMonth() + 1).padStart(2, "0");
    let yyyy = dateString.getFullYear();
    dateString = yyyy + "-" + mm + "-" + dd;

    return dateString
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllStaff()
  }

  public submitAction() {
    this.loader.start();
    this._pharmacyService.deleteActiveAndLockStaff(this.actionObject).subscribe({
      next: (result: IEncryptedResponse<PharmacyStaffResponse>) => {
        const decryptedData = this._coreService.decryptObjectData(result)
        this.loader.stop();
        this.handleClose()
        this.getAllStaff()
        this._coreService.showSuccess("", `Successfully ${this.action} Pharmacy staff`);
        
      },
      error: (err: ErrorEvent) => {
        this.loader.stop();
      },
    });
  }


  private getAllStaff(sort:any='') {
    this.isSubmitted = true
    const params = {
      admin_id: this.userID,
      page: this.page,
      limit: this.pageSize,
      role_id: this.filterForm.value.role ? this.filterForm.value.role : "",
      searchKey: this.filterForm.value.searchtext ? this.filterForm.value.searchtext : "",
      sort:sort
    }
    this._pharmacyService.getAllStaff(params).subscribe({
      next: (result: IEncryptedResponse<PharmacyStaffResponse>) => {
        const decryptedData = this._coreService.decryptObjectData(result)
        const data = []

        if (result) {
          for (const staff of decryptedData.data.data) {
            data.push({
              staffname: staff.staff_name,
              role: staff.role !== undefined ? staff.role.name : '',
              // phone: staff.for_portal_user.mobile, 
              phone: staff.for_portal_user.phone_number,

              datejoined: staff.doj,
              id: staff.for_portal_user._id,
              is_locked: staff.for_portal_user.lock_user,
              is_active: staff.for_portal_user.isActive,
              _id: staff.for_portal_user._id,
            })
          }
        }
        this.totalLength = decryptedData.data.totalCount
        this.dataSource = data;
      },
      error: (err: ErrorEvent) => {

        this._coreService.showError("", "Staff Load Failed");

      },
    });
  }

  addStaff() {
    // [RouterLink]="['/pharmacy/staffmanagement/add']"
    // this.router
    if (this.staffRole.length < 1) {
      // this._coreService.showError("please add Role first", '')
      if(this.userRole == "PHARMACY_ADMIN"){
        this._coreService.showError("please add Role first", '');
      }else{
        this._coreService.showError("Please ask admin to add Role first", '');
      }
    } else {

      this.router.navigate(['/pharmacy/staffmanagement/add']);
    }

  }

  handleSearchFilter() {
    this.filterForm.valueChanges.subscribe((ele) => {
      this.getAllStaff()
    })


    // this.staff_name = event.target.value
    // if (event.target.value) {
    //   this.getAllStaff()
    // }
  }

  handleFilter() {
    this.getAllStaff()
  }

  clearAll() {
    this.filterForm.reset()
    this.getAllStaff()
  }

  onGroupIconChange(event: any) {
    let file = event.target.files[0];
    const formData: FormData = new FormData();
    formData.append("userId", this.userID);
    formData.append("docType", "profile");
    formData.append("file", file);
    formData.append("serviceType", 'pharmacy');

      this.staff_profile_file = formData;
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.staff_profile = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
  }

  keyURL: any = "";
  uploadDocument() {
    if (this.staff_profile_file !== null) {
      this.loader.start();
    this._pharmacyService.uploadDocument(this.staff_profile_file).subscribe({
      next: async (res: any) => {
        let result = await this._coreService.decryptObjectData({ data: res });
        if(result.status){
          this.loader.stop();
          this.keyURL = result.data[0];
          this.onSubmit();

        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  } else {
    this.loader.stop();
    this.onSubmit();
  }
  }

  public onSubmit() {
    this.isSubmitted = true;
    if (this.editStaff.invalid) {
      const firstInvalidField = document.querySelector(
        'input.ng-invalid, input.ng-invalid');
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      this._coreService.showError("","Please fill all required fields." )
      const invalid = [];
      const controls = this.editStaff.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          invalid.push(name);
        }
      }
      return;      
    }
    this.loader.start();
    const values = this.editStaff.value
    // const formaData = new FormData();
    // formaData.append("staff_profile", values.staff_profile)
    // formaData.append("staff_name", values.first_name + " " + values.middle_name + " " + values.last_name)
    // formaData.append("first_name", values.first_name)
    // formaData.append("middle_name", values.middle_name)
    // formaData.append("last_name", values.last_name)
    // formaData.append("first_name_arabic", values.first_name_arabic);
    // formaData.append("middle_name_arabic", values.middle_name_arabic);
    // formaData.append("last_name_arabic", values.last_name_arabic);
    // formaData.append("dob", values.dob)
    // formaData.append("language", JSON.stringify(this.selectedLanguages));
    // formaData.append("address", values.address)
    // formaData.append("neighbourhood", values.neighbourhood)
    // formaData.append("country", values.country ? values.country : "")
    // formaData.append("region", values.region ? values.region : '')
    // formaData.append("province", values.province ? values.province : '')
    // formaData.append("department", values.department ? values.department : '')
    // formaData.append("city", values.city ? values.city : '')
    // formaData.append("village", values.village ? values.village : '')
    // formaData.append("pincode", values.pincode)
    // formaData.append("degree", values.degree)
    // formaData.append("phone", values.phone)
    // formaData.append("email", values.email.toLowerCase())
    // formaData.append("role", values.role)
    // formaData.append("about", values.about)
    // formaData.append("staff", values.staff)
    // formaData.append("id", this.staffID),
    // formaData.append("userId", this.userID);
    // formaData.append("country_code", this.selectedCountryCode);
    // formaData.append("doj", values?.doj)

    let reqData = {
      staff_profile: this.keyURL, 
      id: this.staffID, 
      staff_name: values.first_name+" "+values.middle_name+" "+values.last_name,
      first_name: values.first_name,
      middle_name: values.middle_name,
      last_name: values.last_name,
      first_name_arabic: values.first_name_arabic,
      middle_name_arabic: values.middle_name_arabic,
      last_name_arabic: values.last_name_arabic,
      dob: values.dob,
      language: JSON.stringify(this.selectedLanguages),
      address: values.address,
      neighborhood: values.neighborhood,
      country: values.country,
      region: values.region,
      province: values.province,
      department: values.department,
      city: values.city,
      village: values.village,
      pincode: values.pincode,
      degree: values.degree,
      phone_number: values.phone_number,
      email: values.email?.toLowerCase(),
      role: values.role,
      password: values.password,
      confirmPassword: values.confirmPassword,
      about: values.about,
      userId: this.userID,
      country_code: this.selectedCountryCode,
      doj: values.doj,     
      }

    this._pharmacyService.editStaff(reqData).subscribe({
      next: (result: IEncryptedResponse<PharmacyStaffResponse>) => {
        let decryptedResult = this._coreService.decryptObjectData(result);
        this._coreService.showSuccess("", "Staff updated successfully");
        this.handleClose()
        this.getAllStaff()
        this.loader.stop();
      },
      error: (err: ErrorEvent) => {
        this.loader.stop();

        this._coreService.showError("", err.message);
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
    });
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

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  //...............delete.............
  closePopup() {
    this.modalService.dismissAll("close");
  }

  handleDeleteGroup(actionValue: boolean, action: any) {
    this.loader.start();

    let reqData = {
      action: action,
      actionValue: actionValue,
      id: this.groupID,
    };

    this._pharmacyService.deleteActiveAndLockStaff(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData(res);
      if (response.status) {
        this.toastr.success(response.message);
        this.loader.stop();
        this.getAllStaff();
        this.closePopup();
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  handleToggeleChange(event: any, groupID: any) {
    this.groupID = groupID;
    this.handleDeleteGroup(event.checked, "lock");
  }

  handleCheckBoxChange(event: any, groupID: any) {
    this.groupID = groupID;
    this.handleDeleteGroup(event.checked, "active");
  }

  public openActionPopup(actionPopup: any, id: any, action: string, event: any = null) {
    let status: string;
    if (action === 'delete') {
      this.actionObject = {
        action_name: action,
        action_value: true,
        staff_id: id
      }
    } else {
      let child = event.target.firstChild
      let checked: boolean
      if (action === 'active' || action === 'inactive') {
        status = !child.checked ? 'active' : 'inactive'
        checked = !child.checked
      } else if (action === 'lock' || action === 'unlock') {
        if (child) {
          status = !child.checked ? 'lock' : 'unlock'
          checked = !child.checked
        } else {
          status = !event.target.parentElement.parentElement.children[0].checked ? 'lock' : 'unlock'
          checked = !event.target.parentElement.parentElement.children[0].checked
        }
      }
      this.actionObject = {
        action_name: action === 'active' || action === 'inactive' ? 'active' : action,
        action_value: checked,
        staff_id: id
      }
    }
    this.staffID = id
    this.action = status ? status : action
    this.modalService.open(actionPopup, { centered: true, size: 'lg' });
  }

  spokenLanguages: any[] = []
  overlay:false;

  getSpokenLanguage() {
    this._superAdminService.spokenLanguage().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      // this.spokenLanguages = response.body?.spokenLanguage;
      const arr = response.body?.spokenLanguage;
      arr.map((curentval: any) => {
        this.spokenLanguages.push({
          label: curentval?.label,
          value: curentval?.value,
        });
      });  
      this.editStaff.patchValue({
        language: this.selectedLanguages
     });
    });
  }


  removeSelectpic() {
    this.staff_profile = "";
  }

  onSelectionChange(event: any): void {
    this.selectedLanguages = this.editStaff.value.language;
  }

  handleDOCChange() {
    new Date(this.editStaff.controls['doj'].value)
}

onMobileInput1(event: Event): void {
  const input = (event.target as HTMLInputElement).value.replace(/\D/g, ''); // Remove all non-digit characters
  let formattedNumber = '';

  if (input.length <= 2) {
    formattedNumber = input;
  } else if (input.length <= 5) {
    formattedNumber = `${input.slice(0, 2)}-${input.slice(2)}`;
  } else {
    formattedNumber = `${input.slice(0, 2)}-${input.slice(2, 5)}-${input.slice(5, 9)}`;
  }

  this.editStaff.get('phone')?.setValue(formattedNumber, { emitEvent: false });
}
onNavigate(url:any): void {
  const menuitems = JSON.parse(localStorage.getItem('activeMenu'))
   this.currentUrl = url
 
  const matchedMenu = menuitems.find(menu => menu.route_path === this.currentUrl);
  this.router.navigate([url]).then(() => {
    
    this.services.setActiveMenu(matchedMenu?.name);
  });
 
}

}