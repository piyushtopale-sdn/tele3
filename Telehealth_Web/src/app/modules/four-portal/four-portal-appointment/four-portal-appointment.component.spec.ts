import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalAppointmentComponent } from './four-portal-appointment.component';

describe('FourPortalAppointmentComponent', () => {
  let component: FourPortalAppointmentComponent;
  let fixture: ComponentFixture<FourPortalAppointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalAppointmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
