import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorWaitingroomComponent } from './individual-doctor-waitingroom.component';

describe('IndividualDoctorWaitingroomComponent', () => {
  let component: IndividualDoctorWaitingroomComponent;
  let fixture: ComponentFixture<IndividualDoctorWaitingroomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndividualDoctorWaitingroomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndividualDoctorWaitingroomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
