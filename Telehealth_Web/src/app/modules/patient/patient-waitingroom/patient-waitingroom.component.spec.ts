import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientWaitingroomComponent } from './patient-waitingroom.component';

describe('PatientWaitingroomComponent', () => {
  let component: PatientWaitingroomComponent;
  let fixture: ComponentFixture<PatientWaitingroomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientWaitingroomComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientWaitingroomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
