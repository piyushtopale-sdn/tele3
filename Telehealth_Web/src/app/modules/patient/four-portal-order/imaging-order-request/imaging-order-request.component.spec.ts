import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagingOrderRequestComponent } from './imaging-order-request.component';

describe('ImagingOrderRequestComponent', () => {
  let component: ImagingOrderRequestComponent;
  let fixture: ComponentFixture<ImagingOrderRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImagingOrderRequestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImagingOrderRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
