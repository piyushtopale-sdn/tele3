import { Component, ViewEncapsulation , ViewChild} from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { DateAdapter } from "@angular/material/core";
import { IndiviualDoctorService } from "../../individual-doctor/indiviual-doctor.service";
import { CoreService } from "src/app/shared/core.service";
import { SuperAdminService } from "../super-admin.service";
import { ChartData, ChartOptions } from "chart.js";
import * as XLSX from 'xlsx';
import { NgxUiLoaderService } from "ngx-ui-loader";
import { PatientService } from "../../patient/patient.service";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import { MatPaginator } from "@angular/material/paginator";

@Component({
  selector: "app-super-admin-subscriber-report",
  // standalone: true,
  // imports: [],
  templateUrl: "./super-admin-subscriber-report.component.html",
  styleUrls: ["./super-admin-subscriber-report.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class SuperAdminSubscriberReportComponent {
  totalRevenueWithCurrency: any;
  planList: any[] = [];
  totalRevenue: any = 0;
  revenuePlan: any[] = [];
  revenuePrice: any;
  pageSize: number = 100;
  page: any = 1;
  search_with_coupon: any = "";
  status: any = "";
  dataSource: any;
  couponList: any[] = [];
  totalConsultationBooked: ChartData<"bar">;
  totalOptions: ChartOptions<"bar">;
  revenueFormatted:any = 0;
  noDataAvailable: boolean = false;
  startgraphDate: string;
  endgraphDate: string;
  month: string = "";
  _canceledSubscription:any = []
  userList: any[] = [];
  selecteduser: string | null = null;
  overlay: false;
  displayedColumns: string[] = ["name", "email", "mobile"];
  discountData: any[] = [];
  paymentStatus: any[] = [];
  subscribersList: any[] = [];
  planNameList: any[] = [];
  subscribersExportList: any[] = [];
  activecancelledSubscription: any[] = [];
  planName : any;
  phoneNumbers : any[]=[];
  emails : any[]=[];
  discountCouponData: any[] = [];
  discount: any[] = [];
  startDate: any[] = [];
  amountPaid: any[] = [];
  currencyCode: any[] = [];
  mrnNumber: any[] = [];
  exportCouponData : any[] = [];
  months: { name: string; value: string }[] = [
    { name: "January", value: "1" },
    { name: "February", value: "2" },
    { name: "March", value: "3" },
    { name: "April", value: "4" },
    { name: "May", value: "5" },
    { name: "June", value: "6" },
    { name: "July", value: "7" },
    { name: "August", value: "8" },
    { name: "September", value: "9" },
    { name: "October", value: "10" },
    { name: "November", value: "11" },
    { name: "December", value: "12" },
  ];
  
  // Default selected month (current month)
  selected_month: string = this.months[new Date().getMonth()].value;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  years: number[] = [];
  selectedYear: number = new Date().getFullYear(); // Default to current year
  selectedYearDropdown: any;
  displayedData: any[];
  totalRevenueData: any;
  
  totalActiveSubscription: any;
  totalCancelSubscription: any;
  activeSubcriptionData: any;
  upcoimgPlanData: any;
  selectedcouponCode: string = "";
  currentPage = 1;
  itemsPerPage = 5;
  currentUrl:any =[];
  pieChartData: ChartData<'pie', number[], string | string[]>;

  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };
  paginationSize: number = 5;
  totalLength: number = 0;
  selectedPlan: any;
  dateRangeForm: FormGroup;
  fromDate: string = "";
  toDate: string = "";
  monthWiseData:any;
  monthWiseOptions:any;
  _activeSubcription:any []=[];
  _activeSubcriptionExport:any[] = [];
  constructor(  
    private patientService: IndiviualDoctorService,
    private _coreService: CoreService,
    private service: SuperAdminService,   
    private loader: NgxUiLoaderService,
    private patientservice: PatientService,
    private router:Router,
    private fb:FormBuilder,
    private datepipe: DatePipe
  ) { 

    this.yeardropdown();
    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });
  }

  ngOnInit() {
    this.dateRangeForm = this.fb.group({
      fromDate: [null], 
      toDate: [null]   
    });

    // this.fromDate = null;
    // this.toDate = null;

    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl);
    this.getAllSubscriberList();
    this.getDiscount();
    this.getAllPatientList();   
    this.allCount();
    // this.dashboardgrapgh();
    // this.dashboardgrapghpiechart();
    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl);
    this.exportListApi();
    // this.totalSubscriberList();
    // this.totalrevenueExport();
    // this.SubscribersDetails();
    // this.acticeInactivesubscriber();

  }



// getAllSubscriberList(): void {
//   let reqData = {
//     fromDate: "",
//     toDate: "",
//   };

//   this.patientService.getAllPatientSubscriber(reqData).subscribe(async (res) => {
//     let response = await this._coreService.decryptObjectData({ data: res });
//     if (response.status) {
//       console.log("inside if :",response?.data?.subscribersPerPlan)
//       this.planList = [];
//       const arr = response?.data?.subscribersPerPlan;

//       let totalRevenue = 0;
//       let totalSubscribers = 0;
//       let allSubscribers: string[] = [];
//       let allPlanNames: string[] = [];
//       let allPhoneNumbers: string[] = [];
//       let allEmails: string[] = [];
//       let allCoupons: string[] = [];
//       let allAmountsPaid: number[] = [];
//       let allCurrencyCodes: string[] = [];
//       let allStartDates: string[] = [];
//       let allMrnNumbers: string[] = [];
//       let allPaymentStatus: string[] = [];

//       Object.entries(arr).forEach(([key, value]) => {
//         // 🔹 Filter subscribers based on the selected date range
//         let filteredSubscribers = (value["subscribersNames"] || []).filter((_, index) => {
//           let subscriberDate = new Date(value["startDates"]?.[index]); 
//           let fromDate = new Date(this.fromDate);
//           let toDate = new Date(this.toDate);

//           return subscriberDate >= fromDate && subscriberDate <= toDate;
//         });

//         let filteredCount = filteredSubscribers.length;
//         let filteredRevenue = value["amountsPaid"]
//           ?.slice(0, filteredCount)
//           .reduce((acc, curr) => acc + curr, 0) || 0;

//         this.planList.push({
//           label: value["subscriptionPlanName"],
//           value: key,
//           subscribersCount: filteredCount,
//           totalRevenue: filteredRevenue,
//           totalRevenueFormatted: `${filteredRevenue.toLocaleString()}`,
//         });
//         totalRevenue += filteredRevenue;
//         totalSubscribers += filteredCount;


//         const subscribers = filteredSubscribers;
//         const planName = value["subscriptionPlanName"]; 

//         allSubscribers.push(...subscribers);
//         allPlanNames.push(...subscribers.map(() => planName));  
//         allPhoneNumbers.push(...(value["phoneNumbers"] || []).slice(0, filteredCount));
//         allEmails.push(...(value["emails"] || []).slice(0, filteredCount));
//         allCoupons.push(...(value["coupons"] || []).slice(0, filteredCount));
//         allAmountsPaid.push(...(value["amountsPaid"] || []).slice(0, filteredCount));
//         const currencies = value["currencyCodes"] || [];
//         allCurrencyCodes.push(...subscribers.map((_, index) => currencies[index] || "N/A"));
//         allStartDates.push(...(value["startDates"] || []).slice(0, filteredCount).map(date => date.split('T')[0]));
//         allMrnNumbers.push(...(value["mrnNumbers"] || []).slice(0, filteredCount));
//         allPaymentStatus.push(...(value["paymentStatus"] || []).slice(0, filteredCount));
//       });

//       this.planList.unshift({
//         label: "All Plans",
//         value: "all",
//         subscribersCount: totalSubscribers,
//         totalRevenue: totalRevenue,
//         totalRevenueFormatted: `SAR ${totalRevenue.toLocaleString()}`,
//       });

//       // 🔹 Ensure selected plan dynamically updates with new date range
//       if (this.selectedPlan === "all") {
//         this.totalRevenue = totalSubscribers;
//         this.revenuePrice = totalRevenue;
//         this.revenueFormatted = `SAR ${totalRevenue.toLocaleString()}`;
//         this.subscribersList = allSubscribers;
//         this.planNameList = allPlanNames;
//         this.planName = "All Plans";
//         this.phoneNumbers = allPhoneNumbers;
//         this.emails = allEmails;
//         this.discount = allCoupons;
//         this.amountPaid = allAmountsPaid;
//         this.currencyCode = allCurrencyCodes;
//         this.startDate = allStartDates;
//         this.mrnNumber = allMrnNumbers;
//         this.paymentStatus = allPaymentStatus;
//       } else {
        
//         // 🔹 Update UI based on the selected plan but still filter by date
//         const selectedPlanData = this.planList.find(plan => plan.value === this.selectedPlan);

//         if (selectedPlanData) {
//           this.revenuePrice = selectedPlanData.totalRevenue || 0;
//           this.revenueFormatted = selectedPlanData.totalRevenueFormatted || 0;
//           this.subscribersList = allSubscribers.filter((_, index) => allPlanNames[index] === selectedPlanData.label);
//           this.planNameList = this.subscribersList.map(() => selectedPlanData.label || "N/A");
//           this.planName = selectedPlanData.label || "";
//           this.phoneNumbers = allPhoneNumbers.filter((_, index) => allPlanNames[index] === selectedPlanData.label);
//           this.emails = allEmails.filter((_, index) => allPlanNames[index] === selectedPlanData.label);
//           this.discount = allCoupons.filter((_, index) => allPlanNames[index] === selectedPlanData.label);
//           this.amountPaid = allAmountsPaid.filter((_, index) => allPlanNames[index] === selectedPlanData.label);
//           this.currencyCode = allCurrencyCodes.filter((_, index) => allPlanNames[index] === selectedPlanData.label);
//           this.startDate = allStartDates.filter((_, index) => allPlanNames[index] === selectedPlanData.label);
//           this.mrnNumber = allMrnNumbers.filter((_, index) => allPlanNames[index] === selectedPlanData.label);
//           this.paymentStatus = allPaymentStatus.filter((_, index) => allPlanNames[index] === selectedPlanData.label);
//           this.totalRevenue = selectedPlanData.subscribersCount || 0;;
        
//         }
//       }


      
//     }
//   });
// }

getAllSubscriberList(): void {
  let reqData = {
    fromDate: this.dateRangeForm.value.fromDate || "",
    toDate: this.dateRangeForm.value.toDate || "",
  };
 
  this.patientService.getAllPatientSubscriber(reqData).subscribe(async (res) => {
    let response = await this._coreService.decryptObjectData({ data: res });
    if (response.status) {
      
      const arr = response?.data?.subscribersPerPlan;
      let totalRevenue = 0;
      let totalSubscribers = 0;
      
      let fromDate = reqData.fromDate ? new Date(reqData.fromDate) : null;
      let toDate = reqData.toDate ? new Date(reqData.toDate) : null;
      
      this.planList = Object.entries(arr).map(([key, value]) => {
        let filteredSubscribers = (value["subscribersNames"] || []).filter((_, index) => {
          let subscriberDate = new Date(value["startDates"]?.[index]);
          return fromDate && toDate ? subscriberDate >= fromDate && subscriberDate <= toDate : true;
        });

        let filteredCount = filteredSubscribers.length;
        let filteredRevenue = (value["amountsPaid"] || []).slice(0, filteredCount).reduce((acc, curr) => acc + curr, 0) || 0;
        
        totalRevenue += filteredRevenue;
        totalSubscribers += filteredCount;
        
        return {
          label: value["subscriptionPlanName"],
          value: key,
          subscribersCount: filteredCount,
          totalRevenue: filteredRevenue,
          totalRevenueFormatted: `${filteredRevenue.toLocaleString()}`,
        };
      });
      
      this.planList.unshift({
        label: "All Plans",
        value: "all",
        subscribersCount: totalSubscribers,
        totalRevenue: totalRevenue,
        totalRevenueFormatted: `SAR ${totalRevenue.toLocaleString()}`,
      });
      
      const updateSubscriberData = (selectedPlanLabel: string | null) => {
        this.subscribersList = [];
        this.planNameList = [];
        this.phoneNumbers = [];
        this.emails = [];
        this.discount = [];
        this.amountPaid = [];
        this.currencyCode = [];
        this.startDate = [];
        this.mrnNumber = [];
        this.paymentStatus = [];

        Object.entries(arr).forEach(([key, value]) => {
          if (!selectedPlanLabel || value["subscriptionPlanName"] === selectedPlanLabel) {
            let filteredSubscribers = (value["subscribersNames"] || []).filter((_, index) => {
              let subscriberDate = new Date(value["startDates"]?.[index]);
              return fromDate && toDate ? subscriberDate >= fromDate && subscriberDate <= toDate : true;
            });
            
            this.subscribersList.push(...filteredSubscribers);
            this.planNameList.push(...filteredSubscribers.map(() => value["subscriptionPlanName"]));
            this.phoneNumbers.push(...(value["phoneNumbers"] || []).slice(0, filteredSubscribers.length));
            this.emails.push(...(value["emails"] || []).slice(0, filteredSubscribers.length));
            this.discount.push(...(value["coupons"] || []).slice(0, filteredSubscribers.length));
            this.amountPaid.push(...(value["amountsPaid"] || []).slice(0, filteredSubscribers.length));
            this.currencyCode.push(...(value["currencyCodes"] || []).slice(0, filteredSubscribers.length));
            this.startDate.push(...(value["startDates"] || []).slice(0, filteredSubscribers.length).map(date => date.split('T')[0]));
            this.mrnNumber.push(...(value["mrnNumbers"] || []).slice(0, filteredSubscribers.length));
            this.paymentStatus.push(...(value["paymentStatus"] || []).slice(0, filteredSubscribers.length));
          }
        });
      };
      
      if (this.selectedPlan === "all") {
        this.revenuePrice = totalRevenue;
        this.revenueFormatted = `SAR ${totalRevenue.toLocaleString()}`;
        this.totalRevenue = totalSubscribers;
        updateSubscriberData(null);
      } else {
        const selectedPlanData = this.planList.find(plan => plan.value === this.selectedPlan);
        if (selectedPlanData) {
          this.revenuePrice = selectedPlanData.totalRevenue || 0;
          this.revenueFormatted = selectedPlanData.totalRevenueFormatted || 0;
          this.totalRevenue = selectedPlanData.subscribersCount || 0;
          updateSubscriberData(selectedPlanData.label);
          this.planName = selectedPlanData.label || "";
        }
      }
    }
  });
}






  exportToExcelSubscribers() {
    if (this.subscribersList.length === 0) {
      return;
    }
  
    const replaceNA = (value: any) => (value === "N/A" ? "" : value);
  
    const formattedData = this.subscribersList.map((name, index) => ({
      'Full Name': replaceNA(name),
      'Plan Name': replaceNA(this.planNameList[index]), // Now correctly mapped
      'Email': replaceNA(this.emails[index]),
      'MRN Number': replaceNA(this.mrnNumber[index]),
      'Phone Number': replaceNA(this.phoneNumbers[index]),
      'Coupon Code': replaceNA(this.discount[index]),
      'Start Date': replaceNA(this.startDate[index]),
      'Currency Code': replaceNA(this.currencyCode[index]),
      'Amount Paid': replaceNA(this.amountPaid[index]),
      'Payment Status': replaceNA(this.paymentStatus[index]) || "Unpaid",
    }));
    
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    ws['!cols'] = [{ wch: 20 }, { wch: 20 }];
  
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `${this.planName}.xlsx`;
  
    XLSX.utils.book_append_sheet(wb, ws, 'Subscribers List');
    XLSX.writeFile(wb, fileName);
  }
  
  


  onSelect2Change(event: any,) {
    if (!event || !event.options || event.options.length === 0) {  
      this.selectedPlan = '';
      this.totalRevenue = 0;
      this.getAllSubscriberList();
      return;
    }  

    this.selectedPlan = event.value;

    if (this.selectedPlan === "all") {
  
        this.totalRevenue = this.planList.reduce((acc, plan) => acc + (plan.value !== "all" ? plan.subscribersCount : 0), 0);
      
        this.revenuePrice = this.totalRevenue;
        this.revenuePrice = this.planList.reduce((acc, plan) => acc + (plan.value !== "all" ? plan.totalRevenue : 0), 0);
   
        this.planName = "All Plans";
        this.subscribersList = [];
        this.phoneNumbers = [];
        this.emails = [];
        this.discount = [];
        this.amountPaid = [];
        this.currencyCode = [];
        this.startDate = [];
        this.mrnNumber = [];
        this.paymentStatus = [];
    } else {
        this.totalRevenue = event.options[0].subscribersCount;
        this.revenuePrice = this.planList.find(plan => plan.value === this.selectedPlan)?.totalRevenue || 0;
        this.revenueFormatted = this.planList.find(plan => plan.value === this.selectedPlan)?.totalRevenueFormatted || "SAR 0";
    }

    this.getAllSubscriberList();
}

  
  yeardropdown() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 4; i--) {
      this.years.push(i);
    }

    this.selectedYear = currentYear;
  }

  getgraphYear(year) {
    this.selectedYear = year;
    this.dashboardgrapgh();
  }



  dashboardgrapgh() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
  
    this.service.reportdashboardgrapgh(data).subscribe((res: any) => {
      let encryptedData = { data: res };
  
      let response = this._coreService.decryptObjectData(encryptedData);
  
      if (response.status) {
        let data = response?.data;
  
        // Extract month-wise data for the chart
        const monthWiseResult = data[0]?.monthWiseResult || [];
  
        // Prepare data for the month-wise bar chart
        // const monthLabels = monthWiseResult.map(
        //   (item) => `${item.month}/${item.year}` // Format as "MM/YYYY"
        // );
       
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        
        const monthLabels = monthWiseResult.map(
          (item) => `${monthNames[item.month - 1]} ${item.year}` // Format as "Month Year"
        );
        
        const monthCounts = monthWiseResult.map((item) => item.count);
  
        this.noDataAvailable = monthCounts.every((value) => value === 0);
  
        const maxYValue = Math.ceil(Math.max(...monthCounts) / 20) * 20;
  
        this.monthWiseOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: maxYValue,
              ticks: {
                stepSize: 10,
                color: "#555",
              },
            },
            x: {
              ticks: {
                color: "#555",
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (tooltipItem) => `${tooltipItem.raw}`,
              },
            },
          },
        };
  
        this.monthWiseData = {
          labels: monthLabels, // Dynamic labels for months
          datasets: [
            {
              label: "Subscriptions per Month",
              data: monthCounts, // Dynamic data based on counts
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40",
              ].slice(0, monthLabels.length), // Adjust colors based on the number of months
              hoverBackgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40",
              ].slice(0, monthLabels.length),
              maxBarThickness: 50, // Reduce the bar thickness
            },
          ],
        };
      }
    });
  }
  

  dashboardgrapghpiechart() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
    this.service.reportdashboardgrapgh(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        let data = response?.data;
        let active =0;
        let cancelled = 0;
        data[0]?.percentages?.map((item:any)=>{
          if(item.status === 'Active'){
            active = item.percentage
          }else{
            cancelled = item.percentage
          }
        })

        const consultationData = [
          active,
          cancelled,
        ];

        // Check if all values are zero
        this.noDataAvailable = consultationData.every((value) => value === 0);

        this.pieChartData = {
          labels: ['Active', 'Cancelled'],
          datasets: [
            {
              data: [active, cancelled], // Example data
              backgroundColor: [
                'rgba(102, 153, 204, 0.8)', // Soft Blue                
                'rgba(255, 204, 102, 0.8)'  // Soft Yellow-Orange
              ],
              hoverBackgroundColor: [
                'rgba(102, 153, 204, 0.8)', // Match Soft Blue               
                'rgba(255, 204, 102, 0.8)'  // Match Soft Yellow-Orange
              ],
              borderColor: [
                'rgba(102, 153, 204, 1)', // Border Soft Blue               
                'rgba(255, 204, 102, 1)'  // Border Soft Yellow-Orange
              ],
              borderWidth: 1,
            },
          ],
        };
      }
    });
  }


  getDiscount() {
    this.service.getDiscount(this.page,this.pageSize,this.search_with_coupon,this.status).subscribe((res) => {
        let response = this._coreService.decryptObjectData({ data: res });        
        if (response.status) {
          let allDisscountPlans = response.body?.result;
          this.dataSource = allDisscountPlans;
          this.couponList = [];
          this.dataSource.map((curentval: any) => {
            this.couponList.push({
              label: curentval?.couponCode,
              value: curentval?.couponCode,
            });
          });
        }
    });
  }

  getAllsubscriberDiscountUsedReport(): void {
    this.loader.start()
    let reqData = {
      page: this.page,
      limit: this.paginationSize,
      selectedCouponCode: this.selectedcouponCode || null
    };
    this.patientService.getAllsubscriberDiscountUsedReport(reqData) .subscribe(async (res) => {
      let response = await this._coreService.decryptObjectData({ data: res });  
      this.loader.stop()
      if(response.status){
        this.discountCouponData = response?.data[0]?.patients || [];
        this.totalLength = response?.totalCount || 0;
      }
  });
  } 

  onCouponChange(event: any) {
    if (!event?.value || event.value.trim() === '') {
      return; 
    }
  
    this.selectedcouponCode = event.value.trim();
    
    this.getAllsubscriberDiscountUsedReport();
    this.exportfilteredCouponData()
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }
  

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  allCount() {
    this.service.revenueCount().subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.totalRevenueWithCurrency =
          response?.data?.totalRevenueWithCurrency;
        this.totalActiveSubscription = response?.data?.totalActiveSubscription;
        this.totalCancelSubscription = response?.data?.totalCancelSubscription;
      }
    });
  }

  getAllPatientList(): void {
    let reqData = {
      page: 1,
      limit: 0,
    };
    this.patientService
      .getAllPatientListForAdminDashboard(reqData)
      .subscribe(async (res) => {
        let response = await this._coreService.decryptObjectData({ data: res });        
        if (response.status) {
          this.userList = [];
          const arr = response?.body?.data;
          arr.map((curentval: any) => {
            this.userList.push({
              label : curentval?.full_name + (curentval?.mrn_number ? ` (${curentval.mrn_number})` : ''),
              value: curentval?.portalUserId,
            });
          });
        }
      });
  }

  clearSelect2(type:any) {   
    if(type === 'patient'){
      this.selecteduser = null;
      this.getAllPatientList();
      this.getAllsubscriberDiscountUsedReport();
      this.activeSubcriptionData = "";
      this.totalLength = 0 ;
    }

    if(type === 'coupon-code'){
      this.selectedcouponCode = "";
      this.getAllsubscriberDiscountUsedReport();
    }

    if(type === 'plan'){
      this.selectedPlan = ''
      this.totalRevenue = 0;
      this.revenuePrice = 0;
      this.getAllSubscriberList();
    }
  }
  clearDate() {
    this.dateRangeForm.patchValue({
      fromDate: null,
      toDate: null
    });
    this.revenueFormatted= 0;
    this.totalRevenue = 0;
    this.pieChartData = null;
    this.monthWiseData = null;
  this.monthWiseOptions = null;
    // this.getAllSubscriberList(); // Refresh the data after clearing
  }
  
  onSelect2ChangePatient(event: any): void {
    this.selecteduser = event.value;

    if (this.selecteduser) {
      this.getAllDetails(this.selecteduser);
    }
  }

  getAllDetails(id) {
    this.loader.start();
    let params = {
      patient_id: id,
      doctor_id: "",
    };
    this.patientservice.profileDetails(params).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      this.loader.stop();
      if (response.status) {
        this.activeSubcriptionData = response?.body?.subscriptionDetails;
        let upcomingPlan =
          response?.body?.subscriptionDetails?.nextBillingPlanId;
        if (upcomingPlan) {
          this.getUpcomingPlan(upcomingPlan);
        }
      }
    });
  }

  getUpcomingPlan(id: any) {
    let params = {
      id: id,
    };
    this.loader.start();
    this.service.getPlanDetails(params).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        this.loader.stop();

        if (response.status) {
          this.upcoimgPlanData = response?.body;
        }
      },
      (err) => {
        let errResponse = this._coreService.decryptObjectData({
          data: err.error,
        });
        this.loader.stop();
      }
    );
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) {
      return; // Prevent unnecessary API calls
    }
    this.currentPage = page;
    this.updateDisplayedData();
    this.getAllsubscriberDiscountUsedReport();
  }


  updateDisplayedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedData = this.discountCouponData.slice(startIndex, endIndex);  
  }

  get totalPages() {
    let page;    
    page = Math.ceil(this.discountCouponData.length / this.itemsPerPage);     
    return page;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  updateGraphDate(year: number, month: string) {
    // Find the month object where the value matches the selected month
    const monthObj = this.months.find((m) => m.value === month);
  
    if (!monthObj) {
      console.error("Invalid month value:", month);
      return;
    }
  
    // Convert month value to two-digit format (e.g., "01", "02", etc.)
    const monthStr = monthObj.value.padStart(2, '0');
  
    // Set start and end dates based on selected month and year
    const startDate = `${year}-${monthStr}-01T00:00:00.000Z`;
    const endDate = new Date(year, parseInt(monthObj.value), 0).toISOString(); // Last day of the month
  
    this.startgraphDate = this.formatDateNew(startDate);
    this.endgraphDate = this.formatDateNew(endDate);
  
    this.dashboardgrapghpiechart();
  }
  
  formatDateNew(dateStr: string): string {
    const date = new Date(dateStr);
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0"); // getUTCMonth() returns 0-11
    const day = date.getUTCDate().toString().padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${month}-${day}-${year}`;
  }
  onMonthChange(month: string) {
    this.selected_month = month;
    this.updateGraphDate(this.selectedYear, month);
  }

  exportfilteredCouponData(){
    let reqData = {
      page: 1,
      limit: this.pageSize,
      selectedCouponCode: this.selectedcouponCode || null
    };
    this.patientService.getAllsubscriberDiscountUsedReport(reqData) .subscribe(async (res) => {
      let response = await this._coreService.decryptObjectData({ data: res });  
      if(response.status){
        this.exportCouponData = response?.data[0]?.patients || [];
        this.totalLength = response?.totalCount || 0;
      }
  });
  }

  exportToExcel() {
    const formattedData = this.exportCouponData.map(item => ({
      'Full Name': this.cleanValue(item.full_name),
      'Full Name Arabic': this.cleanValue(item.full_name_arabic),
      'Plan Name': this.cleanValue(item.plan_name),
      'Email': this.cleanValue(item.email),
      "Start Date": this.cleanValue(item.period?.start_date),
      "End Date": this.cleanValue(item.period?.end_date),
      "Start Time": this.cleanValue(item.start_time),
      "End Time": this.cleanValue(item.end_time),
      'Mobile': this.cleanValue(`${item.country_code || ''}${item.mobile ? '-' + item.mobile : ''}`), // Merged Country Code & Mobile
      'MRN': this.cleanValue(item.mrn_number),
      'Plan Price': this.cleanValue(item.planPrice),
      'Amount Discounted': item.discounted_amount ?? 'N/A',
      'Amount Paid': this.cleanValue(item.amountPaid)
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
  
    ws['!cols'] = [
      { wch: 20 }, // Full Name
      { wch: 25 }, // Full Name Arabic
      { wch: 30 }, // Email
      { wch: 15 }, // Country Code
      { wch: 15 }  // Mobile
    ];
  
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Coupon_${this.selectedcouponCode}.xlsx`;
  
    XLSX.utils.book_append_sheet(wb, ws, 'Discount Coupons');
  
    XLSX.writeFile(wb, fileName);
  }
  cleanValue(value: any): string {
    if (value === undefined || value === null || value === "undefined undefined" || value === "N/A") {
        return "";
    }
    return value;
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
        this.service.setActiveMenu(matchedMenu.name);
      });
    } else {
      console.error("No matching menu found for URL:", this.currentUrl);
    }
  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'MM-dd-yyyy') || '';
  }
  
  onDateChange(type: string, event: Date): void {
    if (type === 'from') {
      this.dateRangeForm.get('fromDate')?.setValue(event);
    } else if (type === 'to') {
      this.dateRangeForm.get('toDate')?.setValue(event);
    }

    const fromDate = this.dateRangeForm.get('fromDate')?.value;
    const toDate = this.dateRangeForm.get('toDate')?.value;
    if (!fromDate || !toDate) {
      return;
    }

    this.fromDate = this.formatDate(fromDate);
    this.toDate = this.formatDate(toDate);
  
      this.dashboardgrapgh();
      this.dashboardgrapghpiechart();
      this.acticeInactivesubscriber();
      this.SubscribersDetails();
      this.getAllSubscriberList();
      
    
  }

  exportListApi() {
    this.service.exportActive_cancel_revenList().subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);    
        
      if (response.status) {
        this._canceledSubscription = response?.data?.__cancelSubscriptionList;
        this._activeSubcriptionExport = response?.data?.__activeSubscriptionList;
      }
    });
  }


  exportActiveSubscription() {
    

      const formattedData = this._activeSubcriptionExport.map(item => ({
        'Full Name': item.first_name+" "+ item.last_name,
        'Full Name Arabic': item.full_name_arabic ?? "", 
        'MRN': item.mrn_number ?? "",
        'Plan Name': item.subscriptionDetails?.plan_name ?? "",
        'Plan Name Arabic': item.subscriptionDetails?.plan_name_arabic ?? "",
        'Plan Price': item.subscriptionDetails?.plan_price ?? "",
        "Start Date":item.subscriptionDetails?.startDate ?? "",
        "End Date":item.subscriptionDetails?.endDate ?? "",
      "Amount Paid": item.subscriptionDetails?.amountPaid,
       
  
      }));
    
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    
      ws['!cols'] = [
        { wch: 20 }, // Full Name
        { wch: 25 }, // Full Name Arabic
        { wch: 30 }, // Email
        { wch: 15 }, // Country Code
        { wch: 15 }  // Mobile
      ];
    
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      const fileName = `Total Active Subcription List.xlsx`;
    
      XLSX.utils.book_append_sheet(wb, ws, 'Total Active Subcription List');
    
      XLSX.writeFile(wb, fileName);
    
    
  }


  exportcancelSubscription() {
    const formattedData = this._canceledSubscription.map(item => ({
      'Full Name': item.first_name+" "+ item.last_name,
      'Full Name Arabic': item.full_name_arabic ?? "", 
      'MRN': item.mrn_number ?? "",
      'Plan Name': item.subscriptionDetails?.plan_name ?? "",
      'Plan Name Arabic': item.subscriptionDetails?.plan_name_arabic ?? "",
      'Plan Price': item.subscriptionDetails?.plan_price ?? "",
      "Start Date":item.subscriptionDetails?.startDate ?? "",
      "End Date":item.subscriptionDetails?.endDate ?? "",
      "Amount Paid": item.subscriptionDetails?.amountPaid,

    }));
  
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
  
    ws['!cols'] = [
      { wch: 20 }, // Full Name
      { wch: 25 }, // Full Name Arabic
      { wch: 30 }, // Email
      { wch: 15 }, // Country Code
      { wch: 15 }  // Mobile
    ];
  
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Total Cancel Subcription List.xlsx`;
  
    XLSX.utils.book_append_sheet(wb, ws, 'Total Cancel Subcription List');
  
    XLSX.writeFile(wb, fileName);
  }
  

  // totalSubscriberList(){
  //   let reqData ={
  //     fromDate: this.fromDate,
  //     toDate: this.toDate
  //   }
  //   this.service.exportTotalSubscriberReport(reqData).subscribe((res: any) => {
  //     let encryptedData = { data: res };
  //     let response = this._coreService.decryptObjectData(encryptedData);
      
  //     if (response.status) {
  //     //  this._activeSubcription = response?.data?.__activeSubscriptionList;
    
  //     }
  //   });
  // }

  totalrevenueExport() {
    this.service.totalRevenueExport().subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData); 
           
      if (response.status) {
       this.totalRevenueData = response?.data?.__activeSubscriptionList;
      }
    });
  }

  exportTotalrevenueExport() {
    const formattedData = this.totalRevenueData.map(item => ({
      'Full Name': item.first_name+" "+ item.last_name,
      'Full Name Arabic': item.full_name_arabic ?? "", 
      'MRN': item.mrn_number ?? "",
      'Plan Name': item.subscriptionDetails?.plan_name ?? "",
      'Plan Name Arabic': item.subscriptionDetails?.plan_name_arabic ?? "",
      'Plan Price': item.subscriptionDetails?.plan_price ?? "",
      "Start Date":item.subscriptionDetails?.startDate ?? "",
      "End Date":item.subscriptionDetails?.endDate ?? "",
      "Amount Paid": item.subscriptionDetails?.amountPaid,

    }));
  
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
  
    ws['!cols'] = [
      { wch: 20 }, 
      { wch: 25 }, 
      { wch: 30 }, 
      { wch: 15 }, 
      { wch: 15 }  
    ];
  
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const fileName = `Total Cancel Subcription List.xlsx`;
  
    XLSX.utils.book_append_sheet(wb, ws, 'Total Cancel Subcription List');
  
    XLSX.writeFile(wb, fileName);
  }


  SubscribersDetails() {
    let data = {
      fromDate: this.fromDate || "",
      toDate: this.toDate || "",
    };
  
    this.service.getSubscribersDetails(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
  
      if (response.status) {
        const patientsDetails = response?.data?.patientsDetails || [];
        const transactionsDetails = response?.data?.subscriptionTransactionsDetails || [];
  
        this.subscribersExportList = transactionsDetails.map((transaction) => {
          const patient = patientsDetails.find(
            (p) =>
              String(p?.portalUser?.subscriptionDetails?.subscriptionPlanId) ===
              String(transaction.subscriptionPlanId)
          );
  
          return {
            'First Name': patient?.first_name ?? '',
            'Full Name Arabic': patient?.full_name_arabic ?? '',
            'Last Name': patient?.last_name ?? '',
            'MRN Number': patient?.mrn_number ?? '',
            'Plan Name': patient?.plan_name ?? '',
            'Status': patient?.portalUser?.subscriptionDetails?.isPlanActive ? 'Active' : 'Cancelled',
            'Subscription Plan ID': transaction?.subscriptionPlanId ?? '',
            'Amount Paid': transaction?.amountPaid ?? '',
            'Invoice ID': transaction?.invoiceId ?? 'N/A',
            'Period Start': transaction?.period?.start ?? '',
            'Period End': transaction?.period?.end ?? '',
            'Plan Price': transaction?.planPrice ?? '',
            'Status (Transaction)': transaction?.status ?? '',
            'Subscription Status': transaction?.subscriptionStatus ?? '',
          };
        }).filter(item => item['Subscription Plan ID']); 
      }
    });
  }
  
  
  

  acticeInactivesubscriber() {
    let data = {
      fromDate: this.fromDate || "",
      toDate: this.toDate || "",
    }
    
    this.service.getActiveCancelledSubscriptions(data).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        const activePatients = response?.data?.activePatients ?? [];
        const cancelledPatients = response?.data?.cancelledPatients ?? [];

        this.activecancelledSubscription = [
          ...activePatients.map(patient => ({
            first_name: patient?.first_name ?? "",
            last_name: patient?.last_name ?? "",
            status: 'Active',
            subscriptionPlanId: patient?.portalUser?.subscriptionDetails?.subscriptionPlanId ?? ""
          })),
          ...cancelledPatients.map(patient => ({
            first_name: patient?.first_name ?? "",
            last_name: patient?.last_name ?? "",
            status: 'Cancelled',
            subscriptionPlanId: patient?.portalUser?.subscriptionDetails?.subscriptionPlanId ?? ""
          }))
        ];
      }
    }
    )
  }

  // exportSusbscriberList() {
  //   if (!this.subscribersExportList || this.subscribersExportList.length === 0) {
  //     console.error('No data available to export');
  //     return;
  //   }

  //   const formattedData = this.subscribersExportList.map((data) => ({
  //     'First Name': data['First Name'] || '',
  //     'Full Name Arabic': data['Full Name Arabic'] || '',
  //     'Last Name': data['Last Name'] || '',
  //     'MRN Number': data['MRN Number'] || 'N/A', 
  //     'Plan Name': data['Plan Name'] || '',
  //     'Status': data['Status'] || '',
  //     'Subscription Plan ID': data['Subscription Plan ID'] || '',
  //     'Amount Paid': data['Amount Paid'] || '',
  //     'Invoice ID': data['Invoice ID'] || 'N/A',
  //     'Period Start': data['Period Start'] ? new Date(data['Period Start']).toLocaleString('en-GB') : '',
  //     'Period End': data['Period End'] ? new Date(data['Period End']).toLocaleString('en-GB') : '',
  //     'Plan Price': data['Plan Price'] || '',
  //     'Status (Transaction)': data['Status (Transaction)'] || '',
  //     'Subscription Status': data['Subscription Status'] || '',
  //   }));
  
  //   const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
  //   ws['!cols'] = [
  //     { wch: 20 }, 
  //     { wch: 25 }, 
  //     { wch: 20 }, 
  //     { wch: 15 }, 
  //     { wch: 20 }, 
  //     { wch: 15 }, 
  //     { wch: 25 }, 
  //     { wch: 15 }, 
  //     { wch: 20 }, 
  //     { wch: 25 }, 
  //     { wch: 25 }, 
  //     { wch: 15 }, 
  //     { wch: 20 }, 
  //     { wch: 20 }, 
  //   ];
  //   const wb: XLSX.WorkBook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, 'Patient Subscription Data');

  //   const fileName = `Patient_Subscription_Data.xlsx`;
  //   XLSX.writeFile(wb, fileName);
  // }
  exportSusbscriberList() {
    if (!this.subscribersExportList || this.subscribersExportList.length === 0) {
        console.error('No data available to export');
        return;
    }

    // Remove duplicate entries based on date and time (ignoring milliseconds)
    const uniqueData = [];
    const seen = new Set();

    this.subscribersExportList.forEach((data) => {
        const periodStartRaw = data['Period Start'] ? new Date(data['Period Start']) : null;
        const periodEndRaw = data['Period End'] ? new Date(data['Period End']) : null;

        // Format the dates to strings
        const periodStart = periodStartRaw ? periodStartRaw.toLocaleString('en-GB') : '';
        const periodEnd = periodEndRaw ? periodEndRaw.toLocaleString('en-GB') : '';
        const uniqueKey = `${data['First Name']}_${data['Last Name']}_${periodStart}_${periodEnd}`;

        if (!seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            uniqueData.push({
                'First Name': data['First Name'] || '',
                'Last Name': data['Last Name'] || '',
                'Full Name Arabic': data['Full Name Arabic'] || '',
                'MRN Number': data['MRN Number'] || 'N/A',
                'Plan Name': data['Plan Name'] || '',
                'Status': data['Status'] || '',
                'Subscription Plan ID': data['Subscription Plan ID'] || '',
                'Amount Paid': data['Amount Paid'] || '',
                'Invoice ID': data['Invoice ID'] || 'N/A',
                'Period Start': periodStart,
                'Period End': periodEnd,
                'Plan Price': data['Plan Price'] || '',
                'Status (Transaction)': data['Status (Transaction)'] || '',
                'Subscription Status': data['Subscription Status'] || '',
                '_periodStartRaw': periodStartRaw,
            });
        }
    });

    uniqueData.sort((a, b) => {
        if (!a._periodStartRaw || !b._periodStartRaw) return 0;
        return a._periodStartRaw - b._periodStartRaw;
    });

    uniqueData.forEach(item => delete item._periodStartRaw);

    const ws = XLSX.utils.json_to_sheet(uniqueData);
    ws['!cols'] = [
        { wch: 20 },
        { wch: 25 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 25 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Patient Subscription Data');

    const fileName = `Patient_Subscription_Data.xlsx`;
    XLSX.writeFile(wb, fileName);
}


handlePageEvent(data: any) {
  this.page = data.pageIndex + 1;
  this.paginationSize = data.pageSize;
  this.getAllsubscriberDiscountUsedReport();
}
  
  

  exportActiveCancelledSubscription() {
    if (this.activecancelledSubscription.length === 0) {
      return;
    }
  
    const formattedData = this.activecancelledSubscription.map(data => ({
      'First Name': data.first_name,
      'Last Name': data.last_name,
      'Status': data.status,
      'Subscription Plan ID': data.subscriptionPlanId
    }));
  
    const ws = XLSX.utils.json_to_sheet(formattedData);
    ws['!cols'] = [
      { wch: 20 }, 
      { wch: 20 }, 
      { wch: 15 }, 
      { wch: 30 }  
    ];
  
    const wb = XLSX.utils.book_new();
    const fileName = `Patient List.xlsx`;
  
    XLSX.utils.book_append_sheet(wb, ws, 'Patient List');
    XLSX.writeFile(wb, fileName);
  }


  

  exportTotalrevenueMonthwise() {
    this.service.totalRevenue().subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);  
      if (response.status) {
        const data = response.data;
        const excelData: any[] = [];
        const monthWiseData: any = {};
  
        let startDate = new Date();
        Object.keys(data).forEach((transactionType) => {
          data[transactionType].forEach((item: any) => {
            const date = new Date(item.month);
            if (date < startDate) {
              startDate = date;
            }
          });
        });
  
        // Get current date
        const currentDate = new Date();
  
        // Fill month-wise data from startDate to currentDate
        let tempDate = new Date(startDate);
  
        while (tempDate <= currentDate) {
          const month = tempDate.toLocaleString("en-US", { month: "short" });
          const year = tempDate.getFullYear().toString().slice(-2);
          const monthName = `${month}-${year}`;
  
          monthWiseData[monthName] = {
            Month: monthName,
            "Total Plan Revenue": 0,
            "Total Lab/Radio Revenue": 0,
            "Total Addon Revenue": 0,
          };
  
          // Move to next month
          tempDate.setMonth(tempDate.getMonth() + 1);
        }
  
        // Populate data into the initialized months
        Object.keys(data).forEach((transactionType) => {
          data[transactionType].forEach((item: any) => {
            const date = new Date(item.month);
            const month = date.toLocaleString("en-US", { month: "short" });
            const year = date.getFullYear().toString().slice(-2);
            const monthName = `${month}-${year}`;
  
            const roundedAmount = parseFloat(item.totalAmount.toFixed(2)); // Round to 2 decimal places
  
            if (transactionType === "subscription") {
              monthWiseData[monthName]["Total Plan Revenue"] += roundedAmount;
            } else if (transactionType === "labRadioTests") {
              monthWiseData[monthName]["Total Lab/Radio Revenue"] += roundedAmount;
            } else if (transactionType === "addon") {
              monthWiseData[monthName]["Total Addon Revenue"] += roundedAmount;
            }
          });
        });
  
        Object.values(monthWiseData).forEach((item: any) => {
          excelData.push({
            Month: item.Month,
            "Total Plan Revenue": item["Total Plan Revenue"],
            "Total Lab/Radio Revenue": item["Total Lab/Radio Revenue"],
            "Total Addon Revenue": item["Total Addon Revenue"]
          });
        });
  
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths for better Excel display
        worksheet['!cols'] = [
          { wch: 15 }, // Month column
          { wch: 20 }, // Plan Revenue
          { wch: 20 }, // Lab/Radio Revenue
          { wch: 20 }  // Addon Revenue
        ];
        
        const workbook: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Total Revenue");
  
        XLSX.writeFile(workbook, "Total_Revenue_Monthwise.xlsx");
      }
    });
  }

}
