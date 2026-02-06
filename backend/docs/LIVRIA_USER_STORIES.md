# 📖 LIVRIA - User Stories (BDD Format)

> **Formato:** Gherkin (Behavior-Driven Development)  
> **Objetivo:** Especificar comportamentos esperados do sistema  
> **Uso:** Base para testes automatizados (Cucumber, Playwright, Cypress)

---

## 📋 Índice

1. [Autenticação](#1-autenticação)
2. [Posts e Feed](#2-posts-e-feed)
3. [Interações Sociais](#3-interações-sociais)
4. [Mensagens Diretas](#4-mensagens-diretas)
5. [Sistema de Livras](#5-sistema-de-livras)
6. [Assinaturas e Planos](#6-assinaturas-e-planos)
7. [Grupos Literários](#7-grupos-literários)
8. [Campanhas de Leitura](#8-campanhas-de-leitura)
9. [Conquistas](#9-conquistas)
10. [Stories](#10-stories)
11. [Busca](#11-busca)
12. [Perfil](#12-perfil)

---

## 1. Autenticação

### US-001: Cadastro de Usuário

```gherkin
Feature: Cadastro de Usuário
  Como um visitante
  Quero criar uma conta gratuita
  Para poder usar a rede social da Livria

  Background:
    Given estou na página de cadastro

  Scenario: Cadastro bem-sucedido
    When preencho o email "joao@example.com"
    And preencho o nome "João Silva"
    And preencho o username "joaosilva"
    And preencho a senha "Senha@123"
    And preencho a confirmação de senha "Senha@123"
    And aceito os termos de uso
    And clico em "Criar Conta"
    Then devo ver a mensagem "Conta criada com sucesso!"
    And devo ser redirecionado para o feed
    And meu plano deve ser "FREE"

  Scenario: Email já cadastrado
    Given existe um usuário com email "existente@example.com"
    When preencho o email "existente@example.com"
    And preencho os demais campos corretamente
    And clico em "Criar Conta"
    Then devo ver o erro "Este email já está em uso"

  Scenario: Username já em uso
    Given existe um usuário com username "joaosilva"
    When preencho o username "joaosilva"
    And preencho os demais campos corretamente
    And clico em "Criar Conta"
    Then devo ver o erro "Este username já está em uso"

  Scenario: Senha fraca
    When preencho a senha "123456"
    And clico em "Criar Conta"
    Then devo ver o erro "A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número"

  Scenario Outline: Validação de campos obrigatórios
    When deixo o campo "<campo>" vazio
    And clico em "Criar Conta"
    Then devo ver o erro "<mensagem>"

    Examples:
      | campo    | mensagem                    |
      | email    | Email é obrigatório         |
      | nome     | Nome é obrigatório          |
      | username | Username é obrigatório      |
      | senha    | Senha é obrigatória         |
```

### US-002: Login

```gherkin
Feature: Login
  Como um usuário cadastrado
  Quero fazer login na minha conta
  Para acessar a plataforma

  Background:
    Given existe um usuário com email "joao@example.com" e senha "Senha@123"
    And estou na página de login

  Scenario: Login bem-sucedido
    When preencho o email "joao@example.com"
    And preencho a senha "Senha@123"
    And clico em "Entrar"
    Then devo ser redirecionado para o feed
    And devo ver meu avatar no header

  Scenario: Credenciais inválidas
    When preencho o email "joao@example.com"
    And preencho a senha "SenhaErrada"
    And clico em "Entrar"
    Then devo ver o erro "Email ou senha incorretos"

  Scenario: Manter conectado
    When faço login com "Manter conectado" marcado
    And fecho o navegador
    And abro o navegador novamente
    Then devo continuar logado

  Scenario: Logout
    Given estou logado como "joao@example.com"
    When clico no meu avatar
    And clico em "Sair"
    Then devo ser redirecionado para a página de login
    And não devo ter acesso ao feed
```

### US-003: Recuperação de Senha

```gherkin
Feature: Recuperação de Senha
  Como um usuário que esqueceu a senha
  Quero recuperar o acesso à minha conta
  Para continuar usando a plataforma

  Scenario: Solicitar recuperação
    Given estou na página de login
    When clico em "Esqueci minha senha"
    And preencho o email "joao@example.com"
    And clico em "Enviar"
    Then devo ver a mensagem "Email de recuperação enviado"
    And um email deve ser enviado para "joao@example.com"

  Scenario: Redefinir senha
    Given recebi um link de recuperação válido
    When acesso o link
    And preencho a nova senha "NovaSenha@123"
    And confirmo a nova senha "NovaSenha@123"
    And clico em "Redefinir"
    Then devo ver a mensagem "Senha alterada com sucesso"
    And devo conseguir fazer login com a nova senha
```

---

## 2. Posts e Feed

### US-004: Criar Post

```gherkin
Feature: Criar Post
  Como um usuário logado
  Quero publicar posts
  Para compartilhar conteúdo com meus seguidores

  Background:
    Given estou logado como "joao@example.com"
    And estou no feed

  Scenario: Criar post de texto
    When clico no campo "No que você está pensando?"
    And digito "Acabei de terminar meu novo capítulo!"
    And clico em "Publicar"
    Then devo ver meu post no topo do feed
    And o post deve mostrar "Acabei de terminar meu novo capítulo!"
    And o post deve mostrar "agora mesmo"

  Scenario: Criar post com imagem
    When clico no campo de post
    And digito "Olha a capa do meu novo livro!"
    And anexo uma imagem "capa.jpg"
    And clico em "Publicar"
    Then devo ver meu post com a imagem anexada
    And a imagem deve estar visível no feed

  Scenario: Post vazio não é permitido
    When clico no campo de post
    And não digito nada
    Then o botão "Publicar" deve estar desabilitado

  Scenario: Post excede limite de caracteres
    When digito um texto com mais de 2000 caracteres
    Then devo ver o contador em vermelho
    And o botão "Publicar" deve estar desabilitado

  Scenario: Criar post sobre livro (BOOK_UPDATE)
    Given tenho um livro chamado "Minha Saga"
    When seleciono "Compartilhar atualização do livro"
    And seleciono o livro "Minha Saga"
    And digito "Novo capítulo disponível!"
    And clico em "Publicar"
    Then devo ver meu post com card do livro anexado
```

### US-005: Feed Personalizado

```gherkin
Feature: Feed Personalizado
  Como um usuário logado
  Quero ver posts das pessoas que sigo
  Para me manter atualizado sobre seus conteúdos

  Background:
    Given estou logado como "joao@example.com"
    And sigo os usuários "maria", "pedro", "ana"

  Scenario: Ver posts de quem sigo
    Given "maria" publicou um post "Oi pessoal!"
    And "pedro" publicou um post "Novo livro saindo!"
    When acesso o feed
    Then devo ver o post de "maria"
    And devo ver o post de "pedro"
    And os posts devem estar ordenados por data (mais recente primeiro)

  Scenario: Não ver posts de quem não sigo
    Given "carlos" publicou um post (e eu não sigo carlos)
    When acesso o feed
    Then não devo ver o post de "carlos"

  Scenario: Feed vazio
    Given não sigo ninguém
    When acesso o feed
    Then devo ver a mensagem "Seu feed está vazio"
    And devo ver o botão "Explorar escritores"

  Scenario: Infinite scroll
    Given existem 50 posts no meu feed
    When acesso o feed
    Then devo ver os primeiros 20 posts
    When rolo até o final da página
    Then mais 20 posts devem ser carregados
```

### US-006: Explore

```gherkin
Feature: Explore
  Como um usuário
  Quero descobrir novos conteúdos e escritores
  Para expandir minha rede

  Scenario: Ver posts em destaque
    Given existem posts populares nas últimas 48h
    When acesso a página Explore
    Then devo ver posts ordenados por engajamento
    And posts com mais curtidas devem aparecer primeiro

  Scenario: Explore como visitante
    Given não estou logado
    When acesso a página Explore
    Then devo ver posts públicos em destaque
    And devo ver botão "Criar conta para interagir"
```

---

## 3. Interações Sociais

### US-007: Curtir Post

```gherkin
Feature: Curtir Post
  Como um usuário logado
  Quero curtir posts que gosto
  Para demonstrar apreciação pelo conteúdo

  Background:
    Given estou logado como "joao@example.com"
    And existe um post de "maria" com 10 curtidas

  Scenario: Curtir um post
    When clico no botão de curtir do post
    Then o ícone de coração deve ficar preenchido
    And o contador deve mostrar "11 curtidas"
    And "maria" deve receber uma notificação
    And "maria" deve ganhar 1 Livra

  Scenario: Descurtir um post
    Given já curti o post de "maria"
    When clico no botão de curtir novamente
    Then o ícone de coração deve ficar vazio
    And o contador deve mostrar "10 curtidas"

  Scenario: Curtida otimista
    When clico no botão de curtir
    Then a UI deve atualizar imediatamente
    And a requisição deve ser enviada em background
```

### US-008: Comentar em Post

```gherkin
Feature: Comentar em Post
  Como um usuário logado
  Quero comentar em posts
  Para participar das discussões

  Background:
    Given estou logado como "joao@example.com"
    And existe um post de "maria"

  Scenario: Adicionar comentário
    When clico em "Comentar"
    And digito "Adorei esse post!"
    And clico em "Enviar"
    Then meu comentário deve aparecer na lista
    And o contador deve mostrar "1 comentário"
    And "maria" deve receber uma notificação

  Scenario: Responder comentário
    Given existe um comentário de "pedro" no post
    When clico em "Responder" no comentário de "pedro"
    And digito "Concordo com você!"
    And clico em "Enviar"
    Then minha resposta deve aparecer indentada abaixo do comentário de "pedro"
    And "pedro" deve receber uma notificação

  Scenario: Deletar próprio comentário
    Given fiz um comentário no post
    When clico em "..." no meu comentário
    And clico em "Excluir"
    And confirmo a exclusão
    Then meu comentário deve ser removido
```

### US-009: Seguir Usuário

```gherkin
Feature: Seguir Usuário
  Como um usuário logado
  Quero seguir outros escritores
  Para ver seus posts no meu feed

  Background:
    Given estou logado como "joao@example.com"
    And existe um usuário "maria" com 100 seguidores

  Scenario: Seguir usuário
    When acesso o perfil de "maria"
    And clico em "Seguir"
    Then o botão deve mudar para "Seguindo"
    And o contador deve mostrar "101 seguidores"
    And "maria" deve receber uma notificação
    And "maria" deve ganhar 5 Livras
    And posts de "maria" devem aparecer no meu feed

  Scenario: Deixar de seguir
    Given já sigo "maria"
    When acesso o perfil de "maria"
    And passo o mouse sobre "Seguindo"
    And clico em "Deixar de seguir"
    Then o botão deve voltar para "Seguir"
    And o contador deve mostrar "100 seguidores"

  Scenario: Não pode seguir a si mesmo
    When acesso meu próprio perfil
    Then não devo ver o botão "Seguir"
```

### US-010: Compartilhar Post

```gherkin
Feature: Compartilhar Post
  Como um usuário logado
  Quero compartilhar posts interessantes
  Para que meus seguidores também vejam

  Background:
    Given estou logado como "joao@example.com"
    And existe um post de "maria"

  Scenario: Compartilhar com citação
    When clico em "Compartilhar"
    And seleciono "Compartilhar com comentário"
    And digito "Vocês precisam ler isso!"
    And clico em "Compartilhar"
    Then um novo post deve ser criado com minha citação
    And o post original deve aparecer embutido
    And o contador de compartilhamentos do post original deve aumentar

  Scenario: Repost simples
    When clico em "Compartilhar"
    And seleciono "Repostar"
    Then o post deve aparecer no meu perfil como repost
```

---

## 4. Mensagens Diretas

### US-011: Enviar Mensagem

```gherkin
Feature: Mensagens Diretas
  Como um usuário logado
  Quero enviar mensagens privadas
  Para conversar diretamente com outros escritores

  Background:
    Given estou logado como "joao@example.com"
    And existe um usuário "maria"

  Scenario: Iniciar conversa
    When acesso o perfil de "maria"
    And clico em "Mensagem"
    And digito "Olá Maria, adorei seu livro!"
    And clico em enviar
    Then a mensagem deve aparecer na conversa
    And "maria" deve receber uma notificação

  Scenario: Receber mensagem em tempo real
    Given estou na página de mensagens
    When "maria" me envia uma mensagem
    Then a mensagem deve aparecer instantaneamente
    And devo ouvir um som de notificação

  Scenario: Ver lista de conversas
    Given tenho conversas com "maria", "pedro", "ana"
    When acesso a página de mensagens
    Then devo ver a lista de conversas
    And conversas com mensagens não lidas devem ter indicador

  Scenario: Limite de mensagens (FREE)
    Given meu plano é FREE
    And já enviei 20 mensagens hoje
    When tento enviar outra mensagem
    Then devo ver o erro "Limite diário atingido"
    And devo ver opção de upgrade
```

---

## 5. Sistema de Livras

### US-012: Ver Saldo de Livras

```gherkin
Feature: Saldo de Livras
  Como um usuário logado
  Quero ver meu saldo de Livras
  Para saber quantas tenho disponíveis

  Background:
    Given estou logado como "joao@example.com"
    And tenho 150 Livras

  Scenario: Ver saldo no header
    When acesso qualquer página
    Then devo ver "150" próximo ao ícone de Livras no header

  Scenario: Ver detalhes do saldo
    When clico no saldo de Livras
    Then devo ser redirecionado para a página de Livras
    And devo ver:
      | Campo          | Valor |
      | Saldo atual    | 150   |
      | Total ganho    | 500   |
      | Total gasto    | 350   |

  Scenario: Animação ao ganhar Livras
    Given alguém curtiu meu post
    Then devo ver animação "+1" no saldo
    And o saldo deve atualizar para "151"
```

### US-013: Ganhar Livras

```gherkin
Feature: Ganhar Livras
  Como um usuário
  Quero ganhar Livras por engajamento
  Para usar em recursos premium

  Scenario Outline: Ganhar Livras por ação
    Given estou logado como "joao@example.com"
    When <ação>
    Then devo ganhar <livras> Livras
    And devo ver uma transação "<tipo>" no histórico

    Examples:
      | ação                          | livras | tipo            |
      | alguém curte meu post         | 1      | EARNED_LIKE     |
      | alguém comenta em meu post    | 2      | EARNED_COMMENT  |
      | alguém me segue               | 5      | EARNED_FOLLOW   |
      | completo uma campanha pequena | 10     | EARNED_CAMPAIGN |
      | desbloqueio conquista         | varies | EARNED_ACHIEVEMENT |
```

### US-014: Gastar Livras

```gherkin
Feature: Gastar Livras
  Como um usuário PREMIUM/PRO
  Quero usar Livras para recursos avançados
  Para criar conteúdo de qualidade

  Background:
    Given estou logado como "joao@example.com"
    And meu plano é "PREMIUM"
    And tenho 50 Livras

  Scenario: Gerar narração TTS
    Given tenho um capítulo pronto
    When clico em "Gerar Narração"
    And confirmo o uso de 10 Livras
    Then a narração deve ser gerada
    And meu saldo deve ser 40 Livras
    And devo ver transação "SPENT_TTS" no histórico

  Scenario: Saldo insuficiente
    Given tenho apenas 5 Livras
    When tento gerar narração (custo: 10)
    Then devo ver o erro "Saldo insuficiente"
    And devo ver opção "Comprar Livras"
```

### US-015: Comprar Livras

```gherkin
Feature: Comprar Livras
  Como um usuário
  Quero comprar pacotes de Livras
  Para ter mais recursos disponíveis

  Scenario: Ver pacotes disponíveis
    When acesso a página de Livras
    And clico na aba "Comprar"
    Then devo ver os pacotes:
      | Nome   | Livras | Preço    |
      | Básico | 50     | R$ 9,90  |
      | Médio  | 150    | R$ 24,90 |
      | Grande | 350    | R$ 49,90 |
      | Mega   | 800    | R$ 99,90 |

  Scenario: Comprar pacote
    When clico em "Comprar" no pacote "Médio"
    Then devo ser redirecionado para o Stripe Checkout
    When completo o pagamento
    Then devo receber 150 Livras
    And devo ver confirmação na página de sucesso
```

---

## 6. Assinaturas e Planos

### US-016: Ver Planos

```gherkin
Feature: Planos de Assinatura
  Como um usuário
  Quero ver os planos disponíveis
  Para escolher o melhor para mim

  Scenario: Comparar planos
    When acesso a página de planos
    Then devo ver comparação entre FREE, PREMIUM e PRO
    And devo ver os benefícios de cada plano
    And o plano atual deve estar destacado
```

### US-017: Assinar Plano

```gherkin
Feature: Assinar Plano
  Como um usuário FREE
  Quero assinar um plano pago
  Para ter acesso a mais recursos

  Background:
    Given estou logado como "joao@example.com"
    And meu plano atual é "FREE"

  Scenario: Assinar PREMIUM
    When acesso a página de planos
    And clico em "Assinar" no plano PREMIUM
    Then devo ser redirecionado para Stripe Checkout
    When completo o pagamento
    Then meu plano deve ser atualizado para "PREMIUM"
    And devo receber 100 Livras
    And devo poder criar livros

  Scenario: Upgrade de PREMIUM para PRO
    Given meu plano é "PREMIUM"
    When clico em "Upgrade" no plano PRO
    And completo o pagamento
    Then meu plano deve ser "PRO"
    And devo receber a diferença de Livras (400)

  Scenario: Cancelar assinatura
    Given meu plano é "PREMIUM"
    When acesso o portal do cliente
    And cancelo minha assinatura
    Then devo ver "Assinatura cancelada"
    And devo manter acesso até o fim do período
```

---

## 7. Grupos Literários

### US-018: Criar Grupo

```gherkin
Feature: Criar Grupo
  Como um usuário PREMIUM/PRO
  Quero criar grupos literários
  Para reunir escritores com interesses comuns

  Background:
    Given estou logado como "joao@example.com"
    And meu plano é "PREMIUM"

  Scenario: Criar grupo público
    When acesso a página de grupos
    And clico em "Criar Grupo"
    And preencho:
      | Campo       | Valor                        |
      | Nome        | Escritores de Fantasia       |
      | Descrição   | Grupo para amantes de fantasia |
      | Privacidade | Público                      |
    And clico em "Criar"
    Then o grupo deve ser criado
    And eu devo ser o dono do grupo
    And devo ser redirecionado para a página do grupo

  Scenario: Limite de grupos (PREMIUM)
    Given já criei 3 grupos
    When tento criar outro grupo
    Then devo ver "Limite de grupos atingido"
    And devo ver opção de upgrade para PRO
```

### US-019: Participar de Grupo

```gherkin
Feature: Participar de Grupo
  Como um usuário
  Quero participar de grupos
  Para interagir com outros escritores

  Scenario: Entrar em grupo público
    Given existe um grupo público "Escritores de Terror"
    When acesso a página do grupo
    And clico em "Entrar"
    Then devo ser membro do grupo
    And devo ver os posts do grupo

  Scenario: Solicitar entrada em grupo privado
    Given existe um grupo privado "Elite Literária"
    When acesso a página do grupo
    And clico em "Solicitar Entrada"
    Then minha solicitação deve ser enviada
    And devo ver "Aguardando aprovação"

  Scenario: Sair do grupo
    Given sou membro do grupo "Escritores de Terror"
    When clico em "Sair do Grupo"
    And confirmo a saída
    Then não devo mais ser membro
```

---

## 8. Campanhas de Leitura

### US-020: Criar Campanha

```gherkin
Feature: Criar Campanha de Leitura
  Como administrador de um grupo
  Quero criar campanhas de leitura
  Para incentivar a leitura entre os membros

  Background:
    Given estou logado como "joao@example.com"
    And sou admin do grupo "Clube do Livro"

  Scenario: Criar campanha
    When acesso a página do grupo
    And clico em "Nova Campanha"
    And preencho:
      | Campo        | Valor                 |
      | Nome         | Leitura de Janeiro    |
      | Descrição    | Vamos ler 3 livros!   |
      | Data início  | 01/01/2025            |
      | Data fim     | 31/01/2025            |
      | Recompensa   | 50 Livras             |
    And adiciono 3 livros à campanha
    And clico em "Criar"
    Then a campanha deve ser criada
    And membros devem ser notificados
```

### US-021: Participar de Campanha

```gherkin
Feature: Participar de Campanha
  Como membro de um grupo
  Quero participar de campanhas
  Para ganhar Livras lendo

  Background:
    Given estou logado como "joao@example.com"
    And sou membro do grupo "Clube do Livro"
    And existe uma campanha ativa com 3 livros

  Scenario: Ver progresso
    When acesso a campanha
    Then devo ver meu progresso (0 de 3 livros)
    And devo ver a lista de livros

  Scenario: Marcar livro como lido
    When clico em "Marcar como lido" no livro 1
    Then meu progresso deve atualizar para "1 de 3"
    And devo ver "33% completo"

  Scenario: Completar campanha
    Given já li 2 livros
    When marco o terceiro livro como lido
    Then devo ver "Campanha Completa!"
    And devo ganhar 50 Livras
    And devo ver animação de celebração
```

---

## 9. Conquistas

### US-022: Desbloquear Conquista

```gherkin
Feature: Desbloquear Conquistas
  Como um usuário
  Quero desbloquear conquistas
  Para ganhar Livras e mostrar meu progresso

  Scenario Outline: Conquistas automáticas
    Given estou logado como "joao@example.com"
    When <ação>
    Then devo desbloquear a conquista "<conquista>"
    And devo ganhar <livras> Livras
    And devo ver toast de conquista desbloqueada

    Examples:
      | ação                    | conquista        | livras |
      | publico meu 1º post     | Primeira Voz     | 10     |
      | crio meu 1º livro       | Primeiro Livro   | 10     |
      | ganho meu 1º seguidor   | Primeiro Fã      | 5      |
      | alcanço 10 seguidores   | Fazendo Barulho  | 10     |
      | alcanço 100 seguidores  | Influente        | 50     |
      | publico 50 posts        | Voz Ativa        | 30     |
      | entro em um grupo       | Socializando     | 5      |
```

### US-023: Ver Conquistas

```gherkin
Feature: Ver Conquistas
  Como um usuário
  Quero ver minhas conquistas
  Para acompanhar meu progresso

  Scenario: Ver lista de conquistas
    When acesso a página de conquistas
    Then devo ver todas as conquistas disponíveis
    And conquistas desbloqueadas devem estar coloridas
    And conquistas bloqueadas devem estar em cinza
    And devo ver "X de Y desbloqueadas"

  Scenario: Ver conquistas no perfil
    When acesso o perfil de "maria"
    Then devo ver as conquistas desbloqueadas de "maria"
```

---

## 10. Stories

### US-024: Criar Story

```gherkin
Feature: Criar Story
  Como um usuário logado
  Quero criar stories
  Para compartilhar momentos efêmeros

  Background:
    Given estou logado como "joao@example.com"

  Scenario: Criar story de texto
    When clico em "+" na barra de stories
    And seleciono "Texto"
    And digito "Escrevendo o capítulo final!"
    And seleciono cor de fundo "Azul"
    And clico em "Publicar"
    Then meu story deve ser criado
    And deve expirar em 24 horas

  Scenario: Criar story com imagem
    When clico em "+" na barra de stories
    And seleciono "Imagem"
    And faço upload de uma foto
    And adiciono texto "Meu cantinho de escrita"
    And clico em "Publicar"
    Then meu story deve ser criado com a imagem

  Scenario: Limite de stories (FREE)
    Given meu plano é FREE
    And já criei 3 stories hoje
    When tento criar outro story
    Then devo ver "Limite diário atingido"
```

### US-025: Ver Stories

```gherkin
Feature: Ver Stories
  Como um usuário logado
  Quero ver stories de quem sigo
  Para me manter atualizado

  Background:
    Given estou logado como "joao@example.com"
    And sigo "maria" que tem 3 stories

  Scenario: Ver stories no feed
    When acesso o feed
    Then devo ver a barra de stories no topo
    And o avatar de "maria" deve ter borda colorida

  Scenario: Assistir stories
    When clico no avatar de "maria"
    Then devo ver o story em tela cheia
    And deve haver barra de progresso
    And o story deve avançar automaticamente em 5s

  Scenario: Navegação por gestos
    Given estou vendo um story
    When toco no lado direito
    Then devo ir para o próximo story
    When toco no lado esquerdo
    Then devo voltar ao story anterior
    When arrasto para baixo
    Then devo fechar o visualizador

  Scenario: Stories expirados
    Given "maria" tinha stories que expiraram
    When acesso o feed
    Then não devo ver os stories expirados de "maria"
```

---

## 11. Busca

### US-026: Busca Global

```gherkin
Feature: Busca Global
  Como um usuário
  Quero buscar conteúdo na plataforma
  Para encontrar escritores e livros

  Scenario: Buscar por usuário
    When digito "maria" na busca
    And seleciono a aba "Usuários"
    Then devo ver usuários com "maria" no nome ou username

  Scenario: Buscar por livro
    When digito "fantasia" na busca
    And seleciono a aba "Livros"
    Then devo ver livros com "fantasia" no título ou descrição

  Scenario: Buscar por post
    When digito "novo capítulo" na busca
    And seleciono a aba "Posts"
    Then devo ver posts contendo "novo capítulo"

  Scenario: Buscar por grupo
    When digito "terror" na busca
    And seleciono a aba "Grupos"
    Then devo ver grupos com "terror" no nome

  Scenario: Busca vazia
    When digito "xyzabc123"
    Then devo ver "Nenhum resultado encontrado"
```

---

## 12. Perfil

### US-027: Ver Perfil

```gherkin
Feature: Ver Perfil
  Como um usuário
  Quero ver perfis de escritores
  Para conhecer seu trabalho

  Scenario: Ver perfil público
    When acesso o perfil de "maria"
    Then devo ver:
      | Campo       | Valor              |
      | Nome        | Maria Silva        |
      | Bio         | Escritora de romance |
      | Seguidores  | 150                |
      | Seguindo    | 80                 |
    And devo ver os posts de "maria"
    And devo ver os livros de "maria"
    And devo ver as conquistas de "maria"

  Scenario: Ver próprio perfil
    When acesso meu perfil
    Then devo ver botão "Editar Perfil"
    And devo ver estatísticas completas
```

### US-028: Editar Perfil

```gherkin
Feature: Editar Perfil
  Como um usuário logado
  Quero editar meu perfil
  Para manter minhas informações atualizadas

  Scenario: Atualizar informações
    When acesso meu perfil
    And clico em "Editar Perfil"
    And altero minha bio para "Novo escritor de ficção científica"
    And clico em "Salvar"
    Then minha bio deve ser atualizada
    And devo ver mensagem de sucesso

  Scenario: Atualizar avatar
    When acesso edição de perfil
    And faço upload de nova foto
    Then meu avatar deve ser atualizado em toda a plataforma

  Scenario: Username único
    Given existe usuário "joaosilva"
    When tento mudar meu username para "joaosilva"
    Then devo ver erro "Username já em uso"
```

---

## 📝 Notas de Implementação

### Ferramentas Recomendadas

```bash
# Playwright (recomendado para E2E)
npm install -D @playwright/test

# Cucumber para BDD
npm install -D @cucumber/cucumber

# Cypress (alternativa)
npm install -D cypress
```

### Estrutura de Testes

```
tests/
├── e2e/
│   ├── features/
│   │   ├── auth.feature
│   │   ├── posts.feature
│   │   ├── social.feature
│   │   └── ...
│   ├── steps/
│   │   ├── auth.steps.ts
│   │   ├── posts.steps.ts
│   │   └── ...
│   └── support/
│       ├── hooks.ts
│       └── world.ts
├── integration/
└── unit/
```

### Exemplo de Step Definition

```typescript
// tests/e2e/steps/auth.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('estou na página de cadastro', async function() {
  await this.page.goto('/register');
});

When('preencho o email {string}', async function(email: string) {
  await this.page.fill('[data-testid="email-input"]', email);
});

Then('devo ver a mensagem {string}', async function(message: string) {
  const toast = this.page.locator('[data-testid="toast"]');
  await expect(toast).toContainText(message);
});
```

---

**Total de User Stories:** 28  
**Total de Scenarios:** 100+  
**Cobertura:** Autenticação, Social, Gamificação, Grupos, Mobile
