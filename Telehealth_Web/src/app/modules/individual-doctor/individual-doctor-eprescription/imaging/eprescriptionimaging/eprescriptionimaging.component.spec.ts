import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EprescriptionimagingComponent } from './eprescriptionimaging.component';

describe('EprescriptionimagingComponent', () => {
  let component: EprescriptionimagingComponent;
  let fixture: ComponentFixture<EprescriptionimagingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EprescriptionimagingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EprescriptionimagingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
