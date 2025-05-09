import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NotFoundComponent } from './not-found/not-found.component';

import { SharedModule } from './modules/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MomentDateFormatPipe } from './shared/pipes/moment-date-format.pipe';
import { loaderInterceptor } from './shared/loader.interceptor';
import { DatePipe } from '@angular/common';

@NgModule({
	declarations: [
		AppComponent,
		NotFoundComponent,
		MomentDateFormatPipe
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		SharedModule,
		AppRoutingModule,
		HttpClientModule,
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient]
			}
		}),
		NgxUiLoaderModule,
		// NgxUiLoaderHttpModule.forRoot({
		// 	showForeground: true,
		// }),
	],
	// providers: [{
	//   provide: HTTP_INTERCEPTORS,
	//   useClass: AuthInterceptor,
	//   multi: true
	// }],
	providers: [
		{
			provide: HTTP_INTERCEPTORS,
			useClass: loaderInterceptor,
			multi: true,

		},
		DatePipe,
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}

export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
