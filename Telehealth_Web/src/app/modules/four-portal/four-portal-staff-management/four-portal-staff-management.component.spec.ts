import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalStaffManagementComponent } from './four-portal-staff-management.component';

describe('FourPortalStaffManagementComponent', () => {
  let component: FourPortalStaffManagementComponent;
  let fixture: ComponentFixture<FourPortalStaffManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalStaffManagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalStaffManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
