import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalLoginComponent } from './four-portal-login.component';

describe('FourPortalLoginComponent', () => {
  let component: FourPortalLoginComponent;
  let fixture: ComponentFixture<FourPortalLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalLoginComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
