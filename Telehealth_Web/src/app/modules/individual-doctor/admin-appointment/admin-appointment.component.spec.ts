import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAppointmentComponent } from './admin-appointment.component';

describe('AdminAppointmentComponent', () => {
  let component: AdminAppointmentComponent;
  let fixture: ComponentFixture<AdminAppointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAppointmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
