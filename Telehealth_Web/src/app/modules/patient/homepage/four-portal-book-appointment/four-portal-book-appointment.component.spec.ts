import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalBookAppointmentComponent } from './four-portal-book-appointment.component';

describe('FourPortalBookAppointmentComponent', () => {
  let component: FourPortalBookAppointmentComponent;
  let fixture: ComponentFixture<FourPortalBookAppointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalBookAppointmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalBookAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
