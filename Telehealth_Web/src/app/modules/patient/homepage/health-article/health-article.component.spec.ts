import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthArticleComponent } from './health-article.component';

describe('HealthArticleComponent', () => {
  let component: HealthArticleComponent;
  let fixture: ComponentFixture<HealthArticleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HealthArticleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
