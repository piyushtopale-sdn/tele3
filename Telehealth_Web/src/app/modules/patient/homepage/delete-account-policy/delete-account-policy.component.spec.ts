import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAccountPolicyComponent } from './delete-account-policy.component';

describe('DeleteAccountPolicyComponent', () => {
  let component: DeleteAccountPolicyComponent;
  let fixture: ComponentFixture<DeleteAccountPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteAccountPolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteAccountPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
