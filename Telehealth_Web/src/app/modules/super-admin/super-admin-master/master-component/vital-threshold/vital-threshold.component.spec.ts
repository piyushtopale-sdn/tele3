import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VitalThresholdComponent } from './vital-threshold.component';

describe('VitalThresholdComponent', () => {
  let component: VitalThresholdComponent;
  let fixture: ComponentFixture<VitalThresholdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VitalThresholdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VitalThresholdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
