import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CoreService } from 'src/app/shared/core.service';
import { SuperAdminService } from '../../super-admin.service';
import Validation from 'src/app/utility/validation';

@Component({
  selector: 'app-changepassword',
  templateUrl: './changepassword.component.html',
  styleUrls: ['./changepassword.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class ChangepasswordComponent implements OnInit {
  isSubmitted: boolean = false;
  changePasswordForm: any = FormGroup;
  userData: any;
  constructor(private coreService: CoreService, private fb: FormBuilder,private modalService: NgbModal, private service: SuperAdminService) {
    const loginData = this.coreService.getLocalStorage("loginData");
    
    this.userData = loginData
    
    this.changePasswordForm = this.fb.group(
      {
        old_password: ["", [Validators.required]],
        new_password: [
          null,
          Validators.compose([
            Validators.required,
            // check whether the entered password has a number
            Validation.patternValidator(/\d/, {
              hasNumber: true,
            }),
            // check whether the entered password has upper case letter
            Validation.patternValidator(/[A-Z]/, {
              hasCapitalCase: true,
            }),
            // check whether the entered password has a lower case letter
            Validation.patternValidator(/[a-z]/, {
              hasSmallCase: true,
            }),
            // check whether the entered password has a special character
            Validation.patternValidator(
              /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
              {
                hasSpecialCharacters: true,
              }
            ),
            Validators.minLength(8),
          ]),
        ],
        confirm_password: ["", [Validators.required]],
      },
      { validators: [Validation.match("new_password", "confirm_password")] }
    );
   }

  ngOnInit(): void {
  }


    handleChangePassword() {
    this.isSubmitted = true;
    if (this.changePasswordForm.invalid) {
      return;
    }
    this.isSubmitted = false;

    let reqData = {
      id:this.userData?._id ,
      old_password: this.changePasswordForm.value.old_password,
      new_password: this.changePasswordForm.value.new_password,
    };


    this.service.changePassword(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.coreService.showSuccess("",response.message)
        this.changePasswordForm.reset();
      } else {
        this.coreService.showError("",response.message)
      }
    }, err => {
      let errResponse = this.coreService.decryptObjectData({ data: err.error });
      this.coreService.showError("",errResponse.message)
    })
  }

  get f() {
    return this.changePasswordForm.controls;
  }

}
