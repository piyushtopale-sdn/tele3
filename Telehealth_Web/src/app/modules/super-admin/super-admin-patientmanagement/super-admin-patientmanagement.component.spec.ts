import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminPatientmanagementComponent } from './super-admin-patientmanagement.component';

describe('SuperAdminPatientmanagementComponent', () => {
  let component: SuperAdminPatientmanagementComponent;
  let fixture: ComponentFixture<SuperAdminPatientmanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminPatientmanagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminPatientmanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
