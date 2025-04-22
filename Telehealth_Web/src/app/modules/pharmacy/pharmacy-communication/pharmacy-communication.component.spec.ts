import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyCommunicationComponent } from './pharmacy-communication.component';

describe('PharmacyCommunicationComponent', () => {
  let component: PharmacyCommunicationComponent;
  let fixture: ComponentFixture<PharmacyCommunicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacyCommunicationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacyCommunicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
