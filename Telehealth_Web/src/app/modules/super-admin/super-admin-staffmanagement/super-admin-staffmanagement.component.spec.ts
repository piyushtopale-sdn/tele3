import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminStaffmanagementComponent } from './super-admin-staffmanagement.component';

describe('SuperAdminStaffmanagementComponent', () => {
  let component: SuperAdminStaffmanagementComponent;
  let fixture: ComponentFixture<SuperAdminStaffmanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminStaffmanagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminStaffmanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
