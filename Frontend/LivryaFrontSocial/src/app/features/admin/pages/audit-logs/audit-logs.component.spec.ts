import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuditLogsComponent } from '../audit-logs.component';
import { AuditService } from '../../../../core/services/audit.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { MessageService } from 'primeng/api';
import { of, Subject } from 'rxjs';

describe('AuditLogsComponent', () => {
  let component: AuditLogsComponent;
  let auditService: jasmine.SpyObj<AuditService>;
  let wsService: jasmine.SpyObj<WebSocketService>;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    const auditServiceSpy = jasmine.createSpyObj('AuditService', [
      'getLogs',
      'getStats',
      'export',
    ]);
    const wsServiceSpy = jasmine.createSpyObj('WebSocketService', [
      'isConnected',
      'connect',
      'on',
    ]);
    const messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AuditLogsComponent],
      providers: [
        { provide: AuditService, useValue: auditServiceSpy },
        { provide: WebSocketService, useValue: wsServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy },
      ],
    });

    auditService = TestBed.inject(AuditService) as jasmine.SpyObj<AuditService>;
    wsService = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;
    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;

    component = TestBed.createComponent(AuditLogsComponent).componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load stats and logs on init', () => {
      const mockStats = {
        total: 1000,
        last24h: 50,
        bySeverity: { CRITICAL: 5, HIGH: 10, MEDIUM: 20, LOW: 15 },
        byCategory: { AUTH: 10, SYSTEM: 5 },
      };

      const mockLogs = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        filters: {},
      };

      auditService.getStats.and.returnValue(of(mockStats));
      auditService.getLogs.and.returnValue(of(mockLogs));
      wsService.isConnected.and.returnValue(false);
      wsService.on.and.returnValue(new Subject());

      component.ngOnInit();

      expect(auditService.getStats).toHaveBeenCalled();
      expect(auditService.getLogs).toHaveBeenCalled();
    });

    it('should connect WebSocket if not connected', () => {
      wsService.isConnected.and.returnValue(false);
      wsService.on.and.returnValue(new Subject());
      auditService.getStats.and.returnValue(of({} as any));
      auditService.getLogs.and.returnValue(of({} as any));

      component.ngOnInit();

      expect(wsService.connect).toHaveBeenCalled();
    });
  });

  describe('Search Debouncing', () => {
    it('should debounce search input', (done) => {
      auditService.getLogs.and.returnValue(
        of({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          filters: {},
        })
      );
      auditService.getStats.and.returnValue(of({} as any));
      wsService.on.and.returnValue(new Subject());

      component.ngOnInit();

      // Simulate rapid typing
      component.onSearchInput('t');
      component.onSearchInput('te');
      component.onSearchInput('tes');
      component.onSearchInput('test');

      // Should only trigger one API call after debounce
      setTimeout(() => {
        expect(auditService.getLogs).toHaveBeenCalledTimes(2); // 1 initial + 1 debounced
        done();
      }, 600);
    });

    it('should not trigger search for identical values', (done) => {
      auditService.getLogs.and.returnValue(of({} as any));
      auditService.getStats.and.returnValue(of({} as any));
      wsService.on.and.returnValue(new Subject());

      component.ngOnInit();

      component.onSearchInput('test');
      component.onSearchInput('test');
      component.onSearchInput('test');

      setTimeout(() => {
        expect(auditService.getLogs).toHaveBeenCalledTimes(2); // 1 initial + 1 unique
        done();
      }, 600);
    });
  });

  describe('Real-time Updates', () => {
    it('should show toast for CRITICAL logs', () => {
      const wsSubject = new Subject<any>();
      wsService.on.and.returnValue(wsSubject);
      wsService.isConnected.and.returnValue(true);
      auditService.getStats.and.returnValue(of({} as any));
      auditService.getLogs.and.returnValue(of({} as any));

      component.ngOnInit();

      const criticalLog = {
        id: '123',
        severity: 'CRITICAL',
        action: 'ADMIN_USER_BAN',
        description: 'User banned',
        createdAt: new Date(),
      };

      wsSubject.next(criticalLog);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'ALERTA CRÍTICO',
        detail: jasmine.stringContaining('ADMIN_USER_BAN'),
        sticky: true,
      });
    });

    it('should update stats on new log', () => {
      const wsSubject = new Subject<any>();
      wsService.on.and.returnValue(wsSubject);
      wsService.isConnected.and.returnValue(true);
      auditService.getStats.and.returnValue(of({} as any));
      auditService.getLogs.and.returnValue(of({} as any));

      component.ngOnInit();

      const newLog = {
        id: '456',
        severity: 'MEDIUM',
        action: 'BOOK_CREATE',
        createdAt: new Date(),
      };

      wsSubject.next(newLog);

      expect(auditService.getStats).toHaveBeenCalledTimes(2); // 1 initial + 1 update
    });

    it('should add new log to list if on page 1 with no filters', () => {
      const wsSubject = new Subject<any>();
      wsService.on.and.returnValue(wsSubject);
      wsService.isConnected.and.returnValue(true);
      auditService.getStats.and.returnValue(of({} as any));
      auditService.getLogs.and.returnValue(
        of({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          filters: {},
        })
      );

      component.ngOnInit();
      component.filters.page = 1;
      component.filters.search = undefined;
      component.filters.severity = undefined;
      component.filters.category = undefined;

      const newLog = {
        id: '789',
        severity: 'LOW',
        action: 'AUTH_LOGIN',
        createdAt: '2026-01-31T12:00:00Z',
      };

      wsSubject.next(newLog);

      expect(component.logs.length).toBe(1);
      expect(component.logs[0].id).toBe('789');
    });
  });

  describe('Export Functionality', () => {
    it('should call export service with correct format', () => {
      component.export('csv');
      expect(auditService.export).toHaveBeenCalledWith(component.filters, 'csv');
    });

    it('should export as JSON when requested', () => {
      component.export('json');
      expect(auditService.export).toHaveBeenCalledWith(component.filters, 'json');
    });
  });

  describe('Filter Management', () => {
    it('should reset page to 1 when filtering', () => {
      component.filters.page = 5;
      auditService.getLogs.and.returnValue(of({} as any));

      component.onFilter();

      expect(component.filters.page).toBe(1);
    });

    it('should clear all filters', () => {
      component.filters.search = 'test';
      component.filters.severity = 'CRITICAL';
      component.filters.category = 'AUTH';
      component.dateRange = [new Date(), new Date()];
      auditService.getLogs.and.returnValue(of({} as any));

      component.clearFilters();

      expect(component.filters.search).toBeUndefined();
      expect(component.filters.severity).toBeUndefined();
      expect(component.filters.category).toBeUndefined();
      expect(component.dateRange).toEqual([]);
    });
  });

  describe('Severity Tag Mapping', () => {
    it('should map LOW to info', () => {
      expect(component.getSeverityTag('LOW')).toBe('info');
    });

    it('should map CRITICAL to danger', () => {
      expect(component.getSeverityTag('CRITICAL')).toBe('danger');
    });
  });

  describe('Category Icon Mapping', () => {
    it('should map AUTH to lock icon', () => {
      expect(component.getCategoryIcon('AUTH')).toBe('pi pi-lock');
    });

    it('should map ADMIN to shield icon', () => {
      expect(component.getCategoryIcon('ADMIN')).toBe('pi pi-shield');
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from WebSocket on destroy', () => {
      const wsSubject = new Subject<any>();
      wsService.on.and.returnValue(wsSubject);
      wsService.isConnected.and.returnValue(true);
      auditService.getStats.and.returnValue(of({} as any));
      auditService.getLogs.and.returnValue(of({} as any));

      component.ngOnInit();
      
      spyOn(wsSubject, 'unsubscribe');
      
      component.ngOnDestroy();

      // Subscription should be cleaned up
    });
  });
});
