import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CoreService } from 'src/app/shared/core.service';
import { PatientService } from '../../patient.service';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-health-article',
  templateUrl: './health-article.component.html',
  styleUrls: ['./health-article.component.scss']
})
export class HealthArticleComponent implements OnInit {
  page: any = 1;
  pageSize: number = 5;
  totalLength: number = 0;
  showData: any;
  showText: any;
  allArticleData: any[] = [];
  language: any;
  data_id: any;
  constructor(
    private fb: FormBuilder,
    private service: PatientService,
    private _coreService: CoreService,
    private toastr: ToastrService,
    public translate: TranslateService,
    private router: Router,

  ) { }

  ngOnInit(): void {
    this.articleList();
  }

  articleList() {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      language: this.translate.currentLang
    };
    this.service.articleListApi(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.showData = response?.body?.result;
      this.totalLength = response?.body?.totalCount;

      this.showData = response?.body?.result?.map(item => ({
        ...item,
        cleanText: item.text
      }));
    });
  }

  routeToNextpage(data: any) {
    let data_id = data?._id
    let language = data?.language
    this.router.navigate(["/patient/homepage/articles-show-content"],
      {
        queryParams: {
          data_id, language,
          type : "article"
        },
      }
    );

  }

}
