import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LingoCourse } from './lingo-course';

describe('LingoCourse', () => {
  let component: LingoCourse;
  let fixture: ComponentFixture<LingoCourse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LingoCourse]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LingoCourse);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
