import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalViewroleComponent } from './four-portal-viewrole.component';

describe('FourPortalViewroleComponent', () => {
  let component: FourPortalViewroleComponent;
  let fixture: ComponentFixture<FourPortalViewroleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalViewroleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalViewroleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
