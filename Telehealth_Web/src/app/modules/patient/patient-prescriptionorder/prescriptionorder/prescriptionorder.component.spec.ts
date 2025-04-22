import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionorderComponent } from './prescriptionorder.component';

describe('PrescriptionorderComponent', () => {
  let component: PrescriptionorderComponent;
  let fixture: ComponentFixture<PrescriptionorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrescriptionorderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrescriptionorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
