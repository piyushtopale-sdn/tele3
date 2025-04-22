import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyRatingandreviewComponent } from './pharmacy-ratingandreview.component';

describe('PharmacyRatingandreviewComponent', () => {
  let component: PharmacyRatingandreviewComponent;
  let fixture: ComponentFixture<PharmacyRatingandreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacyRatingandreviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacyRatingandreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
