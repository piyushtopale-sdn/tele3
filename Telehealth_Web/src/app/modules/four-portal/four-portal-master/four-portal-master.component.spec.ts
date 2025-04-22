import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalMasterComponent } from './four-portal-master.component';

describe('FourPortalMasterComponent', () => {
  let component: FourPortalMasterComponent;
  let fixture: ComponentFixture<FourPortalMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalMasterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
