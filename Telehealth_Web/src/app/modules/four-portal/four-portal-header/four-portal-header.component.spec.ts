import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalHeaderComponent } from './four-portal-header.component';

describe('FourPortalHeaderComponent', () => {
  let component: FourPortalHeaderComponent;
  let fixture: ComponentFixture<FourPortalHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
