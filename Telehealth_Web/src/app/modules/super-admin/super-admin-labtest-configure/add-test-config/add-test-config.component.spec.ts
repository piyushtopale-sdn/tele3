import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTestConfigComponent } from './add-test-config.component';

describe('AddTestConfigComponent', () => {
  let component: AddTestConfigComponent;
  let fixture: ComponentFixture<AddTestConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTestConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTestConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
