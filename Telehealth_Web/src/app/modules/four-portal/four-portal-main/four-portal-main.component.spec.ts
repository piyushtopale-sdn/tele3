import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalMainComponent } from './four-portal-main.component';

describe('FourPortalMainComponent', () => {
  let component: FourPortalMainComponent;
  let fixture: ComponentFixture<FourPortalMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalMainComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
