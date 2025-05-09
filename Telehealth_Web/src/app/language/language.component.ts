import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-language',
  templateUrl: './language.component.html',
  styleUrls: ['./language.component.scss']
})
export class LanguageComponent implements OnInit {
  @Output() langChange = new EventEmitter<string>();
  noUserLogin: string;

  languages = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'عربي' }
  ];

  constructor(public translate: TranslateService) {
    translate.addLangs(['en','ar']);
    translate.setDefaultLang('en');
  this.noUserLogin =  localStorage.getItem('loginData');
    
  }
  switchLang(lang: string) {    
    this.translate.use(lang);
    this.langChange.emit(lang); // Emit the selected language
  }

  ngOnInit(): void { /* document why this method 'ngOnInit' is empty */ }

}
