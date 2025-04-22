import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientEntercodeComponent } from './patient-entercode.component';

describe('PatientEntercodeComponent', () => {
  let component: PatientEntercodeComponent;
  let fixture: ComponentFixture<PatientEntercodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientEntercodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientEntercodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
