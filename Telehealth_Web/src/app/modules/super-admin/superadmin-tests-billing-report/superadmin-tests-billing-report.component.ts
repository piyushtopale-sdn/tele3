import { DatePipe } from '@angular/common';
import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ChartData, ChartOptions } from 'chart.js';
import { CoreService } from 'src/app/shared/core.service';
import { SuperAdminService } from '../super-admin.service';
import { LabimagingdentalopticalService } from '../labimagingdentaloptical.service';
import { SuperAdminIndividualdoctorService } from '../super-admin-individualdoctor.service';
import { exit } from 'process';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-superadmin-tests-billing-report',
  templateUrl: './superadmin-tests-billing-report.component.html',
  styleUrls: ['./superadmin-tests-billing-report.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SuperadminTestsBillingReportComponent {
  @ViewChild("selectCenterType", { static: false }) selectCenterType: any;

  totalConsultationBooked: ChartData<'bar'>;
  totalOptions: ChartOptions<'bar'>;
  noDataAvailable: boolean = false;

  fromDate: string = "";
  toDate: string = "";
  dateRangeForm: FormGroup;
  totalActiveDoctor: any;
  totalLaboratory: any;
  totalOnlineDoctor: any;
  totalPatient: any;
  totalPharmacies: any;
  totalRadiology: any;
  startgraphDate: string;
  endgraphDate: string;
  // years: number[] = [];
  graphyear: number;
  // selectedYear: number;
  currentUrl: any = [];
  couponCodeDetails:any=''

  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  selectedMonth: string = this.months[new Date().getMonth()]; // Default to current month

  years: number[] = [];
  selectedYear: number = new Date().getFullYear(); // Default to current year

  centerList: any = [
    { label: 'January', id: 1 },
    { label: 'February', id: 2 },
    { label: 'March', id: 3 },
    { label: 'April', id: 4 },
    { label: 'May', id: 5 },
    { label: 'June', id: 6 },
  ];
  selectedCenterIddddd: any = '';
  selectedCenter: any = '';

  labRadioList: any = [];
  labRadioListDetails: any = [];
  totalRevenueOfCenter: number = 0
  mostTestPerformedByCenter: any = ''

  doctorsList: any = [];
  doctorsListDetails: any = [];
  mostTestPerformedCountDoctorLab: number = 0
  testNameLab: any = ""
  mostTestPerformedCountDoctorRadio: number = 0
  testNameRadio: any = ""

  labRadioTestsList: any = [];
  labRadioTestsListDetails: any = [];
  totalRevenuePerTest: Number = 0

  doctorTableColumns: string[] = ['testName', 'testCount'];
  centerTableColumns: string[] = ['testName', 'testCount'];

  // Data sources
  doctorTests = new MatTableDataSource([])
  centerTests = new MatTableDataSource([])

  mostUsedCenterDetailLab: any = '';
  mostUsedCenterDetailRadio: any = ''

  constructor(private fb: FormBuilder,
    private _coreService: CoreService,
    private router: Router,
    private modalService: NgbModal,
    private _superAdminService: SuperAdminService,
    private adminLabRadioService: LabimagingdentalopticalService,
    private adminDoctorService: SuperAdminIndividualdoctorService,
    private datepipe: DatePipe,
    private dateAdapter: DateAdapter<Date>
  ) {

    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl);

    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
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

  @ViewChild('doctorPaginator') doctorPaginator!: MatPaginator;
  @ViewChild('centerPaginator') centerPaginator!: MatPaginator;

  ngAfterViewInit() {
    this.doctorTests.paginator = this.doctorPaginator;
    this.centerTests.paginator = this.centerPaginator;
  }

  ngOnInit(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.dateRangeForm.patchValue({
      fromDate: firstDay,
      toDate: lastDay
    });

    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(lastDay);
    this.getgraphYear(this.years[0])
    this.dashboardCount();

    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl);

    this.getLabRadioList();
    this.getDoctorsList();
    this.getLabRadioTestsList();
    // this.eachTestPerformedCountByDoctor();
    this.mostUsedCenter();
  }

  //Doctors Selection Functionality

  getDoctorsList() {
    let param = {
      page: 1,
      limit: 0,
      status: "APPROVED",
      searchText: ""
    }
    this.adminDoctorService.doctorsList(param).subscribe((res: any) => {
      let encryptedData = { data: res };
      if (encryptedData?.data?.status) {
        this.doctorsListDetails = encryptedData?.data?.data?.data;
        this.doctorsListDetails?.map((doctor: any) => {
          this.doctorsList.push(
            {
              label: doctor?.full_name,
              value: doctor?.for_portal_user?._id
            }
          )
        })
      } else {
        this.doctorsList = []
      }
    })
  }

  frequentlyPerformedTestByDoctor(doctorId: any) {
    this.adminDoctorService.frequentlyPerformedTestByDoctor(doctorId).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let result = this._coreService.decryptObjectData(encryptedData);
        if (result?.status) {
          if (result?.body?.labTestIdCount) {
            this.mostTestPerformedCountDoctorLab = result?.body?.labTestIdCount?.count;
            this.testNameLab = result?.body?.labTestIdCount?.labtestName;
          }
          if (result?.body?.radioTestIdCount) {
            this.mostTestPerformedCountDoctorRadio = result?.body?.radioTestIdCount?.count;
            this.testNameRadio = result?.body?.radioTestIdCount?.radiologyTestName;
          }
        } else {
          this.totalRevenuePerTest = 0
          this._coreService.showInfo("", result.message);
        }
      },
      error: (err) => {
        this._coreService.showError("", err.error.message);
      },
    });

  }

  onDoctorSelectionChange(event: any) {
    if (event.value) {      
      const existingItem = this.doctorsListDetails.find((item: any) => {
        return item?.for_portal_user?._id === event.value
      });
      if (existingItem) {
        let doctorId = existingItem?.for_portal_user?._id
        this.frequentlyPerformedTestByDoctor(doctorId);
      }
    }
  }

  eachTestPerformedCountByDoctor(paramData: any) {
    let param = {
      doctorId: paramData?.doctorId,
      type: paramData?.type
    }
    this.adminDoctorService.getEachTestPerformedCountByDoctor(param).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let result = this._coreService.decryptObjectData(encryptedData);
        if (result?.status) {
          if (result?.body?.totalEachTestPerformedPerDoctor?.length > 0) {
            // this.doctorTests = result.body.totalEachTestPerformedPerDoctor;
            this.doctorTests = new MatTableDataSource(
              result.body.totalEachTestPerformedPerDoctor
            );
            this.doctorTests.paginator = this.doctorPaginator;
          }
        } else {
          this.doctorTests = new MatTableDataSource([])
          this._coreService.showInfo("", result.message);
        }
      },
      error: (err) => {
        this._coreService.showError("", err.error.message);
      },
    });
  }

  onDoctorSelectionChangeTestPerformedCount(event: any) {
    if (event.value) {      
      this.openVerticallyCenteredsecond(event.value);
      // const existingItem = this.doctorsListDetails.find((item: any) => {
      //   return item?.for_portal_user?._id === event.value
      // });
      // if (existingItem) {
      //   let param = {
      //     doctorId: existingItem?.for_portal_user?._id,
      //     type: "lab"
      //   }
      //   this.eachTestPerformedCountByDoctor(param);
      // }
    }
  }

  //Tests Selection Functionality

  getLabRadioTestsList() {
    this.adminLabRadioService.labRadioTestsList().subscribe((res: any) => {
      let encryptedData = { data: res };
      if (encryptedData?.data?.status) {
        this.labRadioTestsListDetails = encryptedData?.data?.body?.labRadioTests;
        this.labRadioTestsListDetails?.map((test: any) => {
          this.labRadioTestsList.push(
            {
              label: test?.testName,
              value: test?.type === 'lab' ? test?.labTestId : test?.radiologyTestId,
            }
          )
        })
      } else {
        this.labRadioTestsList = []
      }
    })
  }

  onTestSelectionChange(event: any) {
    if (event.value) {
      const existingItem = this.labRadioTestsListDetails.find((item: any) => {
        return item?.type === 'lab'
          ? item?.labTestId === event.value
          : item?.radiologyTestId === event.value;
      });
      if (existingItem) {
        const reqBody = {
          testId: existingItem.type === "lab" ? existingItem.labTestId : existingItem.radiologyTestId,
          type: existingItem.type,
        };
        this.getTotalRevenuePerTest(reqBody);
      }
    }
  }

  getTotalRevenuePerTest(reqBody: any) {
    let param = {
      testId: reqBody.testId,
      type: reqBody.type
    }
    this.adminDoctorService.totalRevenuePerTest(param).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let result = this._coreService.decryptObjectData(encryptedData);
        if (result?.status) {
          this.totalRevenuePerTest = result?.body?.totalRevenuePerTest
        } else {
          this.totalRevenuePerTest = 0
        }
      },
      error: (err) => {
        this._coreService.showInfo("", err.error.message);
      },
    });
  }

  eachTestPerformedCountByCenter(reqBody: any) {
    let param = {
      labRadiologyId: reqBody?.labRadiologyId,
      type: reqBody?.type
    }
    this.adminLabRadioService.getEachTestPerformedCountByCenter(param).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let result = this._coreService.decryptObjectData(encryptedData);
        if (result?.status) {
          // this.centerTests = result?.body?.totalEachTestPerformedPerCenter
          this.centerTests = new MatTableDataSource(
            result?.body?.totalEachTestPerformedPerCenter
          );
          this.centerTests.paginator = this.centerPaginator;
        } else {
          this.centerTests = new MatTableDataSource([])
          this._coreService.showInfo("", result?.message);
        }
      },
      error: (err) => {
        this._coreService.showError("", err.error.message);
      },
    });
  }

  onTestSelectionChangePeformedCountOfCenter(event: any) {
    if (event.value) {
      const existingItem = this.labRadioListDetails.find((item: any) => {
        return item?.for_portal_user?._id === event.value
      });
      if (existingItem) {
        const reqBody = {
          labRadiologyId: existingItem?.for_portal_user?._id,
          type: existingItem?.for_portal_user?.type,
        };
        this.eachTestPerformedCountByCenter(reqBody);
      }
    }
  }

  //Center Selection Functionality

  getLabRadioList() {
    let param = {
      page: 1,
      limit: 0,
      status: "APPROVED",
      searchText: ""
    }
    this.adminLabRadioService.laboratoryList(param).subscribe((res: any) => {
      let encryptedData = { data: res };
      if (encryptedData?.data?.status) {
        this.labRadioListDetails = encryptedData?.data?.data?.data;

        this.labRadioListDetails?.map((center: any) => {
          this.labRadioList.push(
            {
              label: center?.centre_name,
              value: center?.for_portal_user?._id
            }
          )
        })
      } else {
        this.labRadioList = []
        this.labRadioListDetails = []
      }
    })
  }

  getRevenuAndMostPerformedTestOfcenter(reqBody: any) {
    let param = {
      labRadioId: reqBody?.labRadioId,
      type: reqBody?.type
    }
    this.adminDoctorService.mostPerformedTestAndRevenueOfCenter(param).subscribe({
      next: (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.totalRevenueOfCenter = response.body.totalRevenuePerCenter
          this.mostTestPerformedByCenter = response.body.mostPerformedTestPerCenter[0]
        } else {
          this._coreService.showError("", response.message);
          this.totalRevenueOfCenter = 0;
          this.mostTestPerformedByCenter = ''
        }
      },
      error: (err) => {
        this._coreService.showError("", err.error.message);
      },
    });
  }

  onCenterSelectionChange(event: any) {
    if (event.value) {
      const existingItem = this.labRadioListDetails.find((item: any) => {
        return item?.for_portal_user?._id === event.value
      })
      if (existingItem) {
        let reqBody = {
          labRadioId: existingItem?.for_portal_user?._id,
          type: existingItem?.for_portal_user?.type
        }
        this.getRevenuAndMostPerformedTestOfcenter(reqBody)
      }
    }
  }

  mostUsedCenter() {
    this.adminLabRadioService.getMostUsedLabRadioCenter().subscribe({
      next: (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.mostUsedCenterDetailLab = response?.body?.mostUsedLabCenter;
          this.mostUsedCenterDetailRadio = response?.body?.mostUsedRadioCenter;
        } else {
          this.mostUsedCenterDetailLab = '';
          this.mostUsedCenterDetailRadio = ''
        }
      },
      error: (err) => {
        this._coreService.showError("", err.error.message);
      },
    });
  }

  dashboardCount() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate

    }
    // this._superAdminService.mainDashboardCount(data).subscribe((res: any) => {
    //   let encryptedData = { data: res };
    //   let response = this._coreService.decryptObjectData(encryptedData);
    //   if (response.status) {
    //     this.totalActiveDoctor = response?.body?.totalActiveDoctor
    //     this.totalLaboratory = response?.body?.totalLaboratory
    //     this.totalOnlineDoctor = response?.body?.totalOnlineDoctor
    //     this.totalPatient = response?.body?.totalPatient
    //     this.totalPharmacies = response?.body?.totalPharmacies
    //     this.totalRadiology = response?.body?.totalRadiology
    //   }

    // }
    // )
  }
  getgraphYear(year) {
    let startDate = year + "-01-01T18:30:00.000Z";
    let endDate = year + "-12-31T18:30:00.000Z";
    this.startgraphDate = this.formatDateNew(startDate);
    this.endgraphDate = this.formatDateNew(endDate);
    this.dashboardgrapgh();

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

  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'MM-dd-yyyy') || '';
  }

  dashboardgrapgh() {
    let data = {
      fromDate: this.startgraphDate,
      toDate: this.endgraphDate
    }
    this._superAdminService.mainDashboardgrapgh(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        let data = response?.body;
        let docConsult = data?.totalDoctorConsultation || 0;
        let pharmOrder = data?.totalPharmacyOrder || 0;
        let laborder = data?.totalLabConsultation || 0;
        let radioOrder = data?.totalRadiologyConsulation || 0;


        const consultationData = [docConsult, pharmOrder, laborder, radioOrder];

        // Check if all values are zero
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
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (tooltipItem) => ` ${tooltipItem.raw}`
              }
            }
          }
        }; // ensure it's at least 20

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
        }
      }

    }
    )
  }

  onNavigate(url: any): void {
    const menuitems = JSON.parse(localStorage.getItem("activeMenu"));
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
        this._superAdminService.setActiveMenu(matchedMenu.name);
      });
    } else {
      console.error("No matching menu found for URL:", this.currentUrl);
    }
  }

  openVerticallyCenteredsecond(id:any) {
    this.selectedCenterIddddd = id;
    this.modalService.open(this.selectCenterType, {
      centered: true,
      size: "md",
      windowClass: "selectCenterType",
    });   
  }  
  onSelectCenter(data:any){
    if(data){      
      this.modalService.dismissAll(); 
      const existingItem = this.doctorsListDetails.find((item: any) => {
        return item?.for_portal_user?._id ===  this.selectedCenterIddddd
      });
      if (existingItem) {
        let param = {
          doctorId: existingItem?.for_portal_user?._id,
          type: data
        }
        this.eachTestPerformedCountByDoctor(param);
      }
    }
  }
  onTestSelectionChangeForCoupon(event:any){
    if (event.value) {
      const existingItem = this.labRadioTestsListDetails.find((item: any) => {        
        return item?.type === 'lab'
          ? item?.labTestId === event.value
          : item?.radiologyTestId === event.value;
      });
      if (existingItem) {
        const reqBody = {
          testId: existingItem.type === "lab" ? existingItem.labTestId : existingItem.radiologyTestId,
          type: existingItem.type,
        };
        this.getlistofDiscountCodeUsedforEachTest(reqBody);
      }
    }
  }
  getlistofDiscountCodeUsedforEachTest(reqBody:any){   
      let param = {
        testId: reqBody.testId,
        type: reqBody.type
      }
      this.adminDoctorService.listofDiscountCodeUsedforEachTest(param).subscribe({
        next: (res) => {
          let encryptedData = { data: res };
          let result = this._coreService.decryptObjectData(encryptedData);
                  
          if (result?.status) {
            this.couponCodeDetails = result?.body?.couponCodeData[0]
          } else {
            this.couponCodeDetails = '';
          }
        },
        error: (err) => {
          this._coreService.showInfo("", err.error.message);
        },
      });
    
  }

}

