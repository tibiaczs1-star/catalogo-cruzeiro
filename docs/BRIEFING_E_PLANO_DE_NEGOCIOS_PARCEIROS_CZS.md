# BRIEFING EXECUTIVO & PLANO DE NEGÓCIOS PARA PARCEIROS
## CATÁLOGO CZS — Jornalismo Original, Checagem de Fatos e Utilidade Pública do Vale do Juruá

**Endereço Oficial em Produção:** `https://catalogo-cruzeiro-web.onrender.com/`  
**Região de Atuação Primária:** Cruzeiro do Sul, Mâncio Lima, Rodrigues Alves, Porto Walter, Marechal Thaumaturgo, Guajará e todo o Estado do Acre.  
**Padrão Editorial:** Inspirado no *The New York Times* (rigor autoral e tipografia clássica), *Semafor* (separação explícita entre fato verificado e divergências entre veículos) e *Nexo Jornal* (contexto claro e serviço público).

---

## 1. Briefing Executivo: O que é o Novo Catálogo CZS?

O **Catálogo CZS** deixou de ser apenas um agregador regional para operar como a **primeira plataforma de Jornalismo Autoral, Checagem Automática de Fatos (*Fact-Checking*) e Inteligência Cidadã do Vale do Juruá**.

### Os 4 Pilares que Diferenciam o Catálogo CZS no Mercado Regional
1. **Zero Cópia / Jornalismo 100% Autoral e Verificado:**
   - Diferente de blogs que copiam e colam releases de assessoria, o motor editorial do Catálogo CZS estuda simultaneamente **77 fontes regionais, amazônicas e nacionais**, cruza informações com a apuração própria da **Redação CZS (`/editores`)**, elimina réplicas repetidas e entrega uma reportagem autoral com o bloco **"Por que importa (*Nut Graph*)"**.
2. **Auditoria de Incoerências entre Jornais:**
   - Sempre que dois ou mais veículos publicam números, valores financeiros (`R$`), datas ou versões conflitantes sobre o mesmo fato, o Catálogo CZS **explicita a divergência** em um quadro dedicado dentro da matéria (*"Checagem de Fatos & Comparação entre Jornais"*), protegendo o leitor e o anunciante contra desinformação.
3. **Padrão Visual e Credibilidade de Grande Imprensa:**
   - Design limpo em papel creme (`#faf7f0`) e tinta carvão (`#121923`), sem poluição visual. Quando uma ocorrência não possui fotografia captada no local, o sistema gera automaticamente uma **Ilustração Editorial Vetorial Padrão NYT** sob medida para o tema da notícia.
4. **Participação Cidadã por Bairro e Motor Diário de Serviços:**
   - Cada reportagem conta com a seção **"Voz do Cidadão"**, onde moradores de Cruzeiro do Sul e região registram relatos identificados por bairro/município, além do **Motor Diário** (Nível do Rio Juruá, Clima, Saúde, Energia, Empregos e Utilidade Pública).

---

## 2. Plano de Negócios e Modelos de Parceria Comercial

### 2.1. Proposta de Valor para o Parceiro / Anunciante
Anunciar em portais comuns expõe marcas locais a páginas poluídas, notícias repetidas e cliques acidentais. No **Catálogo CZS**, a marca do parceiro é associada a **credibilidade, utilidade diária e retenção real de leitura**:
- **Atenção Qualificada:** O leitor abre o dossiê completo da matéria para ler a checagem de fatos, ouvir a narração em áudio e consultar os relatos do seu bairro.
- **Custo Operacional Enxuto = Melhor Retorno (ROI) para o Parceiro:** Arquitetura própria em nuvem com disco persistente e IA editorial integrada a custo marginal zero, permitindo pacotes acessíveis para empresas do Juruá com entrega de nível nacional.

### 2.2. Formatos Comerciais e Cotas de Patrocínio

| Cota / Produto Comercial | Onde Aparece | Entrega & Benefício para o Parceiro |
| :--- | :--- | :--- |
| **1. Patrocinador Master de Capa & Feed Nativo** *(Ex.: Telecom, Bancos, Grandes Varejistas)* | Card nativo editorial integrado ao fluxo principal + destaque fixo com CTA direto para WhatsApp comercial. | Alta conversão direta via link parametrizado (`wa.me`), com visual editorial integrado que não parece banner invasivo. |
| **2. Patrocínio de Editoria & Motor Diário** *(Ex.: Hospitais/Clínicas em Saúde; Faculdades em Educação; Agro/Comércio em Economia)* | Assinatura *"Oferecimento [Marca]"* nos cards do **Motor Diário** (Rio Juruá, Clima, Saúde, Energia) e nas matérias checadas da editoria escolhida. | Associação direta da marca a um serviço essencial consultado todos os dias pelos moradores de Cruzeiro do Sul. |
| **3. Publieditorial Verificado & Guia de Serviços Locais** *(Comércio, Hotéis, Restaurantes, Profissionais)* | Reportagem especial produzida pela Redação CZS com selo claro *"Publicação Patrocinada"*, hospedada com SEO permanente e compartilhamento pronto para WhatsApp. | Posicionamento no Google (SEO + Schema.org + Sitemap XML) e distribuição permanente no catálogo da cidade. |
| **4. Boletim Diário WhatsApp & Áudio-Resumo** | Assinatura de patrocínio no botão *"📲 Copiar Resumo Verificado para WhatsApp"* e na abertura do leitor de áudio das reportagens. | Alcance orgânico viral nos grupos de WhatsApp de Cruzeiro do Sul e municípios do Vale do Juruá. |

### 2.3. Métricas Transparentes Entregues ao Parceiro
- **Painel de Métricas Reais (`/editores` → aba *Métricas*):** Contagem auditável de visualizações de matérias (`views`) e cliques diretos em mídia/CTA (`clicks`), sem números inflados por bots.
- **Segurança de Marca (*Brand Safety*):** Filtro automático de qualidade editorial que impede que o anúncio do parceiro apareça ao lado de conteúdo quebrado, falso ou ofensivo.

---

## 3. Resumo de Ativos Técnicos prontos para Demonstração ao Parceiro
- **Portal Ao Vivo:** `https://catalogo-cruzeiro-web.onrender.com/`
- **Dossiê de Checagem & Incoerências (API):** `GET /api/articles/:slug/dossier`
- **Feed RSS Oficial de Matérias Originais:** `https://catalogo-cruzeiro-web.onrender.com/rss.xml`
- **Sitemap SEO para Google News:** `https://catalogo-cruzeiro-web.onrender.com/sitemap.xml`
- **Sub-aplicação Educacional & Voz (Dom Pedro II Voice + APK Android):** `https://catalogo-cruzeiro-web.onrender.com/dom-pedro-ii/`
