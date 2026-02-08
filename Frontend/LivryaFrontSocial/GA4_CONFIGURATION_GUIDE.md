# 📊 Guia de Configuração do Google Analytics 4

Este documento descreve como configurar o GA4 para aproveitar ao máximo os eventos implementados na LIVRIA.

## 🎯 Configuração de Conversões

### Passos para Configurar Conversões no GA4

1. Acesse **Admin** > **Events** no GA4
2. Encontre o evento desejado
3. Ative o toggle "Mark as conversion"

### Conversões Recomendadas

| Evento | Prioridade | Descrição |
|--------|------------|-----------|
| `sign_up` | Alta | Novo usuário cadastrado |
| `create_book` | Alta | Primeiro livro criado |
| `generate_tts` | Média | Uso de feature premium |
| `conversion_first_book` | Alta | Conversão primária |
| `conversion_first_narration` | Média | Conversão secundária |
| `conversion_premium` | Alta | Assinatura premium |

---

## 📈 Configuração de Funis (Explorations)

### Funil de Registro de Usuário

**Nome**: User Registration Funnel

**Passos**:
1. `funnel_step` where `funnel_name = 'user_registration'` AND `step_name = 'start'`
2. `funnel_step` where `step_name = 'email_entered'`
3. `funnel_step` where `step_name = 'password_entered'`
4. `funnel_step` where `step_name = 'profile_completed'`
5. `funnel_step` where `step_name = 'verified'`

**Como criar**:
1. Vá para **Explore** no GA4
2. Clique em "Funnel exploration"
3. Adicione os steps acima
4. Configure "Open funnel" para análise não-linear

### Funil de Criação de Livro

**Nome**: Book Creation Funnel

**Passos**:
1. `funnel_step` where `funnel_name = 'book_creation'` AND `step_name = 'start'`
2. `funnel_step` where `step_name = 'title_entered'`
3. `funnel_step` where `step_name = 'details_filled'`
4. `funnel_step` where `step_name = 'cover_uploaded'`
5. `funnel_step` where `step_name = 'published'`

### Funil de Narração

**Nome**: Narration Creation Funnel

**Passos**:
1. `funnel_step` where `funnel_name = 'narration_creation'` AND `step_name = 'chapter_selected'`
2. `funnel_step` where `step_name = 'speeches_added'`
3. `funnel_step` where `step_name = 'characters_assigned'`
4. `funnel_step` where `step_name = 'tts_generated'`
5. `funnel_step` where `step_name = 'audio_reviewed'`

---

## 🎨 Custom Dimensions

### Configuração de Dimensões Personalizadas

1. Acesse **Admin** > **Custom definitions**
2. Clique em "Create custom dimension"

### Dimensões Recomendadas

| Nome | Scope | Event Parameter |
|------|-------|-----------------|
| User Type | User | `user_type` |
| Is Creator | User | `is_creator` |
| Books Count | User | `books_count` |
| Experiment Variant | User | `exp_*` |
| Content Type | Event | `content_type` |
| Funnel Name | Event | `funnel_name` |
| Step Name | Event | `step_name` |

---

## 🔔 Configuração de Alertas

### Alertas Recomendados

1. **Queda de Conversões**
   - Métrica: `sign_up` events
   - Condição: Diminuir > 20% comparado à semana anterior
   - Frequência: Diária

2. **Aumento de Erros**
   - Métrica: `error` events
   - Condição: Aumentar > 50% comparado ao dia anterior
   - Frequência: Diária

3. **Abandono de Funil**
   - Métrica: `funnel_abandon` events
   - Condição: Aumentar > 30%
   - Frequência: Semanal

4. **Performance Degradada**
   - Métrica: `web_vitals` where `metric_name = 'LCP'`
   - Condição: Valor médio > 2500ms
   - Frequência: Diária

### Como Criar Alertas

1. Vá para **Admin** > **Custom Insights**
2. Clique em "Create"
3. Selecione "Create new insight"
4. Configure as condições conforme acima

---

## 🧪 A/B Testing com GA4

### Usando o ABTestingService

O `ABTestingService` implementado permite:

```typescript
// No componente
constructor(private abTesting: ABTestingService) {}

ngOnInit() {
  // Obter variante do experimento
  const variant = this.abTesting.getVariant(EXPERIMENTS.CTA_BUTTON_TEXT);

  // Aplicar variante
  if (variant === 'variant_a') {
    this.buttonText = 'Comece Agora';
  } else if (variant === 'variant_b') {
    this.buttonText = 'Criar Meu Livro';
  } else {
    this.buttonText = 'Começar'; // control
  }
}

// Quando ocorrer conversão
onBookCreated() {
  this.abTesting.trackExperimentConversion(
    EXPERIMENTS.CTA_BUTTON_TEXT.id,
    'book_created'
  );
}
```

### Analisando Resultados no GA4

1. Vá para **Explore** > "Free form"
2. Adicione dimensão: `exp_[experiment_id]`
3. Adicione métricas: Conversões desejadas
4. Compare variantes

### Experimentos Pré-definidos

| ID | Nome | Variantes |
|----|------|-----------|
| `cta_button_text_v1` | CTA Button Text | control, variant_a, variant_b |
| `onboarding_flow_v1` | Onboarding Flow | standard, simplified, guided |
| `pricing_layout_v1` | Pricing Layout | horizontal, vertical |

---

## 📊 Dashboards Recomendados

### Dashboard de Aquisição

**Métricas**:
- Novos usuários (sign_up)
- Origem do tráfego (campaign_hit)
- Taxa de conversão de visitante para usuário

**Dimensões**:
- campaign_source
- campaign_medium
- user_type

### Dashboard de Engajamento

**Métricas**:
- Livros criados (create_book)
- Capítulos criados (create_chapter)
- TTS gerados (generate_tts)
- Tempo médio na página

**Dimensões**:
- content_type
- is_creator
- books_count

### Dashboard de Retenção

**Métricas**:
- Usuários ativos (DAU, WAU, MAU)
- Retorno de usuários (user_return)
- Re-engajamento (feature_reengagement)

**Dimensões**:
- days_since_last_visit
- feature_name

### Dashboard de Performance

**Métricas**:
- LCP, FID, CLS (web_vitals)
- Erros por tipo
- Taxa de abandono de funil

**Dimensões**:
- metric_name
- metric_rating
- error_type

---

## 🔗 Integração com Looker Studio

### Conectando GA4 ao Looker Studio

1. Acesse [Looker Studio](https://lookerstudio.google.com)
2. Crie novo relatório
3. Adicione fonte de dados: Google Analytics
4. Selecione a propriedade GA4: `G-0VZYW339W8`

### Templates Recomendados

- **Executive Dashboard**: Métricas de alto nível para stakeholders
- **Product Dashboard**: Métricas de uso de features
- **Marketing Dashboard**: Atribuição de campanhas e conversões

---

## 📱 Configuração de Audiences

### Audiências Recomendadas

1. **Active Writers**
   - Condição: `create_book` OR `create_chapter` nos últimos 7 dias

2. **Power Users**
   - Condição: `books_count >= 5`

3. **TTS Users**
   - Condição: `generate_tts` nos últimos 30 dias

4. **At-Risk Users**
   - Condição: Última sessão > 14 dias atrás

5. **Premium Prospects**
   - Condição: `generate_tts` >= 10 AND NOT `user_type = 'premium'`

### Como Criar Audiências

1. Vá para **Admin** > **Audiences**
2. Clique em "New audience"
3. Configure as condições
4. Salve e aguarde população

---

## 📅 Manutenção e Monitoramento

### Checklist Semanal

- [ ] Verificar se eventos estão sendo recebidos
- [ ] Revisar taxas de conversão de funis
- [ ] Analisar resultados de A/B tests
- [ ] Verificar alertas disparados

### Checklist Mensal

- [ ] Revisar e limpar experimentos encerrados
- [ ] Atualizar audiências conforme necessário
- [ ] Gerar relatório de performance
- [ ] Revisar custom dimensions

---

## 🆘 Troubleshooting

### Eventos não aparecem no GA4

1. Verifique se `gtag` está carregado
2. Use o [GA4 DebugView](https://support.google.com/analytics/answer/7201382)
3. Verifique o console do browser por erros

### Conversões não estão sendo registradas

1. Confirme que o evento está marcado como conversão
2. Aguarde até 24h para dados aparecerem
3. Verifique filtros ativos

### A/B Test não está funcionando

1. Verifique localStorage para assignments
2. Confirme que o experimento está ativo
3. Use `forceVariant()` para testes

---

**Última atualização**: 11 Janeiro 2026
**Versão**: 1.0.0
