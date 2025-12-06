import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerDashbordComponent } from './seller-dashbord.component';

describe('SellerDashbordComponent', () => {
  let component: SellerDashbordComponent;
  let fixture: ComponentFixture<SellerDashbordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerDashbordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellerDashbordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
