import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorCommunicationComponent } from './individual-doctor-communication.component';

describe('IndividualDoctorCommunicationComponent', () => {
  let component: IndividualDoctorCommunicationComponent;
  let fixture: ComponentFixture<IndividualDoctorCommunicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorCommunicationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorCommunicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
