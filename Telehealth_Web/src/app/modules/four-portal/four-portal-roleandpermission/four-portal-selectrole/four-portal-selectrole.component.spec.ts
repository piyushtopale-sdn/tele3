import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalSelectroleComponent } from './four-portal-selectrole.component';

describe('FourPortalSelectroleComponent', () => {
  let component: FourPortalSelectroleComponent;
  let fixture: ComponentFixture<FourPortalSelectroleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalSelectroleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalSelectroleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
