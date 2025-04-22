import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-four-portal-main',
  templateUrl: './four-portal-main.component.html',
  styleUrls: ['./four-portal-main.component.scss']
})
export class FourPortalMainComponent implements OnInit {
  loggedInUserName: any;
  portaltype='fourportal'

  
  constructor() {
    let adminData = JSON.parse(localStorage.getItem("adminData"));
    this.loggedInUserName = adminData?.full_name
  }

  ngOnInit(): void {
  }

}
