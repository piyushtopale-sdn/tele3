import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyRoleandpermisionComponent } from './pharmacy-roleandpermision.component';

describe('PharmacyRoleandpermisionComponent', () => {
  let component: PharmacyRoleandpermisionComponent;
  let fixture: ComponentFixture<PharmacyRoleandpermisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacyRoleandpermisionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacyRoleandpermisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
