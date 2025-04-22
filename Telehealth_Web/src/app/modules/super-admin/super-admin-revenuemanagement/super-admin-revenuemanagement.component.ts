import { Component, OnInit,ViewEncapsulation, } from '@angular/core';
import { ChartConfiguration,ChartOptions,ChartType } from 'chart.js';
import { CoreService } from 'src/app/shared/core.service';
import { SuperAdminService } from '../../super-admin/super-admin.service';
import { PatientService } from 'src/app/modules/patient/patient.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-super-admin-revenuemanagement',
  templateUrl: './super-admin-revenuemanagement.component.html',
  styleUrls: ['./super-admin-revenuemanagement.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class SuperAdminRevenuemanagementComponent implements OnInit {
  totalAmount:number
  totalsubscriptionamount: number;
  totalcommisionamount: number;
  totalnumber:number;
  startDateFilter: any="";
  endDateFilter: any="";
  years: number[] = [];
  selectedYear: number;
  graphyear:number;
  onlysubscription:any;
  onlycommision: any;
  onlytotalTransaction:any;
  innerMenuPremission:any=[];
  loginrole: any;
  constructor(private sAdminServices: SuperAdminService,
    private modalService: NgbModal,
    private patientService: PatientService,
    private _coreService: CoreService,) {
     this.yeardropdown()
     this.loginrole = this._coreService.getLocalStorage("adminData").role;
    }
yeardropdown(){
  const currentYear = new Date().getFullYear();

  for (let i = currentYear; i >= currentYear - 4; i--) {
    this.years.push(i);
  }

  this.selectedYear = currentYear;
  this.graphyear=currentYear;
}
  
  ngOnInit(): void {
    if(this.years.length>0){
      this.getYear(this.years[0])
      this.getgraphYear(this.years[0])
    }
    
   
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 300);
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission(){
    let userPermission = this._coreService.getLocalStorage("adminData").permissions;
    let menuID = sessionStorage.getItem("currentPageMenuID");
    let checkData = this.findObjectByKey(userPermission, "parent_id",menuID)
    if(checkData){
      if(checkData.isChildKey == true){
        var checkSubmenu = checkData.submenu;      
        if (checkSubmenu.hasOwnProperty("city")) {
          this.innerMenuPremission = checkSubmenu['city'].inner_menu;

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

  giveInnerPermission(value) {
    if (this.loginrole === 'STAFF_USER') {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    }else {
      return true;
    }
  }

  getYear(year){
    this.startDateFilter="";
    this.endDateFilter ="";
    let startDate=year+"-01-01T18:30:00.000Z"
    let endDate=year+"-12-31T18:30:00.000Z"
    this.getallplanPriceforSuperAdmin(startDate,endDate)

  }
  getgraphYear(year){
    let startgraphDate=year+"-01-01T18:30:00.000Z"
    let endgraphDate=year+"-12-31T18:30:00.000Z"
    this.gettotalMonthWiseforSuperAdmingraph(startgraphDate,endgraphDate)
  }

  clearAll(){
    this.startDateFilter ="";
    this.endDateFilter ="";
    this.selectedYear=this.years[0]
    this.yeardropdown()
    this.getallplanPriceforSuperAdmin("","")
  }
  
  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };


    //Transaction Bar chart
    public transactionbarChartLegend = false;
    public transactionbarChartPlugins = [];
    public transactionbarChartData: ChartConfiguration<'bar'>['data'] = {
      labels: [ 'Jan','Feb','Mar','Apr','May','June','July','Aug','Sep','Oct','Nov','Dec'],
      datasets: [
        { data: [ 30,35,25,50,40,35,75,60,45,55,30,25 ],
           label: 'Series A',
           backgroundColor: ["#17BD9F"],
           hoverBackgroundColor: ["#17BD9F"],
           barThickness: 12,
           borderColor: ["#17BD9F"],
           borderWidth: 1,
           borderRadius:14,
           hoverBorderColor: "#17BD9F",
           hoverBorderWidth: 0,
           yAxisID: 'y-axis-r', 
          },
          { data: [ 20,45,15,25,45,65,50,45,55,35,15,20 ],
            label: 'Series B',
            backgroundColor: ["#0B4977"],
            hoverBackgroundColor: ["#0B4977"],
            barThickness: 12,
            borderColor: ["#0B4977"],
            borderWidth: 1,
            borderRadius:14,
            hoverBorderColor: "#0B4977",
            hoverBorderWidth: 0,
            yAxisID: 'y-axis-r', 
           },
           { data: [ 20,45,15,25,45,65,50,45,55,35,15,20 ],
            label: 'Series C',
            backgroundColor: ["#3DA7C8"],
            hoverBackgroundColor: ["#3DA7C8"],
            barThickness: 12,
            borderColor: ["#3DA7C8"],
            borderWidth: 1,
            borderRadius:14,
            hoverBorderColor: "#3DA7C8",
            hoverBorderWidth: 0,
            yAxisID: 'y-axis-r', 
           },
      ],
    };
    public transactionbarChartOptions: ChartConfiguration<'bar'>['options'] = {
      responsive: true,
    };


    // Line chart
    public lineChartData: ChartConfiguration<'line'>['data'] = {
      labels: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
      ],
      datasets: [
        {
          data: [ 50, 10, 5, 0, 50, 60, 70,50,40,70,80,90 ],
          label: 'Series A',
          tension: 0.5,
          borderColor: '#0E8A0C',
          backgroundColor: 'white'
        },
        
      ]
    };
    public lineChartOptions: ChartOptions<'line'> = {
      responsive: true
    };
    public lineChartLegend = false;
    getallplanPriceforSuperAdmin(startyearDate,endyearDate){


      let myJson ={ 
        createdDate: startyearDate,
        updatedDate: endyearDate,
      
      }
   
      this.sAdminServices.getallplanPriceforSuperAdmin(myJson).subscribe(async(res) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
  
  
       let mydata = await response.body;
        this.totalsubscriptionamount=response.body.totalsubscriptionamount;
        this.totalcommisionamount=response.body.totalcommisionamount;
        this.totalAmount=this.totalsubscriptionamount+this.totalcommisionamount;
        this.totalnumber=response.body.totalnumber;// It should be commision + subscription  and  same from backend 
        
        
      });
    }
    handleSelectStartDateFilter(event: any) {    
      this.selectedYear=this.years[""]
      const originalDate = new Date(event.value);
      this.extendDateFormat(originalDate)
      const formattedDate = originalDate.toISOString();
      this.startDateFilter = formattedDate
      
      this.getallplanPriceforSuperAdmin(this.startDateFilter,this.endDateFilter );
    
    
    }
    extendDateFormat(mydate){
      mydate.setHours(mydate.getHours() + 5); // Add 5 hours
      mydate.setMinutes(mydate.getMinutes() + 30); 
      return mydate
    }
    
    handleSelectEndDateFilter(event: any) {    
      this.selectedYear=this.years[""]
      const originalDate = new Date(event.value);
      this.extendDateFormat(originalDate)
      const formattedDate = originalDate.toISOString();
      this.endDateFilter = formattedDate
      this.getallplanPriceforSuperAdmin(this.startDateFilter,this.endDateFilter );

    }

    gettotalMonthWiseforSuperAdmingraph(startyearDate,endyearDate){
      let itsJson ={ 
        createdDate: startyearDate,
        updatedDate: endyearDate,
      
      }
      this.sAdminServices.gettotalMonthWiseforSuperAdmingraph(itsJson).subscribe(async(res) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
  
  
        let allsubscriptionArray = await response.body.allsubscriptionArray;
        let allcommisionArray=await response.body.allcommisionArray;
        let alltotalTransaction=await response.body.alltotalTransaction;
     
       this.onlysubscription=Object.values(allsubscriptionArray);
       this.onlycommision=Object.values(allcommisionArray);
       this.onlytotalTransaction=Object.values(alltotalTransaction);

     
       this.transactionbarChartData= {
        labels: [ 'Jan','Feb','Mar','Apr','May','June','July','Aug','Sep','Oct','Nov','Dec'],
        datasets: [
          { data:   this.onlytotalTransaction,
             label: 'Series A',
             backgroundColor: ["#17BD9F"],
             hoverBackgroundColor: ["#17BD9F"],
             barThickness: 12,
             borderColor: ["#17BD9F"],
             borderWidth: 1,
             borderRadius:14,
             hoverBorderColor: "#17BD9F",
             hoverBorderWidth: 0,
             yAxisID: 'y-axis-r', 
            },
            { data: this.onlysubscription,
              label: 'Series B',
              backgroundColor: ["#0B4977"],
              hoverBackgroundColor: ["#0B4977"],
              barThickness: 12,
              borderColor: ["#0B4977"],
              borderWidth: 1,
              borderRadius:14,
              hoverBorderColor: "#0B4977",
              hoverBorderWidth: 0,
              yAxisID: 'y-axis-r', 
             },
             { data: this.onlycommision,
              label: 'Series C',
              backgroundColor: ["#3DA7C8"],
              hoverBackgroundColor: ["#3DA7C8"],
              barThickness: 12,
              borderColor: ["#3DA7C8"],
              borderWidth: 1,
              borderRadius:14,
              hoverBorderColor: "#3DA7C8",
              hoverBorderWidth: 0,
              yAxisID: 'y-axis-r', 
             },
        ],
      };
    }
  )}

  openVerticallyCenteredclaimlistpopup(claimlistpopup: any) {
    this.modalService.open(claimlistpopup, {
      centered: true,
      size: "lg",
      windowClass: "edit_staffnew",
    });
  }

  closePopup() {
    this.modalService.dismissAll("close");
  }
}
