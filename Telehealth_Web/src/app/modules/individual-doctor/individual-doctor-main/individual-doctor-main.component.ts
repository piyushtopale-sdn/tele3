import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  constructor(private route: Router, private _coreService: CoreService) {
    this.dontShowSidebard =  localStorage.getItem("callStatus")

    const pattern = /^\/individual-doctor\/patientmanagement\/details\/[^/]+$/;
    if (this.dontShowSidebard === 'true') {
      this.dontShowSidebard = true
    }

    let adminData = this._coreService.getLocalStorage("loginData");  
    this.loggedInUserName = adminData?.fullName

    this._coreService.SharingMenu.subscribe((res) => {
      if (res != "default") {
        this.menuSelected = res;
      } else {
        this.menuSelected =  this._coreService.getLocalStorage("menuTitle");
      }
    });
  }

  ngOnInit(): void {
  }

}
