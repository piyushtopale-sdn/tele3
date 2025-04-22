import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminRevenuemanagementComponent } from './super-admin-revenuemanagement.component';

describe('SuperAdminRevenuemanagementComponent', () => {
  let component: SuperAdminRevenuemanagementComponent;
  let fixture: ComponentFixture<SuperAdminRevenuemanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminRevenuemanagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminRevenuemanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
