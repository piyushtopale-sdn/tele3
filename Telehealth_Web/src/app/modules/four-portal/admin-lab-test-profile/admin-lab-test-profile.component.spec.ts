import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLabTestProfileComponent } from './admin-lab-test-profile.component';

describe('AdminLabTestProfileComponent', () => {
  let component: AdminLabTestProfileComponent;
  let fixture: ComponentFixture<AdminLabTestProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLabTestProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminLabTestProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
