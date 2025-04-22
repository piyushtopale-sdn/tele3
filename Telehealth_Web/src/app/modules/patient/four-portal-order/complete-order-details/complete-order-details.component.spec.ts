import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompleteOrderDetailsComponent } from './complete-order-details.component';

describe('CompleteOrderDetailsComponent', () => {
  let component: CompleteOrderDetailsComponent;
  let fixture: ComponentFixture<CompleteOrderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompleteOrderDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompleteOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
