import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EducationSuperAdminComponent } from './education-super-admin.component';

describe('EducationSuperAdminComponent', () => {
  let component: EducationSuperAdminComponent;
  let fixture: ComponentFixture<EducationSuperAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EducationSuperAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EducationSuperAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
