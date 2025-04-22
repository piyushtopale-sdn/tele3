import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAllRequestComponent } from './admin-all-request.component';

describe('AdminAllRequestComponent', () => {
  let component: AdminAllRequestComponent;
  let fixture: ComponentFixture<AdminAllRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAllRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAllRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
