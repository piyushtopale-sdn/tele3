import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientSubscriptionplanComponent } from './patient-subscriptionplan.component';

describe('PatientSubscriptionplanComponent', () => {
  let component: PatientSubscriptionplanComponent;
  let fixture: ComponentFixture<PatientSubscriptionplanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientSubscriptionplanComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientSubscriptionplanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
