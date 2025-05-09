import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SuperAdminService } from '../../super-admin.service';
import { CoreService } from 'src/app/shared/core.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { DateAdapter } from '@angular/material/core';
import Validation from 'src/app/utility/validation';
import intlTelInput from "intl-tel-input";

@Component({
  selector: 'app-add-edit-patient',
  templateUrl: './add-edit-patient.component.html',
  styleUrls: ['./add-edit-patient.component.scss']
})
export class AddEditPatientComponent {
  isSubmitted: boolean = false;
  pageForAdd: any = true;

  @ViewChild("mobile") mobile: ElementRef<HTMLInputElement>;
  @ViewChild("emergencyContact") emergencyContact: ElementRef<HTMLInputElement>;
  @ViewChild("address") address!: ElementRef;
  patientForm: any = FormGroup;
  selectedcountrycodedb: any = '+966';
  selectedcountrycodedb1: any = '+966';
  maxDate = new Date();
  iti: any;
  selectedCountryCode: any = "+966";
  autoComplete: google.maps.places.Autocomplete;
  loc: any = {};
  hide1 = true;
  hide2 = true;
  profileImage: any = "";
  profileImageFile: FormData = null;
  superadminId: any;
  patientId: string ='';
  itiEmergencyContact: any;
  selectedEmergencyContactCountryCode: any = "+966";
  profileData: any;
  viewMrn_no: any;
  selectedNationality: any;
  nationalityList:any[] = [];
  overlay = false;
  passportFieldVisible: boolean = false;

  constructor(
    private sadminService: SuperAdminService,
    private coreService: CoreService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private loader: NgxUiLoaderService,
    private dateAdapter: DateAdapter<Date>,
    private router : Router,
  ) {
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy
    this.patientForm = this.fb.group(
      {
        profileImage: [""],
        first_name: ["", [Validators.required,this.coreService.nameValidator()]],
        first_name_arabic: ["", [Validators.required,this.coreService.nameValidator()]],
        last_name: ["", [Validators.required,this.coreService.nameValidator()]],
        last_name_arabic: ["", [Validators.required,this.coreService.nameValidator()]],
        address: [""],
        loc: [""],
        nationality: ["",[Validators.required]],    
        mobile: [{ value: '', disabled: false }, [Validators.required]],
        dob: ["", [Validators.required]],
        email: [
          "",
          [          
            Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$"),
          ],
        ],
        gender: ["", [Validators.required]],
        blood_group :[""],
        marital_status: [""],
        mrn_number: [""],
        // iqama_number: [""],
        passport: [""],
        saudi_id: ["", [Validators.required, Validators.pattern(/^\d{10}$/)]],
        // selected_type:[""],
        emergency_contact:[""]

      }
    );


  }

  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.superadminId = loginData?._id;

    let paramId = this.activatedRoute.snapshot.paramMap.get("id");
    
    this.patientId = paramId;
    
    if (this.patientId !== null) {
     this.getProfileDetails(this.patientId);     
     this.patientForm.get('mobile')?.disable();
     this.patientForm.controls["nationality"].setValue(this.profileData?.personalDetails?.nationality);
    } else {
      this.patientForm.get('mobile')?.enable();
    }
   
    this.getPatientNationalities();
    
    
  }

getProfileDetails(id){
  let reqData = {
    patient_id : id
  }
  this.sadminService.getPatientDetailsById(reqData).subscribe(
    (res) => {
      let response = this.coreService.decryptObjectData({ data: res });      
      if (response.status) {
        this.profileData =  response?.body;
        let item = response?.body?.personalDetails;

        if(item?.nationality === 'Saudi Arabian'){
          this.patientForm.patchValue({
          saudi_id : item.saudi_id,
          })
        }else{
          this.patientForm.patchValue({
            saudi_id : item.iqama_number,
            })
        }
        
       this.patientForm.patchValue({
        first_name: item?.first_name,
        first_name_arabic: item?.first_name_arabic,
        last_name: item?.last_name,
        last_name_arabic: item?.last_name_arabic,
        address: this.profileData?.locationDetails?.address,
        mobile:  this.profileData?.portalUserDetails?.mobile,
        dob: item?.dob,
        email: this.profileData?.portalUserDetails?.email,
        gender: item?.gender,
        blood_group: item?.blood_group,
        marital_status: item?.marital_status,
        mrn_number: item?.mrn_number,     
        passport: item.passport,
        emergency_contact: item?.emergency_contact?.phone_number,
        profileImage:item?.profile_pic
       })

       
       setTimeout(() => {
       this.patientForm.patchValue({
        nationality: item?.nationality
       })
      }, 1000)

       this.profileImage = this.profileData?.personalDetails?.profile_pic_signed_url,
       this.viewMrn_no = this.profileData?.personalDetails?.mrn_number
       this.selectedcountrycodedb = this.profileData?.portalUserDetails?.country_code;   
       if(this.profileData?.personalDetails?.emergency_contact?.country_code !== undefined){

         this.selectedcountrycodedb1 = this.profileData?.personalDetails?.emergency_contact?.country_code;
       } else{
         this.selectedcountrycodedb1 = this.selectedcountrycodedb1;
       }  
       

       this.getCountryCode();
       this.getEmergencyContactCountryCode();
      } 
    },
    (err) => {
      let errResponse = this.coreService.decryptObjectData({
        data: err.error,
      });
    
   
    }
  );
}


ngAfterViewInit() {
  if (this.patientId === null || this.patientId === undefined || this.patientId === "") {


  this.getCountryCode();
  this.getEmergencyContactCountryCode();
  }
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
    this.address.nativeElement,
    options
  );

  this.autoComplete.addListener("place_changed", (record) => {
    const place = this.autoComplete.getPlace();
    this.loc.type = "Point";
    this.loc.coordinates = [
      place.geometry.location.lng(),
      place.geometry.location.lat(),
    ];
    this.patientForm.patchValue({
      address: place.formatted_address,      
      loc: this.loc,
    });

  });
}



  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;    
  };

  getCountryCode() {
    let country_code = '';
    const countryData = (window as any).intlTelInputGlobals.getCountryData();
    for (let i = 0; i < countryData.length; i++) {
      if (countryData[i].dialCode === this.selectedcountrycodedb.split("+")[1]) {
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
 
  onFocusEmergencyContact = () => {
    const countryCode = this.itiEmergencyContact.getSelectedCountryData().dialCode;    
    this.selectedEmergencyContactCountryCode = "+" + countryCode;
  };
  
  getEmergencyContactCountryCode() {
    let country_code = '';
    const countryData = (window as any).intlTelInputGlobals.getCountryData();
    for (let i = 0; i < countryData.length; i++) {
      if (countryData[i].dialCode === this.selectedcountrycodedb1.split("+")[1]) {
        country_code = countryData[i].iso2;
        break; // Stop when country code is found
      }
    }
    const input = this.emergencyContact.nativeElement;
    this.itiEmergencyContact = intlTelInput(input, {
      initialCountry: country_code,
      separateDialCode: true,
    });
    
    this.selectedEmergencyContactCountryCode = "+" + this.itiEmergencyContact.getSelectedCountryData().dialCode;    
  }


  onFileSelected(event, type: "profile") {
    let file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", "");
    formData.append("docType", type);
    formData.append("serviceType", "patient");

    // Allowed image types
    const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validImageTypes.includes(file.type)) {
      this.coreService.showError("", "Invalid file type. Please select an image file only.");
      event.target.value = "";
      return;
    }

    if (type === "profile") {
      this.profileImageFile = formData;
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.profileImage = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  private uploadDocument(doc: FormData) {
    return new Promise((resolve, reject) => {
      this.sadminService.uploadFileForPortal(doc).subscribe({
        next: (result) => {
          let response = this.coreService.decryptObjectData({ data: result });
          resolve(response);
          reject(response);
        },
        error: (err: ErrorEvent) => {
          this.coreService.showError("", err.message);
          if (err.message === "INTERNAL_SERVER_ERROR") {
            this.coreService.showError("", err.message);
          }
        },
      });
    });
  }
  get f() {
    return this.patientForm.controls;
  }
  removeSelectpic(index: any) {

    if (index === 'profileImage') {
      this.profileImage = ""
    } 
  }

  onSelectionChange(event: any): void {
    const selectedNationality = event?.value;
  
    if (!selectedNationality) {
      // Nothing is selected, hide the passport field
      this.passportFieldVisible = false;
    } else if (selectedNationality === 'Saudi Arabian') {
      // Saudi Arabian selected, hide the passport field
      this.passportFieldVisible = false;
      this.patientForm.get('passport')?.clearValidators();
      this.patientForm.get('passport')?.updateValueAndValidity();
      this.patientForm.get('saudi_id')?.setValidators([Validators.required]);
      this.patientForm.get('saudi_id')?.updateValueAndValidity();
    } else {
      // Other nationalities selected, show the passport field
      this.passportFieldVisible = true;
      this.patientForm.get('passport')?.setValidators([Validators.required]);
      this.patientForm.get('passport')?.updateValueAndValidity();
    }
  }
  

  async onSubmit(type: any = '') {
    this.isSubmitted = true;
  
    // Remove all validations in edit case
    if (type === 'edit') {
      this.patientForm.get('mobile')?.clearValidators();
    } 
    this.patientForm.get('mobile')?.updateValueAndValidity();
  
    if (this.patientForm.invalid) {
      const firstInvalidField = document.querySelector('input.ng-invalid, input.ng-invalid');
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      this.coreService.showError("", "Please fill all required fields.");
      return;
    }
  
    this.isSubmitted = false;
  
    // Upload profile image logic
    if (this.profileImageFile) {
      await this.uploadDocument(this.profileImageFile).then((res: any) => {        
        if (res.status) {
          this.patientForm.patchValue({
            profileImage: res.data[0],
          });
          this.coreService.showSuccess("", res.message);
        }
      });
    }
  
    const data = this.patientForm.value;
    const formattedDate = type === 'edit' ? data?.dob : data?.dob.toISOString();
    let saudi_id = ''; let iqama_number = '';
    if(data?.nationality === 'Saudi Arabian'){
      saudi_id = data?.saudi_id
    }else{
      iqama_number = data?.saudi_id;
    }
  
    const reqData: any = {
      profile_pic: data?.profileImage,
      first_name: data?.first_name,
      first_name_arabic: data?.first_name_arabic,
      last_name: data?.last_name,
      last_name_arabic: data?.last_name_arabic,
      address: data?.address,
      loc: data?.loc,
      nationality: data?.nationality,
      mobile: data?.mobile,
      country_code: this.selectedCountryCode,
      dob: formattedDate,
      email: data?.email?.toLowerCase(),
      gender: data?.gender,
      blood_group: data?.blood_group,
      marital_status: data?.marital_status,
      mrn_number: data?.mrn_number,
      iqama_number: iqama_number,
      passport: data?.passport,
      saudi_id: saudi_id,
      emergency_contact: {
        phone_number: data?.emergency_contact,
        country_code: this.selectedEmergencyContactCountryCode,
      },
    };

    if (type === 'edit') {
      reqData['patient_id'] = this.patientId;
      
      this.loader.start();
  
      this.sadminService.updatePatient_profileApi(reqData).subscribe(
        (res) => {
          const response = this.coreService.decryptObjectData({ data: res });
          this.loader.stop();
          if (response.status) {
            this.coreService.showSuccess("", response.message);
            this.router.navigate([`/super-admin/patient`]);

          } else {
            this.coreService.showError("", response.message);
          }
        },
        (err) => {
          this.loader.stop();
          const errResponse = this.coreService.decryptObjectData({ data: err.error });
          this.coreService.showError("", errResponse.message);
        }
      );
    } else {
      this.loader.start();
      this.sadminService.createPatient_profileApi(reqData).subscribe(
        (res) => {
          const response = this.coreService.decryptObjectData({ data: res });
          this.loader.stop();
          if (response.status) {
            this.coreService.showSuccess("", response.message);
            this.router.navigate([`/super-admin/patient`]);
          } else {
            this.coreService.showError("", response.message);
          }
        },
        (err) => {
          this.loader.stop();
          const errResponse = this.coreService.decryptObjectData({ data: err.error });
          this.coreService.showError("", errResponse.message);
        }
      );
    }
  }
  
  getPatientNationalities() {
    this.sadminService.getPatientNationality().subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          const data = response?.body?.Countries;
          
          this.nationalityList = data.map((data) => ({
            label: data?.nationality, 
            value: data?.nationality        
          }));
        
        } else {
          this.coreService.showError("", response.message);
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({ data: err.error });
        this.coreService.showError("", errResponse.message);
      }
    );
  }
  formatDate(event: any) {
    let input = event.target.value;
    input = input.replace(/\D/g, "");
  
    if (input.length > 2) {
      input = input.substring(0, 2) + "/" + input.substring(2);
    }
    if (input.length > 5) {
      input = input.substring(0, 5) + "/" + input.substring(5);
    }
    if (input.length > 10) {
      input = input.substring(0, 10);
    }
    event.target.value = input;
  }
  

  
}
