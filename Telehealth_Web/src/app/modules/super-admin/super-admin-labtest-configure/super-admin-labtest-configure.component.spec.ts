import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminLabtestConfigureComponent } from './super-admin-labtest-configure.component';

describe('SuperAdminLabtestConfigureComponent', () => {
  let component: SuperAdminLabtestConfigureComponent;
  let fixture: ComponentFixture<SuperAdminLabtestConfigureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminLabtestConfigureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminLabtestConfigureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
