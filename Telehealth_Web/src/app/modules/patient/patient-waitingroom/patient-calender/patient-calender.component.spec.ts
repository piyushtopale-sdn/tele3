import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientCalenderComponent } from './patient-calender.component';

describe('PatientCalenderComponent', () => {
  let component: PatientCalenderComponent;
  let fixture: ComponentFixture<PatientCalenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientCalenderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientCalenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
