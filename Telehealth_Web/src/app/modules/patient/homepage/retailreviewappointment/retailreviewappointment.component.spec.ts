import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetailreviewappointmentComponent } from './retailreviewappointment.component';

describe('RetailreviewappointmentComponent', () => {
  let component: RetailreviewappointmentComponent;
  let fixture: ComponentFixture<RetailreviewappointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetailreviewappointmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RetailreviewappointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
