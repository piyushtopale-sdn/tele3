import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminImagingmanagementComponent } from './super-admin-imagingmanagement.component';

describe('SuperAdminImagingmanagementComponent', () => {
  let component: SuperAdminImagingmanagementComponent;
  let fixture: ComponentFixture<SuperAdminImagingmanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminImagingmanagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminImagingmanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
