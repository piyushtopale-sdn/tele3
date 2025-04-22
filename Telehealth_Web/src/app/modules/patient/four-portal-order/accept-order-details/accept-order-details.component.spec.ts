import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptOrderDetailsComponent } from './accept-order-details.component';

describe('AcceptOrderDetailsComponent', () => {
  let component: AcceptOrderDetailsComponent;
  let fixture: ComponentFixture<AcceptOrderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptOrderDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
