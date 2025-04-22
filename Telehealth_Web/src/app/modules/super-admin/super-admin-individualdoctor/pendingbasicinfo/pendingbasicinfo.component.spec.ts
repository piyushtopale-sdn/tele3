import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingbasicinfoComponent } from './pendingbasicinfo.component';

describe('PendingbasicinfoComponent', () => {
  let component: PendingbasicinfoComponent;
  let fixture: ComponentFixture<PendingbasicinfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingbasicinfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingbasicinfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
