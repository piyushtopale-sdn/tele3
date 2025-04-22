import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalCommunicationComponent } from './four-portal-communication.component';

describe('FourPortalCommunicationComponent', () => {
  let component: FourPortalCommunicationComponent;
  let fixture: ComponentFixture<FourPortalCommunicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalCommunicationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalCommunicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
