import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalViewAppointmentComponent } from './four-portal-view-appointment.component';

describe('FourPortalViewAppointmentComponent', () => {
  let component: FourPortalViewAppointmentComponent;
  let fixture: ComponentFixture<FourPortalViewAppointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalViewAppointmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalViewAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
