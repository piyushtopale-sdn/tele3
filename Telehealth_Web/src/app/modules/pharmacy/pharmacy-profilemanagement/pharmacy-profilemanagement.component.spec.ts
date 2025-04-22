import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyProfilemanagementComponent } from './pharmacy-profilemanagement.component';

describe('PharmacyProfilemanagementComponent', () => {
  let component: PharmacyProfilemanagementComponent;
  let fixture: ComponentFixture<PharmacyProfilemanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacyProfilemanagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacyProfilemanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
