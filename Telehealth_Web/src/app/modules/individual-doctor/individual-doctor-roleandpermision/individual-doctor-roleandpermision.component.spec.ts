import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorRoleandpermisionComponent } from './individual-doctor-roleandpermision.component';

describe('IndividualDoctorRoleandpermisionComponent', () => {
  let component: IndividualDoctorRoleandpermisionComponent;
  let fixture: ComponentFixture<IndividualDoctorRoleandpermisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorRoleandpermisionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorRoleandpermisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
