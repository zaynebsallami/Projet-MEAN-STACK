import { TestBed } from '@angular/core/testing';

import { CategoryProductServiceService } from './category-product-service.service';

describe('CategoryProductServiceService', () => {
  let service: CategoryProductServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoryProductServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
