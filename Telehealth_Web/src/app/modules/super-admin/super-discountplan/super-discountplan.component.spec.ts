import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperDiscountplanComponent } from './super-discountplan.component';

describe('SuperDiscountplanComponent', () => {
  let component: SuperDiscountplanComponent;
  let fixture: ComponentFixture<SuperDiscountplanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperDiscountplanComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperDiscountplanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
