import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyEntercodeComponent } from './pharmacy-entercode.component';

describe('PharmacyEntercodeComponent', () => {
  let component: PharmacyEntercodeComponent;
  let fixture: ComponentFixture<PharmacyEntercodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacyEntercodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacyEntercodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
