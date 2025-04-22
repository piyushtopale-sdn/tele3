import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRatingandreviewComponent } from './patient-ratingandreview.component';

describe('PatientRatingandreviewComponent', () => {
  let component: PatientRatingandreviewComponent;
  let fixture: ComponentFixture<PatientRatingandreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientRatingandreviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientRatingandreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
