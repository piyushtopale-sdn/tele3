import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyNewpasswordComponent } from './pharmacy-newpassword.component';

describe('PharmacyNewpasswordComponent', () => {
  let component: PharmacyNewpasswordComponent;
  let fixture: ComponentFixture<PharmacyNewpasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacyNewpasswordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacyNewpasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
