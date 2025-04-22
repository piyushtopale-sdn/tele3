import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabAppointmentDetailsComponent } from './lab-appointment-details.component';

describe('LabAppointmentDetailsComponent', () => {
  let component: LabAppointmentDetailsComponent;
  let fixture: ComponentFixture<LabAppointmentDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabAppointmentDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabAppointmentDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
