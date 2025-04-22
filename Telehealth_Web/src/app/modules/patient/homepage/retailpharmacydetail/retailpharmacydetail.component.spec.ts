import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetailpharmacydetailComponent } from './retailpharmacydetail.component';

describe('RetailpharmacydetailComponent', () => {
  let component: RetailpharmacydetailComponent;
  let fixture: ComponentFixture<RetailpharmacydetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetailpharmacydetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RetailpharmacydetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
