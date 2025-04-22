import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalEntercodeComponent } from './four-portal-entercode.component';

describe('FourPortalEntercodeComponent', () => {
  let component: FourPortalEntercodeComponent;
  let fixture: ComponentFixture<FourPortalEntercodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalEntercodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalEntercodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
