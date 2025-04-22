import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectOrderDetailsComponent } from './reject-order-details.component';

describe('RejectOrderDetailsComponent', () => {
  let component: RejectOrderDetailsComponent;
  let fixture: ComponentFixture<RejectOrderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RejectOrderDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RejectOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
