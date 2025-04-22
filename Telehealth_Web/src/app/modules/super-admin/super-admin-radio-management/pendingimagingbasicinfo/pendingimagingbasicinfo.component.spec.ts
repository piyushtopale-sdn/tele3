import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingimagingbasicinfoComponent } from './pendingimagingbasicinfo.component';

describe('PendingimagingbasicinfoComponent', () => {
  let component: PendingimagingbasicinfoComponent;
  let fixture: ComponentFixture<PendingimagingbasicinfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingimagingbasicinfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingimagingbasicinfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
