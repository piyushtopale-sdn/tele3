import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup ,Validators} from '@angular/forms';
import { DateAdapter, MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ChartConfiguration, ChartData, ChartOptions, ChartType } from 'chart.js';
import { ToastrService } from 'ngx-toastr';
import { CoreService } from 'src/app/shared/core.service'; 
import * as XLSX from 'xlsx';
import { SuperAdminService } from '../super-admin.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';


@Component({
  selector: 'app-super-admin-dashboard',
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SuperAdminDashboardComponent implements OnInit {
  displayedColumns: string[] = [
    "patientname",
    "mobile"
  ];
  listData: any[] = []
  pageSize: number = 5;
  totalLength: number = 0;
  page: number = 1;

  totalConsultationBooked: ChartData<'bar'>;
  totalOptions: ChartOptions<'bar'>;
  noDataAvailable: boolean = false;
  showList: boolean = false;
  fromDate: string = "";
  toDate: string = "";
  graphFromDate: string = "";
  graphToDate: string = "";
  dateRangeForm: FormGroup;
  totalActiveDoctor: any;
  totalLaboratory: any;
  totalnonSubscriptionPatient: any;
  totalPatient: any;
  totalPharmacies: any;
  totalRadiology: any;
  startgraphDate: string;
  endgraphDate: string;
  // years: number[] = [];
  graphyear: number;
  // selectedYear: number;
  currentUrl: any = [];
  doctorListArray:any =[];
  pharamcyListArray:any =[];
  subscribersArray: any [] = [];
  patientsArray: any [] = [];
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  selectedMonth: string = this.months[new Date().getMonth()]; // Default to current month

  years: number[] = [];
  selectedYear: number = new Date().getFullYear(); // Default to current year
  registeredPatientArray:any =[];
  radioListArray:any =[];
  labListArray:any=[];
  selectedStatus: any = 'ALL';
  onlineDoctorCount:any = 0;
  constructor(private fb: FormBuilder,
    private _coreService: CoreService,
    private router: Router,
    private modalService: NgbModal,
    private _superAdminService: SuperAdminService,
    private datepipe: DatePipe,
    private loader: NgxUiLoaderService,
    private dateAdapter: DateAdapter<Date>
  ) {

    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl);

    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    this.dateRangeForm = this.fb.group({
      fromDate: [null,Validators.required],
      toDate: [null,Validators.required]
    });

    this.yeardropdown();

  }
  yeardropdown() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 4; i--) {
      this.years.push(i);
    }

    this.selectedYear = currentYear;

  }


  ngOnInit(): void {
    this.dashboardCount();
    this.nonSubscriptionPatient();
    this.totalActiveDoctorList();
    this.totalregisteredPatientList();
    this.totalPharmacyLsit();
    this.totalLabList();
    this.totalradiologyList();
    this.dashboardgrapgh();
    this.orderPrescribedDetails();
    this.doctorConsultationDetails();
    this.onlineDoctorList();

    // const now = new Date();
    // const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    // const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // this.dateRangeForm.patchValue({
    //   fromDate: firstDay,
    //   toDate: lastDay
    // });

    // this.fromDate = this.formatDate(firstDay);
    // this.toDate = this.formatDate(lastDay);
    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl);

  }
  dashboardCount() {
    let data = {
      fromDate: this.fromDate || "",
      toDate: this.toDate || ""
    };

    this._superAdminService.mainDashboardCount(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.totalActiveDoctor = response?.body?.totalActiveDoctor
        this.totalLaboratory = response?.body?.totalLaboratory
        this.totalPatient = response?.body?.totalPatient
        this.totalPharmacies = response?.body?.totalPharmacies
        this.totalRadiology = response?.body?.totalRadiology
      }

    }
    )
  }
  getgraphYear(year) {
    let startDate = year + "-01-01T18:30:00.000Z";
    let endDate = year + "-12-31T18:30:00.000Z";
    this.startgraphDate = this.formatDateNew(startDate);
    this.endgraphDate = this.formatDateNew(endDate);
  

  }


  onMonthChange(month: string) {
    this.selectedMonth = month;
    this.updateGraphDate(this.selectedYear, month);
  }

  updateGraphDate(year: number, month: string) {
    const monthIndex = this.months.indexOf(month) + 1; // Convert month name to index (1-12)
    const monthStr = monthIndex.toString().padStart(2, '0'); // Format as "01", "02", etc.

    // Set start and end dates based on selected month and year
    let startDate = `${year}-${monthStr}-01T00:00:00.000Z`;
    let endDate = `${year}-${monthStr}-31T23:59:59.000Z`; // 

    this.startgraphDate = this.formatDateNew(startDate);
    this.endgraphDate = this.formatDateNew(endDate);


    this.dashboardgrapgh();
  }

  formatDateNew(dateStr: string): string {
    const date = new Date(dateStr);
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // getUTCMonth() returns 0-11
    const day = date.getUTCDate().toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${month}-${day}-${year}`;
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };




  onDateChange(type: string, event: Date): void {
    if (event instanceof Date) {
    } else {
      console.warn(`Invalid date input in ${type} field`);
      this.dateRangeForm.get(type)?.setValue(null); // Reset invalid input
    }
    
    if (type === 'from') {
      this.dateRangeForm.get('fromDate')?.setValue(event);
    } else if (type === 'to') {
      this.dateRangeForm.get('toDate')?.setValue(event);
    }

    const fromDate = this.dateRangeForm.get('fromDate')?.value;
    const toDate = this.dateRangeForm.get('toDate')?.value;

    this.fromDate = this.formatDate(fromDate);
    this.toDate = this.formatDate(toDate);

    this.dashboardCount();
    this.dashboardgrapgh();
    this.nonSubscriptionPatient();
    this.totalActiveDoctorList();
    this.totalregisteredPatientList();
    this.totalPharmacyLsit();
    this.totalLabList();
    this.totalradiologyList();
    this.orderPrescribedDetails()
    this.doctorConsultationDetails()


  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'MM-dd-yyyy') || '';
  }

  // dashboardgrapgh() {
  //   let data = {
  //     fromDate: this.fromDate || "",
  //     toDate: this.toDate || ""
  //   }
  //   this._superAdminService.mainDashboardgrapgh(data).subscribe((res: any) => {
  //     let encryptedData = { data: res };
  //     let response = this._coreService.decryptObjectData(encryptedData);
  //     if (response.status) {
  //       let data = response?.body;
  //       let docConsult = data?.totalDoctorConsultation || 0;
  //       let pharmOrder = data?.totalPharmacyOrder || 0;
  //       let laborder = data?.totalLabConsultation || 0;
  //       let radioOrder = data?.totalRadiologyConsulation || 0;


  //       const consultationData = [docConsult, pharmOrder, laborder, radioOrder];

  //       // Check if all values are zero
  //       this.noDataAvailable = consultationData.every(value => value === 0);

  //       const maxYValue = Math.ceil(Math.max(...consultationData) / 20) * 20;

  //       this.totalOptions = {
  //         responsive: true,
  //         scales: {
  //           y: {
  //             beginAtZero: true,
  //             max: maxYValue,
  //             ticks: {
  //               stepSize: 20,
  //               color: '#555',
  //             }
  //           },
  //           x: {
  //             ticks: {
  //               color: '#555',
  //             }
  //           }
  //         },
  //         plugins: {
  //           legend: {
  //             display: false
  //           },
  //           tooltip: {
  //             callbacks: {
  //               label: (tooltipItem) => ` ${tooltipItem.raw}`
  //             }
  //           }
  //         },
  //         onClick: (event, chartElements) => {
  //           if (chartElements.length) {
  //             const chartElement = chartElements[0];
  //             const label = this.totalConsultationBooked.labels[chartElement.index];
  
  //             // Call exportList with the type based on clicked label
  //             if (label === 'Lab Ordered') {
  //               this.exportList('lab');
  //             } else if (label === 'Radiology Ordered') {
  //               this.exportList('radiology');
  //             }
  //           }
  //         }
  //       }; // ensure it's at least 20

  //       this.totalConsultationBooked = {

  //         labels: ['Doctor Consultation', 'Prescription Ordered', 'Lab Ordered', 'Radiology Ordered'],
  //         datasets: [
  //           {
  //             label: 'Total Consultations',
  //             data: [docConsult, pharmOrder, laborder, radioOrder],
  //             backgroundColor: ['#5A78DB', '#36A2EB', '#FF7A45', '#00D689', '#655CDC'],
  //             hoverBackgroundColor: ['#4A68BB', '#2B8CE4', '#E0673B', '#00C57B', '#574CBB'],
  //             maxBarThickness: 100,
  //           }
  //         ]
  //       }
  //     }

  //   }
  //   )
  // }

  dashboardgrapgh() {
    let graphFromDate = this.fromDate || "";
    let graphToDate = this.toDate || "";

    let data = {
        fromDate: graphFromDate,
        toDate: graphToDate
    };

    this._superAdminService.mainDashboardgrapgh(data).subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);

        if (response.status) {
            let data = response?.body;
            let docConsult = data?.totalDoctorConsultation || 0;
            let pharmOrder = data?.totalPharmacyOrder || 0;
            let laborder = data?.totalLabConsultation || 0;
            let radioOrder = data?.totalRadiologyConsulation || 0;

            this.graphFromDate = graphFromDate;
            this.graphToDate = graphToDate;

            const consultationData = [docConsult, pharmOrder, laborder, radioOrder];

            this.noDataAvailable = consultationData.every(value => value === 0);
            const maxYValue = Math.ceil(Math.max(...consultationData) / 20) * 20;

            this.totalOptions = {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: maxYValue,
                        ticks: {
                            stepSize: 20,
                            color: '#555',
                        }
                    },
                    x: {
                        ticks: {
                            color: '#555',
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (tooltipItem) => ` ${tooltipItem.raw}`
                        }
                    }
                },
                onClick: (event, chartElements) => {
                    if (chartElements.length) {
                        const chartElement = chartElements[0];
                        const label = this.totalConsultationBooked.labels[chartElement.index];

                        if (label === 'Lab Ordered') {
                            this.exportList('lab', this.graphFromDate, this.graphToDate);
                        } else if (label === 'Radiology Ordered') {
                            this.exportList('radiology', this.graphFromDate, this.graphToDate);
                        } else if (label === 'Prescription Ordered'){
                            this.exportorderPrescribedDetails( this.subscribersArray);
                        }else if (label === 'Doctor Consultation'){
                          this.exportDoctorConsultationDetails( this.patientsArray);
                      }
                    }
                }
            };

            this.totalConsultationBooked = {
                labels: ['Doctor Consultation', 'Prescription Ordered', 'Lab Ordered', 'Radiology Ordered'],
                datasets: [
                    {
                        label: 'Total Consultations',
                        data: [docConsult, pharmOrder, laborder, radioOrder],
                        backgroundColor: ['#5A78DB', '#36A2EB', '#FF7A45', '#00D689', '#655CDC'],
                        hoverBackgroundColor: ['#4A68BB', '#2B8CE4', '#E0673B', '#00C57B', '#574CBB'],
                        maxBarThickness: 100,
                    }
                ]
            };
        }
    });
}



  onNavigate(url: any): void {
    const menuitems = JSON.parse(localStorage.getItem("activeMenu"));
    if(menuitems){
      this.currentUrl = url;
  
      const findMenuItem = (menuItems, url) => {
        for (const menu of menuItems) {
          if (menu.route_path === url) {
            return menu;
          }
  
          if (menu.children && menu.children.length > 0) {
            const matchedChild = findMenuItem(menu.children, url);
            if (matchedChild) {
              return matchedChild;
            }
          }
        }
        return null;
      };
  
      const matchedMenu = findMenuItem(menuitems, this.currentUrl);
  
      if (matchedMenu) {
        this.router.navigate([url]).then(() => {
          this._superAdminService.setActiveMenu(matchedMenu?.name);
        });
      } else {
        console.error("No matching menu found for URL:", this.currentUrl);
      }
    }
  }

  nonSubscriptionPatient() {
    let data = {
      fromDate: this.fromDate || "",
      toDate: this.toDate || "",
      limit: this.pageSize,
      page: this.page

    }
    this._superAdminService.nonSubscriptionPatientData(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      
      if (response.status) {
        this.totalnonSubscriptionPatient = response?.body?.totalCount;
        this.listData = response?.body?.usersList;
        this.totalLength = response?.body?.totalCount;
      }
    }
    )
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.nonSubscriptionPatient();
  }
  showtable() {
    this.showList = true;
  }
  totalActiveDoctorList() {
    let data = {
      fromDate: this.fromDate || "",
      toDate: this.toDate || "",
    }
    this._superAdminService.exportNoOfActiveDoctor(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.doctorListArray = response?.body?.data?.doctors;
     
      }
    }
    )
  }

  exportActiveDoctorList() {
    if (this.doctorListArray.length === 0) {
      return;

    }
    const formattedData = this.doctorListArray.map((data, index) => ({
      'Full Name': data?.full_name ?? "",
      'Full Name Arabic': data?.full_name_arabic ?? "",
      'Mobile Number': data?.for_portal_user?.country_code + " - " + data?.for_portal_user?.mobile,
      'Gender': data?.gender ?? "" ,
      'Year of experience': data?.years_of_experience ?? "",
      'Creation Date':this.formatDate___(data?.createdAt) ?? ""
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    ws['!cols'] = [
      { wch: 20 },
      { wch: 20 },
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Active Doctor List.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, 'Active Doctor List');

    XLSX.writeFile(wb, fileName);
  }


  totalregisteredPatientList() {
    let data = {
      fromDate: this.fromDate || "",
      toDate: this.toDate || "",


    }
    this._superAdminService.exportRegisteredPatient(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.registeredPatientArray = response?.body?.data?.patients;
     
      }
    }
    )
  }

  exportRegisteredPatientList() {
    if (this.registeredPatientArray.length === 0) {
      return;
    }
    const formattedData = this.registeredPatientArray.map((data, index) => ({
      'Full Name': data?.full_name ?? "",
      'Full Name Arabic': data?.full_name_arabic ?? "",
      'Mobile Number': data?.for_portal_user?.country_code + " - " + data?.for_portal_user?.mobile,
      'Gender': data?.gender ?? "" ,
      'MRN Number': data?.mrn_number ?? "",
      'Blood Group': data?.blood_group ?? "",
      'Iqama Number': data?.iqama_number ?? "",
      'Saudi Id': data?.saudi_id ?? "",
      'Passport Number': data?.passport ?? "",
      'Created Date': this.formatDate___(data?.for_portal_user?.createdAt) ?? "",
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    ws['!cols'] = [
      { wch: 20 },
      { wch: 20 },
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Registered Patient List.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, 'Registered Patient List');

    XLSX.writeFile(wb, fileName);
  }

  totalPharmacyLsit() {
    let data = {
      fromDate: this.fromDate || "",
      toDate: this.toDate || "",
      

    }
    this._superAdminService.exportTotalPharmacy(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.pharamcyListArray = response?.body?.data?.pharmacies;
      }
    }
    )
  }

  exportPharmacyList() {
    if (this.pharamcyListArray.length === 0) {
      return;
    }
    const formattedData = this.pharamcyListArray.map((data, index) => ({
      'Pharamcy Name': data?.pharmacy_name ?? "",
      'Pharmacy Arabic Name': data?.pharmacy_name_arabic ?? "",
      'Phone Number': data?.for_portal_user?.country_code + " - " + data?.for_portal_user?.phone_number,
      'Email':data?.for_portal_user?.email ?? "" ,
      'Addres': data?.address ?? "",
      'Created Date': this.formatDate___(data?.for_portal_user?.createdAt) ?? "", 
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    ws['!cols'] = [
      { wch: 20 },
      { wch: 20 },
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Pharmacy List.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, 'Pharmacy List');

    XLSX.writeFile(wb, fileName);
  }

  totalLabList() {
    let data = {
      fromDate: this.fromDate || "",
      toDate: this.toDate || "",
    }
    this._superAdminService.exportTotalLaboratory(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.labListArray = response?.body?.laboratoryData
    }
    })}

    exportLabList() {
      if (this.labListArray.length === 0) {
        return;
      }
      const formattedData = this.labListArray.map((data, index) => ({
        'Center Name': data?.centre_name ?? "",
        'Center Arabic Name': data?.centre_name_arabic ?? "",
        'Phone Number': data?.country_code + " - " + data?.phone_number,
        'Email':data?.email ?? "" ,
        'Created Date': this.formatDate___(data?.createdAt) ?? "",
      }));
  
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
  
      ws['!cols'] = [
        { wch: 20 },
        { wch: 20 },
      ];
  
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      const fileName = `Laboratory List.xlsx`;
  
      XLSX.utils.book_append_sheet(wb, ws, 'Laboratory List');
  
      XLSX.writeFile(wb, fileName);
    }
  

  totalradiologyList() {
    let data = {
      fromDate: this.fromDate || "",
      toDate: this.toDate || "",
    
    }
    this._superAdminService.exportTotalRadiology(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.radioListArray = response?.body?.laboratoryData;
      }
    }
    )
  }
  exportRadioList() {
    if (this.radioListArray.length === 0) {
      return;
    }
    const formattedData = this.radioListArray.map((data, index) => ({
      'Center Name': data?.centre_name ?? "",
      'Center Arabic Name': data?.centre_name_arabic ?? "",
      'Phone Number': data?.country_code + " - " + data?.phone_number,
      'Email':data?.email ?? "" ,
      'Created Date': this.formatDate___(data?.createdAt) ?? "",
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

    ws['!cols'] = [
      { wch: 20 },
      { wch: 20 },
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Radiology List.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, 'Radiology List');

    XLSX.writeFile(wb, fileName);
  }


  // exportNonSubcribedPatient() {
  //   if (this.listData.length === 0) {
  //     return;

  //   }
  //   const formattedData = this.listData.map((data, index) => ({
  //     'Patient Full Name': data?.full_name ?? "",
  //     'Patient Full Name Arabic': data?.full_name_arabic ?? "",
  //     'Patient Mobile Number': data?.country_code + " - " + data?.mobile
  //   }));

  //   const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

  //   ws['!cols'] = [
  //     { wch: 20 },
  //     { wch: 20 },
  //   ];

  //   const wb: XLSX.WorkBook = XLSX.utils.book_new();
  //   const fileName = `Non Subscribed Patients List.xlsx`;

  //   XLSX.utils.book_append_sheet(wb, ws, 'Non Subscribed Patients List');

  //   XLSX.writeFile(wb, fileName);
  // }



  exportNonSubcribedPatient() {
    let reqData = {
        fromDate: this.fromDate || "",
        toDate: this.toDate || "",
        page: 1,
        limit: 0
    };

    this._superAdminService.nonSubscriptionPatientData(reqData)
    .subscribe((res: any) => {
        let response = this._coreService.decryptObjectData({ data: res });

        if (response.status && response.body.usersList.length > 0) {
            this.loader.stop();

            var headers = [
                "Patient Full Name",
                "Patient Full Name Arabic",
                "Patient Mobile Number",
                "Active/Inactive"                
            ];

            const formattedData = response.body.usersList.map((data: any) => ([
                data?.full_name ?? "",
                data?.full_name_arabic ?? "",
                `${data?.country_code} - ${data?.mobile}`,
                data?.isDeleted ? 'Inactive' : 'Active' 
            ]));

            formattedData.unshift(headers);

            const fileName = `Non_Subscribed_Patients.xlsx`;
            const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(formattedData);

            const wb: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Non Subscribed Patients List');

            XLSX.writeFile(wb, fileName);
        } else {
            console.log("No data found for the given date range.");
        }
    }, (error) => {
        console.error("Error fetching patient data:", error);
    });
  }

  exportList(type: any, fromDate: string, toDate: string) {
    var data: any = [];

    let reqData = {
        fromDate: fromDate || "", 
        toDate: toDate || "",
        type: type,
        page: 1,
        limit: 0,
        status: 'ALL'
    };

  
    this._superAdminService.export_labbRadioList(reqData)
        .subscribe((res) => {
            let result = this._coreService.decryptObjectData({ data: res });
            if (result.status) {
                this.loader.stop();
                var array = [
                    "Patient Name",
                    "Centre Name",
                    "Location",
                    "Status",
                    "Order Date&Time",
                    "Prescribed By",
                    "Appointment ID",
                    "Completed Date&Time",
                ];

                data = result.data.array;
                data.unshift(array);

                const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
                const fromDateStr = fromDate ? new Date(fromDate).toLocaleDateString() : 'N/A';
                const toDateStr = toDate ? new Date(toDate).toLocaleDateString() : 'N/A';

                var fileName = `${typeLabel}Orders_${fromDateStr}_to_${toDateStr}.xlsx`;
                const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);

                const wb: XLSX.WorkBook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
                XLSX.writeFile(wb, fileName);
            }
        });
}


  orderPrescribedDetails() {
    let data = {
      startDate: this.fromDate || "",
      endDate: this.toDate || "",
    
    }
    this._superAdminService.getOrderPrescribedDetails(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.subscribersArray = response?.data;
      }
    }
    )
  }

 exportorderPrescribedDetails(subscribersArray: any[]) {
    if (!subscribersArray || subscribersArray.length === 0) {
      console.warn("No data available for export.");
      return;
    }
    const formattedData = subscribersArray.map((data, index) => ({
      'Doctor Name': data?.doctorName ?? "",
      'Doctor Arabic Name': data?.doctorArabicName ?? "",
      'Patient Name': data?.patientName ?? "",
      'Patient Gender':data?.patientGender ?? "",
      'MRN Number':data?.mrnNumber ?? "",
      'Order Status' : data?.orderStatus ?? "",
      'Order Id':data?.orderId ?? "",
    }));
 
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
 
    ws['!cols'] = [
      { wch: 30 }, 
      { wch: 30 },
      { wch: 20 },
      { wch: 30 },
    ];
 
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Order_Prescribed_Details.xlsx`;
 
    XLSX.utils.book_append_sheet(wb, ws, 'Order Prescribed Details');
 
    XLSX.writeFile(wb, fileName);
}

doctorConsultationDetails(){
  let data = {
    startDate: this.fromDate || "",
    endDate: this.toDate || "",
  
  }
  this._superAdminService.getDoctorConsultationDetails(data).subscribe((res: any) => {
    let encryptedData = { data: res };
    let response = this._coreService.decryptObjectData(encryptedData);
    if (response.status) {
      this.patientsArray = response?.data;

    }
  }
  )
}

exportDoctorConsultationDetails(patientsArray: any[]) {
  if (!patientsArray || patientsArray.length === 0) {
    console.warn("No data available for export.");
    return;
  }
  const formattedData = patientsArray.map((data, index) => ({
    'Appointment Id': data?.appointment_id,
    'Doctor Name': data?.doctorName ?? "",
    'Doctor Arabic Name': data?.doctorArabicName ?? "",
    'Doctor Id':data?.doctorId ?? "",
    'Patient Name': data?.patientName ?? "",
    'Patient Gender':data?.patientGender ?? "",
    'MRN Number':data?.mrnNuber ?? "",
    'Consultation Date' : data?.consultationDate ?? "",
    'Consultation Time':data?.consultationTime ?? "",
  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

  ws['!cols'] = [
    { wch: 30 }, 
    { wch: 30 },
    { wch: 20 },
    { wch: 30 },
  ];

  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  const fileName = `Doctor_Consultation_Details.xlsx`;

  XLSX.utils.book_append_sheet(wb, ws, 'Doctor Consultation Details');

  XLSX.writeFile(wb, fileName);
}


  formatDate___(date: Date): string {
    return this.datepipe.transform(date, 'dd-MM-yyyy') || '';
  }



  onlineDoctorList(type:any =''){    
    this._superAdminService.getOnlineDoctor().subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.onlineDoctorCount = response?.body?.count; 
        let doctroArray = response?.body?.data;
        if(type === 'click'){
          if (!doctroArray || doctroArray.length === 0) {
            console.warn("No data available for export.");
            return;
          }
          const formattedData = doctroArray.map((data, index) => ({
            'Doctor Name': data?.full_name ?? "",
            'Doctor Arabic Name': data?.full_name_arabic ?? "",
            'Mobile Numner':data?.country_code + " - "+data?.mobile,
            'Email': data?.email ?? "",
            'Login At': data?.loginTime ?? ""
          }));
        
          const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
        
          ws['!cols'] = [
            { wch: 30 }, 
            { wch: 30 },
            { wch: 20 },
            { wch: 30 },
            { wch: 30 },
          ];
        
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          const fileName = `Online_Doctor_List.xlsx`;
        
          XLSX.utils.book_append_sheet(wb, ws, 'Online Doctor List');
        
          XLSX.writeFile(wb, fileName);
        
        } 
      }
    }
    )
  }

  
}
