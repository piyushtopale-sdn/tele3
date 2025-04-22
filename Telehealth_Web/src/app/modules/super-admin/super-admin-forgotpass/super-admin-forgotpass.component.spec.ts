import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminForgotpassComponent } from './super-admin-forgotpass.component';

describe('SuperAdminForgotpassComponent', () => {
  let component: SuperAdminForgotpassComponent;
  let fixture: ComponentFixture<SuperAdminForgotpassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminForgotpassComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminForgotpassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
