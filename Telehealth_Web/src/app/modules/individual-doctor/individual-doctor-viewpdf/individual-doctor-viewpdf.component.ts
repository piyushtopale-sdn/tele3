import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CoreService } from 'src/app/shared/core.service';
import { IndiviualDoctorService } from '../indiviual-doctor.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';
@Component({
  selector: 'app-individual-doctor-viewpdf',
  templateUrl: './individual-doctor-viewpdf.component.html',
  styleUrls: ['./individual-doctor-viewpdf.component.scss']
})
export class IndividualDoctorViewpdfComponent implements OnInit {
  pdfKey: string;
  eprescriptionDetails: any ="";

  constructor(
    private activatedRoute: ActivatedRoute,
    private coreService: CoreService,
    private indiviualDoctorService: IndiviualDoctorService,

  ) { }

  ngOnInit(): void {

    this.activatedRoute.queryParams.subscribe((params: any) => {
      let appointmentId = params.id
      this.getEprescription(appointmentId);


    });



  }





  async getEprescription(id) {
    let reqData = {
      appointmentId: id,
    };

    this.indiviualDoctorService
      .getEprescription(reqData)
      .subscribe(async (res) => {
        let response = await this.coreService.decryptObjectData({ data: res });

        if (response.status) {
          this.eprescriptionDetails = await response?.body?.previewTemplateSigendUrl;
        }
      });
  }



  handleDownloadTemplate() {
    window.location.href = this.eprescriptionDetails;
  }

}
