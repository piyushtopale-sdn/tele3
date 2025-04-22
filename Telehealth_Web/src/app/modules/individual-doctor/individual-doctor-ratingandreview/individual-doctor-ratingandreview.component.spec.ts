import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorRatingandreviewComponent } from './individual-doctor-ratingandreview.component';

describe('IndividualDoctorRatingandreviewComponent', () => {
  let component: IndividualDoctorRatingandreviewComponent;
  let fixture: ComponentFixture<IndividualDoctorRatingandreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorRatingandreviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorRatingandreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
