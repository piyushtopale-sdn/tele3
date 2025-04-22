import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminCommunicationComponent } from './super-admin-communication.component';

describe('SuperAdminCommunicationComponent', () => {
  let component: SuperAdminCommunicationComponent;
  let fixture: ComponentFixture<SuperAdminCommunicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminCommunicationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminCommunicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
