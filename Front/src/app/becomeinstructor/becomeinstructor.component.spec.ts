import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BecomeinstructorComponent } from './becomeinstructor.component';

describe('BecomeinstructorComponent', () => {
  let component: BecomeinstructorComponent;
  let fixture: ComponentFixture<BecomeinstructorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BecomeinstructorComponent]
    });
    fixture = TestBed.createComponent(BecomeinstructorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
