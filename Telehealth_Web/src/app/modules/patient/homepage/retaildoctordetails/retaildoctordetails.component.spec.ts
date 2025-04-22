import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetaildoctordetailsComponent } from './retaildoctordetails.component';

describe('RetaildoctordetailsComponent', () => {
  let component: RetaildoctordetailsComponent;
  let fixture: ComponentFixture<RetaildoctordetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetaildoctordetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RetaildoctordetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
