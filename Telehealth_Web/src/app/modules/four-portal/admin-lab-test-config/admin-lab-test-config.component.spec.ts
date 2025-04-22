import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLabTestConfigComponent } from './admin-lab-test-config.component';

describe('AdminLabTestConfigComponent', () => {
  let component: AdminLabTestConfigComponent;
  let fixture: ComponentFixture<AdminLabTestConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLabTestConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminLabTestConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
