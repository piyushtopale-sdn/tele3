import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyPrescriptionorderComponent } from './pharmacy-prescriptionorder.component';

describe('PharmacyPrescriptionorderComponent', () => {
  let component: PharmacyPrescriptionorderComponent;
  let fixture: ComponentFixture<PharmacyPrescriptionorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacyPrescriptionorderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacyPrescriptionorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
