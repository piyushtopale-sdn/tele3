import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAllDoctorsComponent } from './admin-all-doctors.component';

describe('AdminAllDoctorsComponent', () => {
  let component: AdminAllDoctorsComponent;
  let fixture: ComponentFixture<AdminAllDoctorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAllDoctorsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAllDoctorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
