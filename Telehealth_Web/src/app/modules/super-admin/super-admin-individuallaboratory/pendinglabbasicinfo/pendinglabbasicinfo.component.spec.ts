import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendinglabbasicinfoComponent } from './pendinglabbasicinfo.component';

describe('PendinglabbasicinfoComponent', () => {
  let component: PendinglabbasicinfoComponent;
  let fixture: ComponentFixture<PendinglabbasicinfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendinglabbasicinfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PendinglabbasicinfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
