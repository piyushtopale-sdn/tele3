import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperSubscriptionplanComponent } from './super-subscriptionplan.component';

describe('SuperSubscriptionplanComponent', () => {
  let component: SuperSubscriptionplanComponent;
  let fixture: ComponentFixture<SuperSubscriptionplanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperSubscriptionplanComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperSubscriptionplanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
