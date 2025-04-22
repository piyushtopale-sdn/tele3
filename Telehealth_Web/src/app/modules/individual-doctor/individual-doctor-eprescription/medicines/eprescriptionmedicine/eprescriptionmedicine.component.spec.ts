import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EprescriptionmedicineComponent } from './eprescriptionmedicine.component';

describe('EprescriptionmedicineComponent', () => {
  let component: EprescriptionmedicineComponent;
  let fixture: ComponentFixture<EprescriptionmedicineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EprescriptionmedicineComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EprescriptionmedicineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
