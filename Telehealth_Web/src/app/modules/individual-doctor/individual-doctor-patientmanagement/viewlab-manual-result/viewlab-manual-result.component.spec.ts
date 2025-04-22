import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewlabManualResultComponent } from './viewlab-manual-result.component';

describe('ViewlabManualResultComponent', () => {
  let component: ViewlabManualResultComponent;
  let fixture: ComponentFixture<ViewlabManualResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewlabManualResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewlabManualResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
