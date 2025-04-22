import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { PharmacyService } from '../pharmacy.service';
import { CoreService } from 'src/app/shared/core.service';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, ChartOptions, registerables } from 'chart.js';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { DateAdapter } from '@angular/material/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IndiviualDoctorService } from '../../individual-doctor/indiviual-doctor.service';

@Component({
  selector: 'app-pharmacy-dashboard',
  templateUrl: './pharmacy-dashboard.component.html',
  styleUrls: ['./pharmacy-dashboard.component.scss']
})
export class PharmacyDashboardComponent implements OnInit {


  TotalorderCount: any;
  totalNewOrder: any;
  cancelledCount: any;
  totalcompletedOrder: any;


  startgraphDate: string;
  endgraphDate: string;
  graphyear: number;

  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  selectedMonth: string = this.months[new Date().getMonth()]; // Default to current month

  years: number[] = [];
  lineChartData: any;
  selectedYear: number = new Date().getFullYear();
  lineChartOptions: ChartOptions<'line'>;
  
  dateRangeForm: FormGroup;
  fromDate: string = '';
  toDate: string = '';
  currentUrl: any = [];
  
  constructor(private service: PharmacyService, private _coreService: CoreService, private route: Router,
    private modalService: NgbModal,
    private dateAdapter: DateAdapter<Date>,
    private services: IndiviualDoctorService,
    private datepipe: DatePipe,private fb: FormBuilder,
    ) {
      this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy
      Chart.register(...registerables);
      this.dateRangeForm = this.fb.group({
        fromDate: [null],
        toDate: [null]
      });
      this.yeardropdown()

  }

  yeardropdown() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 4; i--) {
      this.years.push(i);
    }

    this.selectedYear = currentYear;
    
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
    this.getallcountList();    

    this.initializeChartData();
    this.initializeChartOptions();
    this.getgraphYear(this.years[0]);
    this.currentUrl = this.route.url;
    this.onNavigate(this.currentUrl)

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

    this.getallcountList();

  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'MM-dd-yyyy') || '';
  }
    


  getallcountList() {
    let reqData = {
      fromDate :this.fromDate,
      toDate : this.toDate
    };

    this.service.getdashboardCountApi(reqData).subscribe(async (res) => {
      let response = this._coreService.decryptObjectData({ data: res });   
      if (response.status) {
        this.TotalorderCount = response?.body?.totalOrder;
        this.totalNewOrder = response?.body?.totalNewOrder;
        this.cancelledCount = response?.body?.totalCancelledOrder;
        this.totalcompletedOrder = response?.body?.totalcompletedOrder;
      }

    });
  }

  getgraphYear(year) {
    const today = new Date();

    const startDate = new Date(year, today.getMonth(), 1);    
    const endDate = new Date(year, today.getMonth() + 1, 0);
  
    this.startgraphDate = this.formatDateNew(startDate.toISOString());
    this.endgraphDate = this.formatDateNew(endDate.toISOString());
    this.dashboardGraph();
  }
  

  onMonthChange(month: string) {
    this.selectedMonth = month;
    this.updateGraphDate(this.selectedYear, month);
  }

  updateGraphDate(year: number, month: string) {
    const monthIndex = this.months.indexOf(month) + 1; // Convert month name to index (1-12)
    const monthStr = monthIndex.toString().padStart(2, '0'); // Format as "01", "02", etc.

    // Calculate start date for the first day of the month
    const startDate = `${year}-${monthStr}-01T00:00:00.000Z`;

    // Get the last day of the month (dynamically calculated)
    const endDate = new Date(year, monthIndex, 0); // Using Date(year, monthIndex, 0) gives the last day of the previous month
    const endDateStr = `${year}-${monthStr}-${endDate.getDate().toString().padStart(2, '0')}T23:59:59.000Z`;

    // Format both start and end dates
    this.startgraphDate = this.formatDateNew(startDate);
    this.endgraphDate = this.formatDateNew(endDateStr);
    this.dashboardGraph();
  }

  formatDateNew(dateStr: string): string {
    const date = new Date(dateStr);
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // getUTCMonth() returns 0-11
    const day = date.getUTCDate().toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${year}-${month}-${day}`;
  }

  initializeChartData(completedCounts: any = '', cancelledCounts: any = '', acceptedCounts: any = '', newCounts: any = '', labels: any = '') {
    this.lineChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Completed',
          data: completedCounts,
          borderColor: 'green',
          backgroundColor: 'rgba(0, 128, 0, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Cancelled',
          data: cancelledCounts,
          borderColor: 'orange',
          backgroundColor: 'rgba(255, 165, 0, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Accepted',
          data: acceptedCounts,
          borderColor: 'yellow',
          backgroundColor: 'rgba(255, 255, 0, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'New Order',
          data: newCounts,
          borderColor: 'blue',
          backgroundColor: 'rgba(0, 0, 255, 0.1)', 
          fill: true,
          tension: 0.4,
        }
        
      ]
    };
  }

  initializeChartOptions(dynamicMax:any='') {
    this.lineChartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: dynamicMax,
        }
      }
    };
  }

  dashboardGraph() {
    let reqData = {
      fromDate: this.startgraphDate,
      toDate: this.endgraphDate, 
    };

    this.service.dashboardGraph(reqData).subscribe(async (res) => {
      let response = this._coreService.decryptObjectData({ data: res });      
   
      if (response.status) {

        const completedData = response.body.completed || [];
        const cancelledData = response.body.cancelled || [];
        const acceptedData = response.body.accepted || [];
        const newData = response.body.new || [];

        const labels = completedData.map(item => {
          const date = new Date(item.date); // Create a Date object from the date string
          const day = date.getUTCDate().toString().padStart(2, '0'); // Get the day and format with leading zero if needed
          const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Get the month and format it (months are 0-based)
          return `${day}/${month}`; // Return the formatted date in day/month format
        });
        const completedCounts = completedData.map(item => item.count);
        const cancelledCounts = cancelledData.map(item => item.count);
        const acceptedCounts = acceptedData.map(item => item.count);
        const newCounts = newData.map(item => item.count);


        this.initializeChartData(completedCounts, cancelledCounts, acceptedCounts, newCounts, labels);
        const allCounts = [
          ...completedCounts,
          ...cancelledCounts,
          ...acceptedCounts,
          ...newCounts
        ];
        
        const maxCount = Math.max(...allCounts);
      
        // You can optionally add some margin, such as 10% more than the max value
        const dynamicMax = Math.ceil(maxCount * 1.1);
        
        this.initializeChartOptions(dynamicMax);            
      }

    });
  }

  onNavigate(url:any): void {
    const menuitems = JSON.parse(localStorage.getItem('activeMenu'))
     this.currentUrl = url
   
    const matchedMenu = menuitems.find(menu => menu.route_path === this.currentUrl);
    this.route.navigate([url]).then(() => {
      
      this.services.setActiveMenu(matchedMenu?.name);
    });
   
  }

}
