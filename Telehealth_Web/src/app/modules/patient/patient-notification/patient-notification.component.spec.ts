import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientNotificationComponent } from './patient-notification.component';

describe('PatientNotificationComponent', () => {
  let component: PatientNotificationComponent;
  let fixture: ComponentFixture<PatientNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientNotificationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
