import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalVideoCallComponent } from './external-video-call.component';

describe('ExternalVideoCallComponent', () => {
  let component: ExternalVideoCallComponent;
  let fixture: ComponentFixture<ExternalVideoCallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExternalVideoCallComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExternalVideoCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
