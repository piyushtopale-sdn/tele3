import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalSidebarComponent } from './four-portal-sidebar.component';

describe('FourPortalSidebarComponent', () => {
  let component: FourPortalSidebarComponent;
  let fixture: ComponentFixture<FourPortalSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalSidebarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
