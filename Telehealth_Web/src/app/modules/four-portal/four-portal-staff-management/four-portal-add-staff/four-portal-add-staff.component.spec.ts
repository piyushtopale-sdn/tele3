import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalAddStaffComponent } from './four-portal-add-staff.component';

describe('FourPortalAddStaffComponent', () => {
  let component: FourPortalAddStaffComponent;
  let fixture: ComponentFixture<FourPortalAddStaffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalAddStaffComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalAddStaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
