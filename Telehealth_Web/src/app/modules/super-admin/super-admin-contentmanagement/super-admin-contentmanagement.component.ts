import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { AbstractControl, FormControl, FormGroup } from "@angular/forms";
import { Validators, Editor, Toolbar } from "ngx-editor";
import jsonDoc from "../../../../assets/doc/doc";

@Component({
  selector: "app-super-admin-contentmanagement",
  templateUrl: "./super-admin-contentmanagement.component.html",
  styleUrls: ["./super-admin-contentmanagement.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class SuperAdminContentmanagementComponent implements OnInit {
  ngOnInit(): void {}
}
