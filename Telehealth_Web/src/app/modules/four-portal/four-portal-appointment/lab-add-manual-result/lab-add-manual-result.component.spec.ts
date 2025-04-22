import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabAddManualResultComponent } from './lab-add-manual-result.component';

describe('LabAddManualResultComponent', () => {
  let component: LabAddManualResultComponent;
  let fixture: ComponentFixture<LabAddManualResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabAddManualResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabAddManualResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
