import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-super-admin-main',
  templateUrl: './super-admin-main.component.html',
  styleUrls: ['./super-admin-main.component.scss']
})
export class SuperAdminMainComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}


// ngOnInit(): void {
//   // this.addNewMedicine()
// }
// constructor(private modalService: NgbModal,
//   private fb:FormBuilder,
//   private service: SuperAdminService,
//   private toastr: ToastrService,
//   private _coreService: CoreService) {
//   this.medicineForm = this.fb.group({
//     medicine: this.fb.array([])
//   });
// }

// closePopup(){

// }

// onSubmit() {
//   this.isSubmitted = true;
//   if (this.medicineForm.invalid) {
//     return;
//   }
//   this.isSubmitted = false;
//   this.service.addMedicine(this.medicineForm.value).subscribe((res: any) => {
//     let response = this._coreService.decryptObjectData(res);
//     if (response.status) {
//       this.toastr.success(response.message);
//       this.closePopup();
//     } else {
//       this.toastr.error(response.message);
//     }
//   });
// }

// get medicine() {
//   return this.medicineForm.controls["medicine"] as FormArray;
// }

// addNewMedicine() {
//   const newMedicine = this.fb.group({
//     number: ["", [Validators.required]],
//     medicine_class:[''],
//     medicine_name: [""],
//     inn: ["", [Validators.required]],
//     dosage: ["", [Validators.required]],
//     pharmaceutical: ["", [Validators.required]],
//     administration: ["", [Validators.required]],
//     therapeutic: ["", [Validators.required]],
//     manufacturer: ["", [Validators.required]]
//   });
//   this.medicine.push(newMedicine);
// }

// deleteMedicine(index: number) {
//   this.medicine.removeAt(index);
// }

