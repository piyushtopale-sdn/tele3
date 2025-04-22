import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorHeaderComponent } from './individual-doctor-header.component';

describe('IndividualDoctorHeaderComponent', () => {
  let component: IndividualDoctorHeaderComponent;
  let fixture: ComponentFixture<IndividualDoctorHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
