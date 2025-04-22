import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientSetnewpassComponent } from './patient-setnewpass.component';

describe('PatientSetnewpassComponent', () => {
  let component: PatientSetnewpassComponent;
  let fixture: ComponentFixture<PatientSetnewpassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientSetnewpassComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientSetnewpassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
