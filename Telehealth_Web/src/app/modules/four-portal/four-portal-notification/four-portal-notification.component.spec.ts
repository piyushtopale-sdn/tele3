import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalNotificationComponent } from './four-portal-notification.component';

describe('FourPortalNotificationComponent', () => {
  let component: FourPortalNotificationComponent;
  let fixture: ComponentFixture<FourPortalNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalNotificationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
