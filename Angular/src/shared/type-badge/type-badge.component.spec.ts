import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeBadgeComponent } from './type-badge.component';

describe('TypeBadgeComponent', () => {
  let component: TypeBadgeComponent;
  let fixture: ComponentFixture<TypeBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeBadgeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypeBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
