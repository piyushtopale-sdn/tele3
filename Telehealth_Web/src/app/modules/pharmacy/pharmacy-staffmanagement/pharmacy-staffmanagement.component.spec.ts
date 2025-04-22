import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyStaffmanagementComponent } from './pharmacy-staffmanagement.component';

describe('PharmacyStaffmanagementComponent', () => {
  let component: PharmacyStaffmanagementComponent;
  let fixture: ComponentFixture<PharmacyStaffmanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacyStaffmanagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacyStaffmanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
