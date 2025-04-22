import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-patient-main',
  templateUrl: './patient-main.component.html',
  styleUrls: ['./patient-main.component.scss']
})
export class PatientMainComponent implements OnInit {

  loggedInUserName:any;
  constructor() { 

}
  ngOnInit(): void {
    if(JSON.parse(localStorage.getItem("profileData"))){
      let profileData = JSON.parse(localStorage.getItem("profileData"));
      this.loggedInUserName=profileData.full_name
    }
    
  }

}
