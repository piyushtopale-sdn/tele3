import { ToastrService } from "ngx-toastr";
import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
} from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatPaginator } from "@angular/material/paginator";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { MatAutocomplete } from "@angular/material/autocomplete";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { PatientService } from "src/app/modules/patient/patient.service";
import { CoreService } from "src/app/shared/core.service";
import { SuperAdminService } from 'src/app/modules/super-admin/super-admin.service';
import { IndiviualDoctorService } from "../../../indiviual-doctor.service";
import { MatCheckboxChange } from "@angular/material/checkbox";

// Immunization Table
export interface ImmunizationPeriodicElement {
  name: string;
  administereddate: string;
  manufacturedname: string;
  medicalcentre: string;
  batchnumber: string;
  routeofadministration: string;
  nextimmunizationdate: string;
}

@Component({
  selector: 'app-diagnosis',
  templateUrl: './diagnosis.component.html',
  styleUrls: ['./diagnosis.component.scss']
})
export class DiagnosisComponent {
  // Immunization Medication Table
  ImmunizationdisplayedColumns: string[] = [
    "datetime",
    "subject",
    "object",
    "assessment",
    "icd",
    "plan",
    "action"
  ];
  dataSource: any[] = [];
  @ViewChild("auto") autoComplete: MatAutocomplete; //new
  @Input() patient_id: any;
  @Input() appointmentId: any;
  @Output() refreshDetails = new EventEmitter<string>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  doctor_id: any = "";
  notesForm: any = FormGroup;
  isSubmitted: boolean = false;
  diagnosisList: any[] = [];
  userRole: any;
  page: any = 1;
  pageSize: number = 10;
  totalLength: number = 0;
  totalICDList: any;
  NoteId: any;

  filteredICDList: any[] = [];
  noDataFound: boolean = false; 
  selectedICDCodes: any[] = [];
  searchControl = new FormControl(""); // Search input control
  
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private doctorService: IndiviualDoctorService,
    private toastr: ToastrService,
    private coreService: CoreService,
    private _superAdminService: SuperAdminService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {
    this.notesForm = this.fb.group({
      subject: ["", [Validators.required]],
      object: ["", [Validators.required]],
      assessment: ["", [Validators.required]],
      plan: ["", [Validators.required]],
      icd10: ["", [Validators.required]]

    });
    
  }

  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.doctor_id = loginData?._id;
    this.userRole = loginData?.role;
    this.dignosis_List();
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.dignosis_List();
  }

  getAllICDList() {
    let reqData = {
      limit: 0,
      page: 1
    };

    this.doctorService.getAllCodesFilter(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.totalICDList = response?.body?.data || [];
        this.filteredICDList = [...this.totalICDList]; 
      }
    });
  }

  filterICDList(searchText: string) {
    if (!searchText?.trim()) {
      this.filteredICDList = [...this.totalICDList]; // Reset to full list
      this.noDataFound = false;
      return;
    }
  
    let reqData = { limit: 0, page: 1, searchText }; // Pass searchText in API request
  
    this.doctorService.getAllCodesFilter(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);
  
      if (response.status) {
        this.filteredICDList = response?.body?.data || []; // Load results from API
        this.noDataFound = this.filteredICDList.length === 0;
      } else {
        this.filteredICDList = [];
        this.noDataFound = true;
      }
  
      this.cdr.detectChanges(); // Force UI update
    });
  }
  

  toggleSelection(item: any, event: MatCheckboxChange) {
    event.source.focus(); // Keep focus on checkbox
    event.source._elementRef.nativeElement.click(); // Simulate click without closing
  
    let selectedICDs = this.notesForm.get("icd10")?.value || [];
  
    if (this.isSelected(item._id)) {
      // Remove from selected list
      selectedICDs = selectedICDs.filter((id) => id !== item._id);
      this.selectedICDCodes = this.selectedICDCodes.filter(
        (selected) => selected._id !== item._id
      );
    } else {
      // Add to selected list
      selectedICDs.push(item._id);
      this.selectedICDCodes.push(item);
    }
  
    this.notesForm.patchValue({ icd10: selectedICDs });
  }

  isSelected(id: string) {
    return this.notesForm.get("icd10")?.value.includes(id);
  }

  removeSelected(item: any) {
  let selectedICDs = this.notesForm.get("icd10")?.value || [];

  // Remove from selected list
  selectedICDs = selectedICDs.filter((id) => id !== item._id);
  this.selectedICDCodes = this.selectedICDCodes.filter(
    (selected) => selected._id !== item._id
  );


  // ✅ Update form properly
  this.notesForm.patchValue({ icd10: selectedICDs });
}

handleSaveNotes() {
  this.isSubmitted = true;

  if (this.notesForm.invalid) {
    this.notesForm.markAllAsTouched();
    this.coreService.showError("", "Please fill all required fields.");
    return;
  }

  // ✅ Use `this.selectedICDCodes` instead of form value to avoid stale data
  const mappedIcdCodes = this.selectedICDCodes.map((icd: any) => {
    return {
      id: icd._id, // Correct ID mapping
      code: icd.disease_title 
        ? `${icd.code}:${icd.disease_title}` // ✅ Add `:` only if disease_title exists
        : icd.code
    };
  });
  
  

  const reqData = {
    subject: this.notesForm.value.subject,
    object: this.notesForm.value.object,
    assessment: this.notesForm.value.assessment,
    icdCode: mappedIcdCodes, // ✅ Updated data
    plan: this.notesForm.value.plan,
    doctorId: this.doctor_id,
    patientId: this.patient_id,
    appointmentId: this.appointmentId,
    id: this.updateNotes ? this.NoteId : ""
  };

  if (this.updateNotes) {
    this.doctorService.updateDiagnosisApi(reqData).subscribe((res) => {
      const response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.coreService.showSuccess(response.message, "");
        this.closePopup();
      } else {
        this.coreService.showError(response.message, "");
      }
    });
  } else {
    this.doctorService.addDiagnosis(reqData).subscribe((res) => {
      const response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.coreService.showSuccess(response.message, "");
        this.getAllICDList();
        this.closePopup();
      } else {
        this.coreService.showError(response.message, "");
      }
    });
  }
}

  
  dignosis_List() {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      appointmentId: this.appointmentId
    }
    this.doctorService.getDiagnosisListApi(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.totalLength = response?.body?.totalRecords;
        this.dataSource = response?.body?.result;
        this.dataSource = this.dataSource.map(item => ({
          ...item,
          slicedIcdCode: this.sliceIcdCodes(item.icdCode),
        }));

      }
    });
  }
  sliceIcdCodes(icdCodes: any[]) {
    if (!icdCodes || icdCodes.length === 0) return [];
    const sliced = icdCodes.slice(0, 3);
    return sliced.length < icdCodes.length
      ? sliced.map(i => i.code).join(', ') + '...'
      : sliced.map(i => i.code).join(', ');
  }

  updateNotes: boolean = false;


  openVerticallyCenteredconsultation_notes(
    consultation_notes_content: any,
    data: any
  ) {
    if (data) {
      this.updateNotes = true;
      this.NoteId = data?._id
      this.selectedICDCodes = data?.icdCode || []; 
      this.notesForm.patchValue({
        subject: data?.subject,
        object: data?.object,
        assessment: data?.assessment,
        plan: data?.plan,
        icd10: data?.icdCode ? data.icdCode.map((icd: any) => icd.id) : []
      })
    } else {
      this.updateNotes = false;
      this.selectedICDCodes = [];
    }
    this.getAllICDList();

    // Apply Debouncing on Search Input
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged()) // Delay API calls
      .subscribe((searchText) => {
        this.filterICDList(searchText);
      });
    this.modalService.open(consultation_notes_content, {
      centered: true,
      size: "lg",
      windowClass: "add_notes",
    });

  }
  

  closePopup() {
    this.notesForm.reset(); // Reset the form
    this.notesForm.get("icd10")?.setValue([]); // Clear the dropdown selection
    this.selectedICDCodes = []; // Clear selected items list
    this.noDataFound = false; // Reset "No Data Found" flag
    this.searchControl.setValue(""); // Clear search input
    this.filteredICDList = [...this.totalICDList]; // Reset the filtered list
    this.modalService.dismissAll("close"); // Close the modal
    this.dignosis_List(); // Refresh the list
    this.cdr.detectChanges(); // Ensure UI updates
  }
}
