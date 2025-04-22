import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientProfilecreationComponent } from './patient-profilecreation.component';

describe('PatientProfilecreationComponent', () => {
  let component: PatientProfilecreationComponent;
  let fixture: ComponentFixture<PatientProfilecreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientProfilecreationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientProfilecreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
