import { CoreService } from "src/app/shared/core.service";
import { PatientService } from "src/app/modules/patient/patient.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { PharmacyService } from '../../../pharmacy/pharmacy.service'
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { IResponse } from "src/app/shared/classes/api-response";
import {
  IDocMetaDataRequest,
  IDocMetaDataResponse,
  INewOrderRequest,
  INewOrderResponse,
  ISubscriberData,
  IUniqueId,
  RequestOrderType,
} from "./retailpharmacydetail.type";
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { Observable, map, startWith } from "rxjs";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MatTableDataSource } from "@angular/material/table";
@Component({
  selector: "app-retailpharmacydetail",
  templateUrl: "./retailpharmacydetail.component.html",
  styleUrls: ["./retailpharmacydetail.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class RetailpharmacydetailComponent implements OnInit {
  pharmacyId: any;
  currentRate = 1;
  pharmacyDetails: any;
  pharmacyProfile: any = ""
  comment: any = ""
  loginuser_id: any = ""
  portalUserID: string = "";
  commentorsProfile: any[] = [];
  SubscribersPatientList: any[] = [];
  ratingCount: any = 0
  getAverage: any = 0
  pharmacyRating_Reviwe: any[] = []
  requestType: RequestOrderType = "NA";
  filteredOptions!: Observable<any[]>;
  medicineList: any = [];
  medicineName: string = "";
  prescriptionSignedUrl: string = "";
  prescription_url: any = [];
  fileNamePrescription: string = "";
  selectedmedicineinfo: any;
  myControl = new FormControl("");
  eprescription_number: any = ''
  public orderMedicine: FormGroup = new FormGroup({
    subscriber_id: new FormControl("", []),
    eprescription_no: new FormControl("", []),
    medicine_details: new FormArray(
      [
        new FormGroup({
          name: new FormControl("", []),
          frequency: new FormControl("", []),
          duration: new FormControl("", []),
          prescribed: new FormControl("", []),
          action: new FormControl("", []),
        }),
      ],
      []
    ),
  });
  displayedColumns: string[] = [
    "name",
    "prescribed",
    "frequency",
    "duration",
    "action",
  ];
  dataSource: MatTableDataSource<AbstractControl>;
  selectedTabOrder: number = 0;
  prescription_doc: FormData = null;
  newMedicineArray: any = {};
  medicineIDObject: any = {};
  medicineNameObject: any = {};
  selectedPdfUrl: SafeResourceUrl [] = [];

  prescription_key: Array<string> = [];
  @ViewChild("loginRequiredWarningModal", { static: false }) loginRequiredWarningModal: any;
  @ViewChild("medicinepaymentcontent", { static: false }) medicinepaymentcontent: any;
  @ViewChild("approved", { static: false }) approved: any;
  associationGroupname: any;
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private service: PatientService,
    private coreService: CoreService,
    private _PharmacyService: PharmacyService,
    private superadminservice: SuperAdminService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
  ) {
    const userData = this.coreService.getLocalStorage("loginData");
    if (userData) {
      this.loginuser_id = userData._id;
    }
  }

  ngOnInit(): void {
    this.pharmacyId = this.activatedRoute.snapshot.paramMap.get("id");
    this.getPharmacyDetails();

    this.dataSource = new MatTableDataSource(
      (this.orderMedicine.get("medicine_details") as FormArray).controls
    );
    this.dataSource.filterPredicate = (data: FormGroup, filter: string) => {
      return Object.values(data.controls).some((x) => x.value == filter);
    };
  }

  removemedicine(index: number) {
    (this.orderMedicine.get("medicine_details") as FormArray).removeAt(index);
    this.dataSource = new MatTableDataSource(
      (this.orderMedicine.get("medicine_details") as FormArray).controls
    );
  }
  public handleMedicineChange(target: any, index: any): void {
    this.medicineName = '';
    if (target.value) {
      this.medicineName = target.value;
    } else {
      this.newMedicineArray = [];
      this.medicineIDObject = {};
    }
    this.getMedicineList(this.medicineName);
  }
  private getMedicineList(query) {
    let param = {
      query: query,
    };
    this.service.getmedicineList(param).subscribe(
      (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        const medicineArray = []

        for (const medicine of result.body.medicneArray) {
          medicineArray.push({
            medicine_name: medicine.medicine_name,
            medicine_id: medicine._id,
          });
        }
        this.medicineList = medicineArray;
        this.filteredOptions = this.myControl.valueChanges.pipe(
          startWith(""),
          map((value) => this._filter(value || ""))
        );
      },
      (err: ErrorEvent) => {
        console.log(err.message, "error");
      }
    );
  }
  openCommentPopup(medicinecontent: any, medicineId: any) {

    let reqData = {
      medicineIds: [medicineId],
    };

    this.superadminservice.getMedicinesById(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      this.selectedmedicineinfo = response?.body[0]?.medicine; //get medicine by id response

      this.modalService.open(medicinecontent, {
        centered: true,

        size: "md",

        windowClass: "claim_successfully",
      });
    });

  }
  handleAddNewMedicine() {

  }
  addNewMedicine() {
    const newRow: FormGroup = new FormGroup({
      name: new FormControl("", []),
      frequency: new FormControl("", []),
      duration: new FormControl("", []),
      prescribed: new FormControl("", []),
      action: new FormControl("", []),
    });
    (this.orderMedicine.get("medicine_details") as FormArray).push(newRow);
    this.dataSource = new MatTableDataSource(
      (this.orderMedicine.get("medicine_details") as FormArray).controls
    );
  }

  closePopup() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }
  getSubscriberDetails(loginModal: any) {

    if (this.getOrderField("subscriber_id") == '') {
      this.openVerticallyCenteredpaymentmedicine(
        this.medicinepaymentcontent
      );
      // this.uploadFilePrescription(loginModal);
    } else {
      this.uploadFilePrescription(loginModal);
    }
  }
  uploadFilePrescription(loginModal: any) {
    if (this.selectedTabOrder === 0) {
      this.uploadDocument(this.prescription_doc, loginModal);
    } else {
      this.createNewOrder();
    }
  }
  private addMedicineForSuperadmin() {
    return new Promise((resolve, reject) => {
      const medicineArray = [];
      for (const medicine of Object.values(this.newMedicineArray)) {
        medicineArray.push({
          medicine: {
            number: "",
            medicine_name: medicine,
            inn: "",
            dosage: "",
            pharmaceutical_formulation: "",
            administration_route: "",
            therapeutic_class: "",
            manufacturer: "",
            condition_of_prescription: "",
            other: "",
            link: "",
            status: false,
          },
        });
      }
      if (medicineArray.length > 0) {
        const reqData = {
          medicines: medicineArray,
          isNew: true,
          userId: this.portalUserID,
        };
        this.superadminservice.addMedicine(reqData).subscribe((res: any) => {
          let response = this.coreService.decryptObjectData({ data: res });

          if (response.status) {
            for (const med of response.body.result) {

              let index = this.coreService.getKeyByValue(
                this.newMedicineArray,
                med.medicine.medicine_name
              );

              this.medicineIDObject[index] = med._id;
            }
            resolve(true);
          } else {
            // this.toastr.error("Somthing went wrong while adding medicine");
            resolve(false);
          }
        });
      }
    });
  }
  async createNewOrder() {
    if (this.selectedTabOrder === 2) {
      if (Object.values(this.newMedicineArray).length > 0) {
        const addmed = await this.addMedicineForSuperadmin();
      }
      
      if (Object.values(this.medicineIDObject).length <= 0) {
        this.coreService.showError("", "Please add at least one medicine");
        return;
      }
    }
    let action = ''
    if (this.selectedTabOrder === 1) {
      action = 'eprecription'
    }

    const orderRequest: INewOrderRequest = {
      for_portal_user: [this.portalUserID],
      prescription_url: this.prescription_key,
      request_type: this.requestType,
      eprescription_number: this.eprescription_number,
      action,
      subscriber_id: (this.getOrderField("subscriber_id") == "") ? null : this.getOrderField("subscriber_id"),
      patient_details: {
        user_id: this.loginuser_id,
        order_confirmation: false,
        user_name: this.coreService.getLocalStorage("profileData").full_name
          ? this.coreService.getLocalStorage("profileData").full_name
          : "test_p Patient",
      },
      from_user: {
        user_id: this.loginuser_id,
        user_name: this.coreService.getLocalStorage("profileData").full_name
          ? this.coreService.getLocalStorage("profileData").full_name
          : "test_p Patient",
      },
      medicine_list: [],
      // orderFor :'Pharmacy'
      orderBy: {
        user_id: "",
        user_name: ""
      }
    };
    if (this.selectedTabOrder === 2) {
      orderRequest.medicine_list = this.getOrderField("medicine_details").map(
        (data, index) => ({
          name: this.medicineIDObject[index],
          medicine_id: this.medicineIDObject[index],
          quantity_data: {
            prescribed: data.prescribed,
          },
          frequency: data.frequency,
          duration: data.duration,
        })
      );
    }

    this.service.newOrder(orderRequest).subscribe({
      next: (res: IResponse<INewOrderResponse>) => {
        let result = this.coreService.decryptContext(res);

        this.coreService.showSuccess("", "New Order placed successfully");
        this.openVerticallyCenteredapproved(this.approved);
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
    });
  }
  private uploadDocument(doc: FormData, loginModal: any) {
    if (!this.loginuser_id) {
      this.modalService.open(loginModal, {
        centered: true,
        size: "md",
        windowClass: "payment_medicine",
      });
      return;
    }
    this._PharmacyService.uploadDocument(doc).subscribe({
      next: (result: IResponse<any>) => {
        let encryptedData = { data: result };
        let result1 = this.coreService.decryptObjectData(encryptedData);
        this.coreService.showSuccess("", "File Uploaded Successful");
        this.saveMetadata(result1.data);
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
    });
  }
  onFileSelected($event, type: "prescription") {
    const files: File[] = $event.target.files;
    const formData: FormData = new FormData();
    formData.append("userId", this.loginuser_id);
    formData.append(
      "docType",
      (type + "/" + sessionStorage.getItem("portal-user-id")) as string
    );
    if (files.length > 1) {
      formData.append("multiple", "true");
    } else {
      formData.append("multiple", "false");
    }
    let imageUrlArray = [];
    let pdfurlArray = [];
    for (const file of files) {
      formData.append("docName", file);
      if (file.type === 'application/pdf') {
        const pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          window.URL.createObjectURL(file)
        );

        pdfurlArray.push(pdfUrl);
        this.fileNamePrescription = file.name;
        this.selectedPdfUrl = pdfurlArray

      }
      else{
      const imgUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        window.URL.createObjectURL(file)
      );
      imageUrlArray.push(imgUrl);
      this.fileNamePrescription = file.name;
      this.prescription_url = imageUrlArray;
    }
  }
    if (type === "prescription") {
      this.prescription_doc = formData;
    }
  }
  resetModalService() {
    this.selectedTabOrder = 0;
    this.prescription_doc = null;
    this.prescription_url = [];
    this.prescription_key = [];
    this.requestType = "NA";
    this.selectedTabOrder = 0;
    this.fileNamePrescription = "";
    this.orderMedicine = new FormGroup({
      subscriber_id: new FormControl(""),
      eprescription_no: new FormControl("", []),
      medicine_details: new FormArray(
        [
          new FormGroup({
            name: new FormControl("", []),
            frequency: new FormControl("", []),
            duration: new FormControl("", []),
            prescribed: new FormControl("", []),
            action: new FormControl("", []),
          }),
        ],
        []
      ),
    });
    this.dataSource = new MatTableDataSource(
      (this.orderMedicine.get("medicine_details") as FormArray).controls
    );
  }
  closeAllModal() {
    this.modalService.dismissAll();
    this.resetModalService();
  }
  removeImageFromPrescriptionArray(index: any): void {
    const updatedArray = [];
    for (const key in this.prescription_url) {
      if (index != key) {
        updatedArray.push(this.prescription_url[key]);
      }
    }
    this.prescription_url = updatedArray;
  }
  saveMetadata(data: any) {
    const documentMetaDataArray = [];
    for (const metadata of data) {
      documentMetaDataArray.push({
        name: metadata.Key.split("/")[4],
        code: "prescription",
        e_tag: metadata.ETag,
        issued_date: new Date().toISOString(),
        expiry_date: null,
        url: metadata.Key,
        is_deleted: false,
        uploaded_by: this.loginuser_id,
        for_portal_user: this.portalUserID,
      });
    }

    this.service.saveMetadata(documentMetaDataArray).subscribe({
      next: (result: IResponse<IDocMetaDataResponse[]>) => {
        let encryptedData = { data: result };
        let result1 = this.coreService.decryptObjectData(encryptedData);
        const prescriptionIDArray = [];
        for (const data of result1.body) {
          prescriptionIDArray.push(data._id);
        }
        this.prescription_key = prescriptionIDArray;
        this.createNewOrder();
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
      },
    });
  }
  //Start medicine filter
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    if (this.medicineList.length > 0) {
      var result = this.medicineList.filter((option: any) => {
        return option.medicine_name.toLowerCase().includes(filterValue);
      });
      return result != "" ? result : ["No data"];
    }
    return ["No data"];
  }
  // End medicine filter

  public updateMySelection(option: any, i: any) {
    
    this.medicineIDObject[i] = option.medicine_id;
    this.medicineNameObject[i] = option.medicine_name;
  }
  //Add new medcine for the superadmin
  public handleAddMedicineClick(idx: any) {
    this.newMedicineArray[idx] = this.medicineName;
    this.medicineNameObject[idx] = this.medicineName;
    this.medicineList.push({ medicine_name: this.medicineName });
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(""),
      map((value) => this._filter(value || ""))
    );
  }

  public clearText() {
    this.medicineName = "";
  }
  private getOrderField(...field: string[]) {
    return this.orderMedicine.get(field).value;
  }
  public tabChangedOrderMedicine(tabChangeEvent: MatTabChangeEvent): void {
    this.selectedTabOrder = tabChangeEvent.index;
  }
  //  Payment Medicine modal
  openVerticallyCenteredpaymentmedicine(medicinepaymentcontent: any) {
    this.modalService.open(medicinepaymentcontent, {
      centered: true,
      size: "md",
      windowClass: "payment_medicine",
    });
  }
  //  Approved modal
  openVerticallyCenteredapproved(approved: any) {
    this.modalService.open(approved, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
    });
  }
  get medicineData(): FormArray {
    return this.orderMedicine.get("medicine_details") as FormArray;
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
  getPharmacyDetails() {
    this.service.getPharmacyDetails(this.pharmacyId).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.pharmacyDetails = response?.data;
      this.getAssociationdetails();
      this.pharmacyProfile = response?.data?.backGround?.pharmacy_logo

      response?.data?.reviews?.comments.forEach((element, i) => {
        this.commentorsProfile[i] = element?.userProfilePic;
      });
      this.getPharmcyRaviweandRating()
    });
  }
  public handleBtnClick() {
    localStorage.setItem("status","true")
    this.modalService.dismissAll();
    this.router.navigate(["/patient/login"]);
  }

  openVerticallyCenteredordermedicine(
    ordermedicinecontent: any,
    for_portal_user: string = ''
  ) {

    if (this.loginuser_id == '') {
      this.modalService.open(this.loginRequiredWarningModal, {
        centered: true,
        size: "lg",
        windowClass: "order_medicine",
      });
      return;
    }
    this.portalUserID = for_portal_user;
    this.modalService.open(ordermedicinecontent, {
      centered: true,
      size: "lg",
      windowClass: "order_medicine",
    });
    this.SubscribersList();
  }
  SubscribersList() {
    let param = {

      patientId: this.loginuser_id
      // patientId: "63d0f8213c4b44b6397794ff"
    }
    this.service.SubscribersList(param).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        this.SubscribersPatientList = result?.data?.all_subscriber_ids
        // for (let data of result?.data?.all_subscriber_ids) {
        //   if(data?.subscription_for=="Primary"){
        //     this.patinetSubcriberID=data.subscriber_id
        //   }
        // }
      },
      error: (err) => {
        console.log(err)
      }
    })


  }
  //Get All review
  getPharmcyRaviweandRating() {
    let param = {
      portal_user_id: this.pharmacyId,
      page: 1,
      limit: 10000

    }

    this._PharmacyService.getPharmcyRaviweandRating(param).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        this.ratingCount = result?.body?.ratingCount
        this.getAverage = parseFloat(result?.body?.getAverage?.average_rating).toFixed(1)
        
        let data = []
        for (let reviwe of result?.body?.ratingArray) {
          data.push({
            rating: reviwe.rating,
            comment: reviwe.comment,
            patientName: reviwe.patientName,
            date: this.coreService.createDate(new Date(reviwe.createdAt)) ? this.coreService.createDate(new Date(reviwe.createdAt)) : "NA",
            // firsttlatterofname: this.getShortName(reviwe.patientName ? reviwe.patientName : "shivam")
            firsttlatterofname: reviwe.profile_picture
          })
        }
        this.pharmacyRating_Reviwe = data
      },
      error: (err) => {
        console.log(err);
      },
    })

  }
  getShortName(fullName: any) {

    return fullName.split(" ").map(n => n[0]).join("");
  }
  //  Review modal
  openVerticallyCenteredreview(reviewcontent: any) {
    if (this.loginuser_id == undefined) {
      this.toastr.error("Please Login first")
    }
    else {
      this.modalService.open(reviewcontent, { centered: true, size: 'md', windowClass: "review", backdrop: "static" });
    }

  }
  handelReviweRating(data: any) {
    if (data.comment) {
      this.comment = data.comment.target.value
    }
  }

  returnInitial(name: string) {
    let initial = name.substring(0, 1);
    return initial;
  }
  postRatingAndReviwe() {
    const userData = this.coreService.getLocalStorage("loginData");
    if (!userData) {
      this.modalService.open(this.loginRequiredWarningModal, {
        centered: true,
        size: "lg",
        windowClass: "order_medicine",
      });
      // this.coreService.showError("Please login first", " ")
      return
    }
    let pararm = {
      for_portal_user: this.pharmacyId,

      patient_login_id: this.loginuser_id,
      rating: this.currentRate,
      comment: this.comment
    }
    this._PharmacyService.PharmacyReviweandRating(pararm).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        this.toastr.success(result.message)
        this.getPharmcyRaviweandRating()
        this.closePopup()
      },

      error: (err) => {
        console.log(err);
      },

    })



  }

  getAssociationdetails() {
    this._PharmacyService.pharmacyAssociationApi(this.pharmacyId).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response?.body?.association?.enabled) {
        this.associationGroupname = response?.body?.association?.name.map(nameItem => nameItem).join(', ');
      } else {
        this.associationGroupname = " "
      }
    });
  }

  getDirection(direction:any ) {
       
    if (!direction)
    {
      this.toastr.error("Location coordinates not found")
      return 
    }
    const lat = direction[1];
    const lng = direction[0];

    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(mapUrl, "_blank");  
  
  }


  clearPdfUrl(index : number) {
    
    this.selectedPdfUrl.splice(index, 1); 
  }
}
