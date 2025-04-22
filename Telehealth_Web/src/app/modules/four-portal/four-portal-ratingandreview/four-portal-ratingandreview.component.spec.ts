import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalRatingandreviewComponent } from './four-portal-ratingandreview.component';

describe('FourPortalRatingandreviewComponent', () => {
  let component: FourPortalRatingandreviewComponent;
  let fixture: ComponentFixture<FourPortalRatingandreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalRatingandreviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalRatingandreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
