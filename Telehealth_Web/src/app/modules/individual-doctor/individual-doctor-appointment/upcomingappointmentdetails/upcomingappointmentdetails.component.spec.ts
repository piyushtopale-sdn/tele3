import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingappointmentdetailsComponent } from './upcomingappointmentdetails.component';

describe('UpcomingappointmentdetailsComponent', () => {
  let component: UpcomingappointmentdetailsComponent;
  let fixture: ComponentFixture<UpcomingappointmentdetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpcomingappointmentdetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpcomingappointmentdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
