import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalNewpasswordComponent } from './four-portal-newpassword.component';

describe('FourPortalNewpasswordComponent', () => {
  let component: FourPortalNewpasswordComponent;
  let fixture: ComponentFixture<FourPortalNewpasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalNewpasswordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalNewpasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
