import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalViewProfileComponent } from './four-portal-view-profile.component';

describe('FourPortalViewProfileComponent', () => {
  let component: FourPortalViewProfileComponent;
  let fixture: ComponentFixture<FourPortalViewProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalViewProfileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalViewProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
