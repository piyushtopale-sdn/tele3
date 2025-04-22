import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyNotificationComponent } from './pharmacy-notification.component';

describe('PharmacyNotificationComponent', () => {
  let component: PharmacyNotificationComponent;
  let fixture: ComponentFixture<PharmacyNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacyNotificationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacyNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
