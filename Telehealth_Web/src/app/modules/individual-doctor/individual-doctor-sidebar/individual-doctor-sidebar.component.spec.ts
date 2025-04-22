import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorSidebarComponent } from './individual-doctor-sidebar.component';

describe('IndividualDoctorSidebarComponent', () => {
  let component: IndividualDoctorSidebarComponent;
  let fixture: ComponentFixture<IndividualDoctorSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorSidebarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
