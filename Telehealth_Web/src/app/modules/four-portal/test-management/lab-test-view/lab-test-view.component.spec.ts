import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabTestViewComponent } from './lab-test-view.component';

describe('LabTestViewComponent', () => {
  let component: LabTestViewComponent;
  let fixture: ComponentFixture<LabTestViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabTestViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabTestViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
