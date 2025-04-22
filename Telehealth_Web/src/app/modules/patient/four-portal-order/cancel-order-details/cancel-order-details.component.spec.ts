import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelOrderDetailsComponent } from './cancel-order-details.component';

describe('CancelOrderDetailsComponent', () => {
  let component: CancelOrderDetailsComponent;
  let fixture: ComponentFixture<CancelOrderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CancelOrderDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CancelOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
