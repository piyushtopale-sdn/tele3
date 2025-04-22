import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SuperAdminService } from 'src/app/modules/super-admin/super-admin.service';
import { CoreService } from 'src/app/shared/core.service';
import { PatientService } from '../../patient.service';

@Component({
  selector: 'app-health-article-show-content',
  templateUrl: './health-article-show-content.component.html',
  styleUrls: ['./health-article-show-content.component.scss']
})
export class HealthArticleShowContentComponent implements OnInit {
  language: any;
  showData: any;
  showImage: any;
  type : any;

  constructor(private service: PatientService, private _coreService: CoreService, private activatedRoute: ActivatedRoute,) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((val: any) => {
       this.getArticleById(val.data_id,val.language,val.type)
    });
  }
  getArticleById(id:any, language:any , type : any ) {
    let reqData = {
      data_id: id,
      language: language,
    };

    this.type = type
    
    if(type === "blog")
    {
      this.service.blogByIdApi(reqData).subscribe((res) => {
        let encryptedData = { data: res };      
        let response = this._coreService.decryptObjectData(encryptedData);
        this.showData = response?.body?.text   
        this.showImage = response?.body?.image
      })
    }

    else if(type === "article")
    {
      this.service.articleByIdApi(reqData).subscribe((res) => {
        let encryptedData = { data: res };      
        let response = this._coreService.decryptObjectData(encryptedData);
        this.showData = response?.body?.text   
        this.showImage = response?.body?.image
      })
    }
  
  }

}


