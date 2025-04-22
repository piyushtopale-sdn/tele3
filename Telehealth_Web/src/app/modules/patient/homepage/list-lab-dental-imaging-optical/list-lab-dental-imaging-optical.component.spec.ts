import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListLabDentalImagingOpticalComponent } from './list-lab-dental-imaging-optical.component';

describe('ListLabDentalImagingOpticalComponent', () => {
  let component: ListLabDentalImagingOpticalComponent;
  let fixture: ComponentFixture<ListLabDentalImagingOpticalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListLabDentalImagingOpticalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListLabDentalImagingOpticalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
