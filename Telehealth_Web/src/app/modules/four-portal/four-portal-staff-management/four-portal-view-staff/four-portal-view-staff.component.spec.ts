import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalViewStaffComponent } from './four-portal-view-staff.component';

describe('FourPortalViewStaffComponent', () => {
  let component: FourPortalViewStaffComponent;
  let fixture: ComponentFixture<FourPortalViewStaffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalViewStaffComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalViewStaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
