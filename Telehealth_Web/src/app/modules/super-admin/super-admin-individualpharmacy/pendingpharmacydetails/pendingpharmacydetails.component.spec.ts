import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingpharmacydetailsComponent } from './pendingpharmacydetails.component';

describe('PendingpharmacydetailsComponent', () => {
  let component: PendingpharmacydetailsComponent;
  let fixture: ComponentFixture<PendingpharmacydetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingpharmacydetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingpharmacydetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
