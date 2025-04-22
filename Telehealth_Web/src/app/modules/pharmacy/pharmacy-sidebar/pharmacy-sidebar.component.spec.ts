import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacySidebarComponent } from './pharmacy-sidebar.component';

describe('PharmacySidebarComponent', () => {
  let component: PharmacySidebarComponent;
  let fixture: ComponentFixture<PharmacySidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacySidebarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacySidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
