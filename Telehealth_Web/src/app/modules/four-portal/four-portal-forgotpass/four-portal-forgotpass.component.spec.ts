import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalForgotpassComponent } from './four-portal-forgotpass.component';

describe('FourPortalForgotpassComponent', () => {
  let component: FourPortalForgotpassComponent;
  let fixture: ComponentFixture<FourPortalForgotpassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalForgotpassComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalForgotpassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
