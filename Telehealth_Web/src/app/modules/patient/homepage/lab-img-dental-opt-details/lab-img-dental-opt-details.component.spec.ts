import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabImgDentalOptDetailsComponent } from './lab-img-dental-opt-details.component';

describe('LabImgDentalOptDetailsComponent', () => {
  let component: LabImgDentalOptDetailsComponent;
  let fixture: ComponentFixture<LabImgDentalOptDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LabImgDentalOptDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LabImgDentalOptDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
