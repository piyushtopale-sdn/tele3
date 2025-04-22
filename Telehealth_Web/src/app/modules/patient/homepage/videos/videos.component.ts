import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CoreService } from 'src/app/shared/core.service';
import { PatientService } from '../../patient.service';

@Component({
  selector: 'app-videos',
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.scss']
})
export class VideosComponent implements OnInit {
  page: any = 1;
  pageSize: number = 5;
  totalLength: number = 0;
  language: any = "en";
  showData: any;
  videoId: any;
  constructor(
    private fb: FormBuilder,
    private service: PatientService,
    private _coreService: CoreService,
    private toastr: ToastrService,
    public translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.videoList();
  }

  videoList() {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      language:this.translate.currentLang
    };
    this.service.listVideo(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.showData = response?.body?.result;
      this.totalLength = response?.body?.totalCount;
    });
  }
}
