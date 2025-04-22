import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorNotificationComponent } from './individual-doctor-notification.component';

describe('IndividualDoctorNotificationComponent', () => {
  let component: IndividualDoctorNotificationComponent;
  let fixture: ComponentFixture<IndividualDoctorNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorNotificationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
