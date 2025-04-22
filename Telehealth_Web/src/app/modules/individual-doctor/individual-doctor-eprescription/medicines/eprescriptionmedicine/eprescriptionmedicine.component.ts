import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "../../../indiviual-doctor.service";
import { Observable, map, startWith } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { IndividualDoctorMyprofileComponent } from '../../../individual-doctor-myprofile/individual-doctor-myprofile.component';
@Component({
  selector: "app-eprescriptionmedicine",
  templateUrl: "./eprescriptionmedicine.component.html",
  styleUrls: ["./eprescriptionmedicine.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class EprescriptionmedicineComponent implements OnInit {
  isClicked = false;
  dosageForm: any = FormGroup;
  medicineList: any = [];
  selectedMedicine: any;
  isSubmitted: boolean = false;
  dosageModal: any;
  isEditMed: boolean = false
  appointmentId: any = "";
  doctorId: any = "";
  searchControl = new FormControl('');
  @ViewChild("rabeprazolecontent") rabeprazolecontent: ElementRef;
  filteredOptions!: Observable<any[]>;
  myControl = new FormControl("");
  selectedmedicineinfo: any;
  searchmedicine: any = "";
  profile: any;
  patientSubscriberphoto: any;
  patientId: any;
  medicineId: any;
  medicineName: any;
  finalArray: any = [];
  medicineTradeName: any;
  showAddButtton:boolean = false;
  openedWindow:Window = null

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private sadminService: SuperAdminService,
    private indiviualDoctorService: IndiviualDoctorService,
    private coreService: CoreService,
    private activatedRoute: ActivatedRoute,
    private route: Router

  ) {
    ;
    this.activatedRoute.queryParams.subscribe(params => {
      const id = params['appointmentId'];
      this.appointmentId = id;
      this.showAddButtton = params['showAddButtton'];
    });

    this.dosageForm = this.fb.group({
      dosages: this.fb.array([]),
    });

  }

  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.doctorId = loginData?._id;
    this.getAppointmentDetails();

  }


  async getAppointmentDetails() {
    this.indiviualDoctorService
      .viewAppointmentDetails(this.appointmentId)
      .subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.profile = response?.data?.patientDetails;
          this.patientId = response?.data?.patientDetails?.patient_id;
          this.patientSubscriberphoto = response?.data?.insuraceSubscriberphoto;
        }
      });
  }
  handleMedicineChange(event) {
    this.searchmedicine = this.myControl.value;
    this.getMedicineList();
  }


  closePopup() {
    this.modalService.dismissAll("close");
    // this.dosageForm.patchValue({
    //   dosages:([
    //     this.fb.group({
    //       dose: "", 
    //       doseUnit: "", 
    //       routeOfAdministration: "", 
    //       frequency: this.fb.group({
    //         morning: [0],  
    //         midday: [0],   
    //         evening: [0],  
    //         night: [0],    
    //       }),
    //       takeFor: this.fb.group({
    //         quantity: [0],
    //         type: ["DAYS"], 
    //       }),
    //       quantity: [0], 
    //       medicineId: "",
    //       medicineName: ""
    //     })
    //   ])
    // });
  }

  saveMedicineAdded() {

    if (this.dosageForm.invalid) {
      this.dosageForm.markAllAsTouched();
      this.coreService.showError("", "Please fill all required fields.");
      return;
    }

    this.dosageForm.value.dosages.forEach((element) => {
      let finalObject = {
        dose: element?.dose,
        doseUnit: element?.doseUnit,
        routeOfAdministration: element?.routeOfAdministration,
        frequency: {
          morning: element?.frequency?.morning,
          midday: element?.frequency?.midday,
          evening: element?.frequency?.evening,
          night: element?.frequency?.night,
        },
        takeFor: {
          quantity: element?.takeFor?.quantity,
          type: element?.takeFor?.type,
        },
        quantity: element?.quantity,
        medicineId: this.medicineId,
        medicineName: this.medicineName,
        tradeName: this.medicineTradeName
      };

      // Push the new object into the array
      this.finalArray.push(finalObject);
    });

    this.closePopup();

    // Reset the form after saving
    this.dosageForm.reset();
    this.dosages.clear(); // Clear the FormArray
  }





  async createEprescription() {
    if (this.finalArray.length === 0) {
      this.coreService.showError('Please select medicine.', "");
      return;
    }

    let reqData = {
      appointmentId: this.appointmentId,
      doctorId: this.doctorId,
      patientId: this.patientId,
      medicationInformation: this.finalArray,
    };

    this.indiviualDoctorService.createEprescription(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.coreService.showSuccess("", response.message);
        this.route.navigate([`/individual-doctor/eprescription/validatemedicineprescription/${this.appointmentId}`],{
          queryParams:{
            showAddButtton:this.showAddButtton
          }
        })
      } else {
        this.coreService.showError("", response.message);
      }
    });
  }



  openCommentPopup(medicinecontent: any, medicineId: any) {
    let reqData = {
      id: medicineId,
    };
    this.sadminService.getIdByMedicine_api(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.selectedmedicineinfo = response?.body;
      }
      this.modalService.open(medicinecontent, {
        centered: true,
        size: "xl",
        windowClass: "info_window",
      });
    });

  }

  getMedicineList() {
    let param = {
      limit: 0,
      searchText: this.searchmedicine
    };
    this.indiviualDoctorService.getmedicineListWithParam(param).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.medicineList = response.body.result;
        this.filteredOptions = this.myControl.valueChanges.pipe(
          startWith(""),
          map((value) => this._filter(value || ""))
        );
      }
    });
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    if (this.medicineList.length > 0) {
      var result = this.medicineList.filter((option: any) => {
        return option.scientificName;
      });
      return result != "" ? result : ["No data"];
    }
    return ["No data"];
  }

  async changeMedicine(event: any) {
    this.medicineId = event._id;
    this.medicineName = event.scientificName;
    this.medicineTradeName = event.tradeName;
    this.selectedMedicine = event;
    const medicineExists = this.finalArray.some(
      medicine => medicine.medicineId === this.medicineId
    );

    if (medicineExists) {
      this.coreService.showWarning('This medicine has already been added.', "");
      this.closePopup();
      return;
    }
    this.openVerticallyCenteredrabeprazole(this.rabeprazolecontent);
  }


  handleAdd(addFor: any, index) {
    if (addFor === "morning") {
      this.dosages
        .at(index)
        .patchValue({
          frequency: {
            morning: this.dosages.at(index).value.frequency.morning + 1
          }
        });
    }

    if (addFor === "midday") {
      this.dosages
        .at(index)
        .patchValue({
          frequency: {
            midday: this.dosages.at(index).value.frequency.midday + 1
          }
        });
    }
    if (addFor === "evening") {
      this.dosages
        .at(index)
        .patchValue({
          frequency: {
            evening: this.dosages.at(index).value.frequency.evening + 1
          }
        });
    }

    if (addFor === "night") {
      this.dosages
        .at(index)
        .patchValue({
          frequency: {
            night: this.dosages.at(index).value.frequency.night + 1
          }
        });
    }

    if (addFor === "takeFor") {
      this.dosages.at(index).patchValue({
        takeFor: {
          quantity: this.dosages.at(index).value.takeFor.quantity + 1,
        },
      });
    }

    if (addFor === "quantity") {
      this.dosages.at(index).patchValue({
        quantity: this.dosages.at(index).value.quantity + 1,
      });
    }
  }

  handleMinus(addFor: any, index) {
    if (addFor === "morning") {
      if (this.dosages.at(index).value.frequency.morning > 0) {
        this.dosages
          .at(index)
          .patchValue({
            frequency: {
              morning: this.dosages.at(index).value.frequency.morning - 1
            }
          });
      }
    }

    if (addFor === "midday") {
      if (this.dosages.at(index).value.frequency.midday > 0) {
        this.dosages
          .at(index)
          .patchValue({
            frequency: {
              midday: this.dosages.at(index).value.frequency.midday - 1
            }
          });
      }
    }
    if (addFor === "evening") {
      if (this.dosages.at(index).value.frequency.evening > 0) {
        this.dosages
          .at(index)
          .patchValue({
            frequency: {
              evening: this.dosages.at(index).value.frequency.evening - 1
            }
          });
      }
    }

    if (addFor === "night") {
      if (this.dosages.at(index).value.frequency.night > 0) {
        this.dosages
          .at(index)
          .patchValue({
            frequency: {
              night: this.dosages.at(index).value.frequency.night - 1
            }
          });
      }
    }

    if (addFor === "takeFor") {
      if (this.dosages.at(index).value.takeFor.quantity > 0) {
        this.dosages.at(index).patchValue({
          takeFor: {
            quantity: this.dosages.at(index).value.takeFor.quantity - 1,
          },
        });
      }
    }

    if (addFor === "quantity") {
      if (this.dosages.at(index).value.quantity > 0) {
        this.dosages.at(index).patchValue({
          quantity: this.dosages.at(index).value.quantity - 1,
        });
      }
    }

  }

  //--------------Form Array Handling----------------
  get dosages() {
    return this.dosageForm.controls["dosages"] as FormArray;
  }

  addNewDosage() {
    this.dosages.clear();
    const dosage = this.fb.group({
      dose: ["", [Validators.required]],
      doseUnit: ["", [Validators.required]],
      routeOfAdministration: ["", [Validators.required]],
      frequency: this.fb.group({
        morning: [0],
        midday: [0],
        evening: [0],
        night: [0],
      }),
      takeFor: this.fb.group({
        quantity: [0],
        type: ["DAYS"],
      }),
      quantity: [0],
      medicineId: [""],
      medicineName: [""]
    });

    dosage.get('frequency').valueChanges.subscribe(() => {
      this.calculateQuantity(dosage);
    });

    dosage.get('takeFor').get('quantity').valueChanges.subscribe(() => {
      this.calculateQuantity(dosage);
    });

    dosage.get('takeFor').get('type').valueChanges.subscribe(() => {
      this.calculateQuantity(dosage);
    });

    this.dosages.push(dosage);
  }

  removeDosage(index: number) {
    this.finalArray.splice(index, 1);

  }

  calculateQuantity(dosage: FormGroup) {
    const frequency = dosage.get('frequency').value;
    const takeForQuantity = dosage.get('takeFor').get('quantity').value;
    const takeForType = dosage.get('takeFor').get('type').value;
  
    const frequencyTotal = frequency.morning + frequency.midday + frequency.evening + frequency.night;
  
    let multiplier = 1; 
    if (takeForType === 'WEEKS') {
      multiplier = 7; // 1 week = 7 days
    } else if (takeForType === 'MONTH') {
      multiplier = 30; // 1 month = 30 days
    }
  
    const totalQuantity = frequencyTotal * takeForQuantity * multiplier;
  
    dosage.patchValue({ quantity: totalQuantity });
  }
  

  openVerticallyCenteredmedicine(medicinecontent: any) {
    this.modalService.open(medicinecontent, {
      centered: true,
      size: "lg",
      windowClass: "master_modal medicine",
    });
  }

  openVerticallyCenteredrabeprazole(rabeprazolecontent: any) {
    this.addNewDosage();
    this.dosageModal = this.modalService.open(rabeprazolecontent, {
      centered: true,
      size: "md",
      windowClass: "rabeprazole",
    });

  }

  returnDosagesForMedicine(medId: any) {
    let doseArray = [];
    let statementArray = [];
    this.finalArray.forEach((dose) => {
      if (dose.medicineId === medId) {
        doseArray.push(dose);
      }
    });

    doseArray.forEach((element) => {
      let statement = "";

      /* dose */
      if (element?.dose !== '') {
        statement = `Dose : ${element?.dose},`;
        statementArray.push(statement);
      }

      /* doseUnit */
      if (element?.doseUnit !== '') {  // Check for non-empty doseUnit
        statement = ` Dose Unit : ${element?.doseUnit},`;
        statementArray.push(statement);
      }

      /* routeOfAdministration */
      if (element?.routeOfAdministration !== '') {  // Check for non-empty routeOfAdministration
        statement = ` Route Of Administration : ${element?.routeOfAdministration},`;
        statementArray.push(statement);
      }

      /* frequency */
      if (element?.frequency?.morning > 0 || element?.frequency?.midday > 0 ||
        element?.frequency?.evening > 0 || element?.frequency?.night > 0) {

        if (element?.frequency?.morning > 0) {
          statement = ` Frequency - Morning(${element?.frequency?.morning}),`;
          statementArray.push(statement);
        }
        if (element?.frequency?.midday > 0) {
          statement = ` Frequency - Midday(${element?.frequency?.midday}),`;
          statementArray.push(statement);
        }
        if (element?.frequency?.evening > 0) {
          statement = ` Frequency - Evening(${element?.frequency?.evening}),`;
          statementArray.push(statement);
        }
        if (element?.frequency?.night > 0) {
          statement = ` Frequency - Night(${element?.frequency?.night}),`;
          statementArray.push(statement);
        }
      }
      /* takeFor */
      if (element?.takeFor?.quantity > 0) {  // Check if quantity is greater than 0
        statement = ` Take For : Quantity(${element?.takeFor?.quantity}),`;
        statementArray.push(statement);

        // Now add Take For : Type only if the quantity is greater than 0
        if (element?.takeFor?.type !== 'DAYS') {
          statement = ` Take For : Type(${element?.takeFor?.type}),`;
          statementArray.push(statement);
        }
      }

      /* QUANTITY */
      if (element?.quantity > 0) {
        statement = ` Quantity(${element?.quantity})`;
        statementArray.push(statement);
      }

      // // Only add statement if it's not empty
      // if (statement) {
      //   statementArray.push(statement);
      // }
    });

    return statementArray;
  }

  routeBack() {
    this.route.navigate([`/individual-doctor/appointment/appointmentdetails/${this.appointmentId}`])
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

  routeToProfile(){
    const url = `/individual-doctor/patientmanagement/details/${this.patientId}?appointmentId=${this.appointmentId}&&showAddButtton=${this.showAddButtton}`;
    this.openedWindow = window.open(url, '_blank');
  }
  handleClick(event) {
    if (!this.isClicked) {
      this.isClicked = true;
      this.handleMedicineChange(event); // This will run only once, the first time the click happens
    }
  }
}
