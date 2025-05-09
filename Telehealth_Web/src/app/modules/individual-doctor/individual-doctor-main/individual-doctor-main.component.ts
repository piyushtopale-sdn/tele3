import { Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/shared/core.service';

@Component({
  selector: 'app-individual-doctor-main',
  templateUrl: './individual-doctor-main.component.html',
  styleUrls: ['./individual-doctor-main.component.scss']
})
export class IndividualDoctorMainComponent implements OnInit {
  loggedInUserName: any;
  portaltype = 'doctor'
  currentUrl: any = ''
  dontShowSidebard: any = ''
  menuSelected = "";
  constructor(private readonly _coreService: CoreService) {
    this.dontShowSidebard =  localStorage.getItem("callStatus")

    if (this.dontShowSidebard === 'true') {
      this.dontShowSidebard = true
    }

    let adminData = this._coreService.getLocalStorage("loginData");  
    this.loggedInUserName = adminData?.fullName

    this._coreService.SharingMenu.subscribe((res) => {
      if (res != "default") {
        this.menuSelected = res;
      } else {
        const menuTitle = localStorage.getItem("menuTitle");
        this.menuSelected =  menuTitle
      }
    });
    
  }

  ngOnInit(): void {
    // document why this method 'ngOnInit' is empty
  
  }

}
