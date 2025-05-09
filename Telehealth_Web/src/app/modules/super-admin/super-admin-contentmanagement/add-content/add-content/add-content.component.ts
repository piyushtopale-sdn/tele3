import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { Component, ViewEncapsulation } from "@angular/core";
import { FormGroup, Validators, FormBuilder, FormArray } from "@angular/forms";
import { CoreService } from "src/app/shared/core.service";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Editor, Toolbar } from "ngx-editor";
import jsonDoc from "../../../../../../assets/doc/doc";

@Component({
  selector: 'app-add-contenet',
  templateUrl: './add-content.component.html',
  styleUrls: ['./add-content.component.scss'],
  encapsulation: ViewEncapsulation.None,

})
export class AddContentComponent {
  contentForm!: FormGroup;
  isSubmitted: boolean = false;
  assessmentId: any;
  superadminId: any;

  editordoc = jsonDoc;
  abouteditor!: Editor;
  // abouteditor_arabic!: Editor;
  toolbar: Toolbar = [
    ["bold", "italic", "underline", "text_color", "background_color", "strike"],
    ["align_left", "align_center", "align_right", "align_justify"],
    ["ordered_list", "bullet_list"],
    ["code", "blockquote"],
    [{ heading: ["h1", "h2", "h3", "h4", "h5", "h6"] }],
    // ["link", "image"],
  ];
  toolbar_arabic: Toolbar = [
    ["bold", "italic", "underline", "text_color", "background_color", "strike"],
    ["align_left", "align_center", "align_right", "align_justify"],
    ["ordered_list", "bullet_list"],
    ["code", "blockquote"],
    [{ heading: ["h1", "h2", "h3", "h4", "h5", "h6"] }],
    // ["link", "image"],
  ];
  contentId: string;

  constructor(
    private coreService: CoreService,
    private sadminService: SuperAdminService,
    private route: Router,
    private loader: NgxUiLoaderService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,


  ) {
    this.contentForm = this.fb.group({
      title: ["", [Validators.required]],
      type: ["label", [Validators.required]],
      slug: ["", [Validators.required]],
      text: ["", [Validators.required]],
      // text_arabic: ["", [Validators.required]],
      message: ["", [Validators.required]],
      // message_arabic: ["", [Validators.required]],
    });

    let paramId = this.activatedRoute.snapshot.paramMap.get("id");

    if (paramId !== null) {
      this.contentId = paramId;
      this.getContentData(this.contentId)
    }

  }

  
  


  ngOnInit(): void {
    this.abouteditor = new Editor();
    // this.abouteditor_arabic = new Editor();

  }


  handleCondition() {
    this.contentForm.reset
  }

  async getContentData(id: any) {
    let reqData = {
      _id: id
    };
  
    this.sadminService.contentListById(reqData).subscribe({
      next: (result) => {
        let response = this.coreService.decryptObjectData({ data: result });
  
        if (response.status) {
          let ele = response?.body?.content 
          this.contentForm.patchValue({
            title: ele?.title,
            type: ele?.type,
            slug: ele?.slug
          });
  
          if (ele?.type === 'message' || ele?.type === 'label') {
            this.contentForm.patchValue({
              message: ele?.content,
              // message_arabic: ele?.contentArabic
            });
          }
  
          if (ele?.type === 'text') {
            this.contentForm.patchValue({
              text: ele?.content,
              // text_arabic: ele?.contentArabic
            });
          }
        } else {
          this.coreService.showError("", response?.message || "Failed to fetch content data");
        }
      },
      error: (err: ErrorEvent) => {
        this.loader.stop();
        this.coreService.showError("Error", err.error.message);
        console.error("Error in getContentData:", err);
      },
    });
  }

  async submitForm() {
    this.isSubmitted = true;


    if (this.contentForm.get('type').value === 'text') {
      this.contentForm.get('message')?.clearValidators();
      this.contentForm.get('message')?.updateValueAndValidity();
      this.contentForm.get('message').setValue('');
    }
    if (this.contentForm.get('type').value === 'text') {
      // this.contentForm.get('message_arabic')?.clearValidators();
      // this.contentForm.get('message_arabic')?.updateValueAndValidity();
      // this.contentForm.get('message_arabic').setValue('');
    }

    if (this.contentForm.get('type').value === 'message' || this.contentForm.get('type').value === 'label') {
      this.contentForm.get('text')?.clearValidators();
      this.contentForm.get('text')?.updateValueAndValidity();
      this.contentForm.get('text').setValue('');
    }

    if (this.contentForm.get('type').value === 'message' || this.contentForm.get('type').value === 'label') {
      // this.contentForm.get('text_arabic')?.clearValidators();
      // this.contentForm.get('text_arabic')?.updateValueAndValidity();
      // this.contentForm.get('text_arabic').setValue('');
    }


    if (this.contentForm.invalid) {
      this.contentForm.markAllAsTouched();

      const firstInvalidField = document.querySelector(
        'input.ng-invalid, input.ng-invalid'
      );
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      this.coreService.showError("", "Please fill all required fields.")
      return;
    }



    if (this.contentId === null || this.contentId === undefined) {

      let reqData = {
        title: this.contentForm.value.title,
        type: this.contentForm.value.type,
        slug: this.contentForm.value.slug,
        content: this.contentForm.value.text ? this.contentForm.value.text : this.contentForm.value.message,
        // contentArabic: this.contentForm.value.text_arabic ? this.contentForm.value.text_arabic : this.contentForm.value.message_arabic,
      }

      this.loader.start();


      this.sadminService.addContent(reqData).subscribe({

        next: (result) => {
          let response = this.coreService.decryptObjectData({ data: result });

          if (response.status) {
            this.loader.stop();
            this.coreService.showSuccess("", response.message);

            this.route.navigate([`/super-admin/content-management`]);

          } else {
            this.loader.stop();
            this.coreService.showError("", response.message);
          }
        },
        error: (err: ErrorEvent) => {
          this.loader.stop();
          this.coreService.showError("Error", err.error.message);
        },
      });
    } else {
      let reqData = {
        title: this.contentForm.value.title,
        type: this.contentForm.value.type,
        slug: this.contentForm.value.slug,
        content: this.contentForm.value.text ? this.contentForm.value.text : this.contentForm.value.message,
        // contentArabic: this.contentForm.value.text_arabic ? this.contentForm.value.text_arabic : this.contentForm.value.message_arabic,
        id: this.contentId
      }
        
      this.loader.start();
    
      this.sadminService.updateContent(reqData).subscribe({
        next: (result) => { 
          let response = this.coreService.decryptObjectData({ data: result });
    
          if (response?.status) {
            this.loader.stop();
            this.coreService.showSuccess("", response.message);
          
            this.route.navigate([`/super-admin/content-management`]);
          } else {

            this.loader.stop();
            this.coreService.showError("", response.message);
          }
        },
        error: (err: ErrorEvent) => {
          this.loader.stop();
          this.coreService.showError("Error", err.error.message);
        },
      });
    }
    
  }
  ngOnDestroy(): void {
    this.abouteditor.destroy();
    // this.abouteditor_arabic.destroy();
  }

  
}