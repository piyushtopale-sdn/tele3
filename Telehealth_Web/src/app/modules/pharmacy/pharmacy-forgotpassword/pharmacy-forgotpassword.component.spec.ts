import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyForgotpasswordComponent } from './pharmacy-forgotpassword.component';

describe('PharmacyForgotpasswordComponent', () => {
  let component: PharmacyForgotpasswordComponent;
  let fixture: ComponentFixture<PharmacyForgotpasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacyForgotpasswordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacyForgotpasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
