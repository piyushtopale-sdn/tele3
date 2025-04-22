import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CoreService } from 'src/app/shared/core.service';
import { PatientService } from '../../patient.service';

@Component({
  selector: 'app-termscondition',
  templateUrl: './termscondition.component.html',
  styleUrls: ['./termscondition.component.scss']
})
export class TermsconditionComponent implements OnInit {
  langType:any='en';
  showData:any;
  showText:any;
  constructor( 
    private fb: FormBuilder,
    private service: PatientService,
    private _coreService: CoreService,
    private toastr: ToastrService,
    public translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.getTermslist();
  }

  getTermslist() {
    const params={
      langType: this.translate.currentLang
    }
    this.service.getlistTNC(params).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.showData = response?.body;
      this.showText= response?.body.text;
    });
  }

}
