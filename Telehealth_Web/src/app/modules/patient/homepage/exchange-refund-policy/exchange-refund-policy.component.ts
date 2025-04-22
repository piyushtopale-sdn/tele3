
import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CoreService } from 'src/app/shared/core.service';

@Component({
  selector: 'app-exchange-refund-policy',
  templateUrl: './exchange-refund-policy.component.html',
  styleUrls: ['./exchange-refund-policy.component.scss']
})

export class ExchangeRefundPolicyComponent implements OnInit {
  showData:any;
  showText: any;
  constructor(
    private fb: FormBuilder,
    private _coreService: CoreService,
    private toastr: ToastrService,
    public translate: TranslateService,
  ) { }

  ngOnInit(): void {
    // this.getRefundPolicy();
  }


}
