import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetailappointmentdetailsComponent } from './retailappointmentdetails.component';

describe('RetailappointmentdetailsComponent', () => {
  let component: RetailappointmentdetailsComponent;
  let fixture: ComponentFixture<RetailappointmentdetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetailappointmentdetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RetailappointmentdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
