import { AfterViewInit, Component, EventEmitter, OnInit, Output } from '@angular/core';
import intlTelInput from 'intl-tel-input';
@Component({
  selector: 'app-country-code',
  templateUrl: './country-code.component.html',
  styleUrls: ['./country-code.component.scss']
})
export class CountryCodeComponent implements OnInit,AfterViewInit {
  iti: any;
  selectedCountryCode: any;
  @Output() public phoneCode = new EventEmitter();
  constructor() { }

  ngOnInit(): void {
    
  }

  /*
  code for country code starts
  */
  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  }
  ngAfterViewInit() {
    
    const input = document.querySelector("#phone");
    this.iti = intlTelInput(input, {
      initialCountry: "fr",
      separateDialCode: true
    });
    this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
    this.phoneCode.emit('<input type="text" maxlength="10" id="phone"  (focus)="onFocus()" formControlName="mobile" ng2TelInput   placeholder="Enter Mobile" matInput>')
  }

  /*
    code for country code ends
    */

}
