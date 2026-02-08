import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuditService } from '../../../../core/services/audit.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { AuditLog, AuditQueryFilters, AuditStats, AuditSeverity, AuditCategory } from '../../../../core/models/audit.model';
import { finalize, Subscription as RxSubscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    TagModule,
    CardModule,
    DialogModule,
    TooltipModule,
    SelectButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  private auditService = inject(AuditService);
  private wsService = inject(WebSocketService);
  private messageService = inject(MessageService);

  // Data
  logs: AuditLog[] = [];
  stats?: AuditStats;
  totalRecords = 0;
  loading = true;
  private wsSubscription?: RxSubscription;

  // Filters
  filters: AuditQueryFilters = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };

  // UI State
  selectedLog?: AuditLog;
  displayDetail = false;
  dateRange: Date[] = [];
  
  // Search debounce
  private searchSubject = new Subject<string>();
  private searchSubscription?: RxSubscription;

  // Options
  severities = [
    { label: 'Todos', value: null },
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Critical', value: 'CRITICAL' }
  ];

  categories = [
    { label: 'Todas', value: null },
    { label: 'Autenticação', value: 'AUTH' },
    { label: 'Livros', value: 'BOOK' },
    { label: 'Capítulos', value: 'CHAPTER' },
    { label: 'Falas', value: 'SPEECH' },
    { label: 'Narração', value: 'NARRATION' },
    { label: 'Social', value: 'SOCIAL' },
    { label: 'Financeiro', value: 'FINANCIAL' },
    { label: 'Sistema', value: 'SYSTEM' },
    { label: 'Admin', value: 'ADMIN' }
  ];

  ngOnInit(): void {
    this.refreshStats();
    this.loadLogs();
    this.setupRealtimeEntries();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.wsSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  setupSearchDebounce(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filters.search = searchTerm;
      this.onFilter();
    });
  }

  setupRealtimeEntries(): void {
    // Ensure WS is connected
    if (!this.wsService.isConnected()) {
      this.wsService.connect();
    }

    this.wsSubscription = this.wsService.on<any>('audit:new').subscribe(log => {
      // 1. Atualiza estatísticas
      this.refreshStats();

      // 2. Se for CRÍTICO, mostra toast
      if (log.severity === 'CRITICAL') {
        this.messageService.add({
          severity: 'error',
          summary: 'ALERTA CRÍTICO',
          detail: `${log.action}: ${log.description || ''}`,
          sticky: true
        });
      }

      // 3. Adiciona na lista se não houver filtros/busca e estiver na pag 1
      const hasNoFilters = !this.filters.search && !this.filters.severity && !this.filters.category && !this.filters.startDate;
      if (this.filters.page === 1 && hasNoFilters) {
        // Converte data raw para Date
        const newLog = { ...log, createdAt: new Date(log.createdAt) };
        this.logs = [newLog, ...this.logs.slice(0, 9)]; // Mantém paginado
        this.totalRecords++;
      }
    });
  }

  loadLogs(event?: any): void {
    this.loading = true;

    if (event) {
      this.filters.page = (event.first / event.rows) + 1;
      this.filters.limit = event.rows;
      if (event.sortField) {
        this.filters.sortBy = event.sortField;
        this.filters.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
      }
    }

    // Update dates if set
    if (this.dateRange && this.dateRange[0]) {
      this.filters.startDate = this.dateRange[0].toISOString();
    } else {
      delete this.filters.startDate;
    }
    
    if (this.dateRange && this.dateRange[1]) {
      this.filters.endDate = this.dateRange[1].toISOString();
    } else {
      delete this.filters.endDate;
    }

    this.auditService.getLogs(this.filters)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (result) => {
          this.logs = result.data;
          this.totalRecords = result.pagination.total;
        },
        error: (err) => console.error('Erro ao carregar logs:', err)
      });
  }

  refreshStats(): void {
    this.auditService.getStats().subscribe(stats => this.stats = stats);
  }

  onFilter(): void {
    this.filters.page = 1;
    this.loadLogs();
  }
  
  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  clearFilters(): void {
    this.filters = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    this.dateRange = [];
    this.loadLogs();
  }

  showDetail(log: AuditLog): void {
    this.selectedLog = log;
    this.displayDetail = true;
  }

  export(format: 'csv' | 'json'): void {
    this.auditService.export(this.filters, format);
  }

  getSeverityTag(severity: AuditSeverity): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (severity) {
      case 'LOW': return 'info';
      case 'MEDIUM': return 'success';
      case 'HIGH': return 'warn';
      case 'CRITICAL': return 'danger';
      default: return 'secondary';
    }
  }

  getCategoryIcon(category: AuditCategory): string {
    switch (category) {
      case 'AUTH': return 'pi pi-lock';
      case 'BOOK': return 'pi pi-book';
      case 'SOCIAL': return 'pi pi-users';
      case 'FINANCIAL': return 'pi pi-money-bill';
      case 'SYSTEM': return 'pi pi-cog';
      case 'ADMIN': return 'pi pi-shield';
      default: return 'pi pi-info-circle';
    }
  }

  formatMetadata(metadata: any): string {
    if (!metadata) return '';
    return JSON.stringify(metadata, null, 2);
  }
}
