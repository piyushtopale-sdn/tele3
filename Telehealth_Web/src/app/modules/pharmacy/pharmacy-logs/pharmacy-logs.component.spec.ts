import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyLogsComponent } from './pharmacy-logs.component';

describe('PharmacyLogsComponent', () => {
  let component: PharmacyLogsComponent;
  let fixture: ComponentFixture<PharmacyLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacyLogsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacyLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
