import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { guardsAdminGuard } from './guards-admin.guard';

describe('guardsAdminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => guardsAdminGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
