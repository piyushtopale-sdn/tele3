import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetailpharmacyComponent } from './retailpharmacy.component';

describe('RetailpharmacyComponent', () => {
  let component: RetailpharmacyComponent;
  let fixture: ComponentFixture<RetailpharmacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetailpharmacyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RetailpharmacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
