# -*- coding: utf-8 -*-
"""
Gerador de Apresentação Executiva / Pitch Deck: Dom Pedro II Voice
Formato Widescreen 16:9, padrão profissional de alta fidelidade visual.
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # layout em branco

    # Cores da Identidade Visual
    BG_DARK = RGBColor(11, 19, 43)        # #0B132B Azul Marinho Profundo
    BG_CARD = RGBColor(28, 37, 65)        # #1C2541 Azul Card Escuro
    BG_LIGHT_CARD = RGBColor(248, 249, 250) # #F8F9FA
    RED_IMPERIAL = RGBColor(181, 29, 45)  # #B51D2D Vermelho Brasão
    GOLD = RGBColor(245, 196, 91)         # #F5C45B Dourado Nobre
    GOLD_DARK = RGBColor(212, 154, 26)    # #D49A1A
    TEXT_WHITE = RGBColor(255, 255, 255)
    TEXT_MUTED = RGBColor(170, 185, 205)
    TEXT_DARK = RGBColor(30, 41, 59)
    GREEN_ACCENT = RGBColor(46, 204, 113) # Verde Sucesso / Vida
    CYAN_ACCENT = RGBColor(79, 195, 247)  # Ciano IA / Tecnologia

    brand_dir = r"C:\Users\junio\catalogo-cruzeiro\dom-pedro-ii\assets\brand"
    crest_path = os.path.join(brand_dir, "crest-512.png")
    campus_path = os.path.join(brand_dir, "campus.jpg")
    hero_path = os.path.join(brand_dir, "escola-hero.jpg")
    desfile_path = os.path.join(brand_dir, "desfile.jpg")

    def add_background(slide, color):
        shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = color
        shape.line.fill.background()
        return shape

    def add_header(slide, tag_text, title_text, category_color=GOLD):
        # Tag pill
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(5), Inches(0.4))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = category_color

        # Título principal
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.7), Inches(0.9))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        p_t = tf_t.paragraphs[0]
        p_t.text = title_text
        p_t.font.size = Pt(26)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE

    def add_card(slide, left, top, width, height, fill_color=BG_CARD, border_color=None):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = fill_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1.5)
        else:
            card.line.fill.background()
        return card

    # =========================================================================
    # SLIDE 1: CAPA INSTITUCIONAL DE IMPACTO
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_background(s1, BG_DARK)

    # Imagem de fundo com overlay sutil ou imagem lateral
    if os.path.exists(hero_path):
        s1.shapes.add_picture(hero_path, Inches(6.8), Inches(0), Inches(6.533), Inches(7.5))
        # Overlay escuro sobre a borda para transição
        trans_card = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.5), Inches(0), Inches(1.5), Inches(7.5))
        trans_card.fill.solid()
        trans_card.fill.fore_color.rgb = BG_DARK
        trans_card.line.fill.background()

    # Brasão
    if os.path.exists(crest_path):
        s1.shapes.add_picture(crest_path, Inches(0.8), Inches(0.8), Inches(1.4), Inches(1.4))

    # Selo
    selo_box = s1.shapes.add_textbox(Inches(2.4), Inches(0.95), Inches(4.5), Inches(0.5))
    tf_selo = selo_box.text_frame
    p_selo = tf_selo.paragraphs[0]
    p_selo.text = "COLÉGIO MILITAR DOM PEDRO II • CRUZEIRO DO SUL / AC"
    p_selo.font.size = Pt(11)
    p_selo.font.bold = True
    p_selo.font.color.rgb = GOLD

    # Título Gigante
    t_box = s1.shapes.add_textbox(Inches(0.8), Inches(2.2), Inches(5.8), Inches(2.2))
    tf = t_box.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "DOM PEDRO II"
    p1.font.size = Pt(40)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE
    p2 = tf.add_paragraph()
    p2.text = "VOICE INTELLIGENCE"
    p2.font.size = Pt(36)
    p2.font.bold = True
    p2.font.color.rgb = RED_IMPERIAL

    # Subtítulo Descritivo
    sub_box = s1.shapes.add_textbox(Inches(0.8), Inches(4.5), Inches(5.6), Inches(1.5))
    tf_sub = sub_box.text_frame
    tf_sub.word_wrap = True
    p_sub = tf_sub.paragraphs[0]
    p_sub.text = "A Revolução da IA Vocal na Educação Pública: Reforço Escolar Humanizado, Acolhimento Socioemocional e Biometria de Prevenção a Riscos no Vale do Juruá."
    p_sub.font.size = Pt(14)
    p_sub.font.color.rgb = TEXT_MUTED

    # Badges inferiores da Capa
    badges = [
        ("100% GRATUITO", "R$ 0,00 para alunos e rede", GREEN_ACCENT),
        ("MODULAR & EXPANSIVO", "Pronto para toda a rede", CYAN_ACCENT),
        ("PROTEÇÃO DA VIDA", "Biometria vocal & SOS", GOLD)
    ]
    for i, (b_title, b_sub, b_col) in enumerate(badges):
        bx = Inches(0.8 + i * 1.9)
        by = Inches(6.1)
        add_card(s1, bx, by, Inches(1.8), Inches(0.9), BG_CARD, b_col)
        tb = s1.shapes.add_textbox(bx, by, Inches(1.8), Inches(0.9))
        ptb = tb.text_frame
        ptb.word_wrap = True
        p_bt = ptb.paragraphs[0]
        p_bt.text = b_title
        p_bt.font.size = Pt(10)
        p_bt.font.bold = True
        p_bt.font.color.rgb = b_col
        p_bs = ptb.add_paragraph()
        p_bs.text = b_sub
        p_bs.font.size = Pt(8.5)
        p_bs.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 2: O CENÁRIO E OS DESAFIOS EM CRUZEIRO DO SUL
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_background(s2, BG_DARK)
    add_header(s2, "Diagnóstico Real • Amazônia Ocidental", "Os Desafios da Educação e Proteção no Vale do Juruá")

    desafios = [
        ("01", "Distâncias e Isolamento Geográfico",
         "No interior do Acre, o acesso a professores particulares e tutoria de alto nível é privilégio de poucos. Alunos voltam para casa com dúvidas que se acumulam até virarem reprovação ou abandono.",
         RED_IMPERIAL),
        ("02", "A Epidemia Silenciosa da Saúde Mental",
         "O isolamento, pressões familiares e vulnerabilidades sociais geram crises de ansiedade e depressão na juventude que raramente são verbalizadas na sala de aula tradicional.",
         GOLD),
        ("03", "A Visão Fragmentada da Equipe Pedagógica",
         "Professores e diretores só descobrem que a turma inteira não compreendeu um conteúdo nas provas bimestrais, quando o tempo pedagógico de correção já foi perdido.",
         CYAN_ACCENT)
    ]

    for i, (num, titulo, desc, cor) in enumerate(desafios):
        x = Inches(0.8 + i * 4.0)
        y = Inches(2.0)
        w = Inches(3.7)
        h = Inches(4.8)
        add_card(s2, x, y, w, h, BG_CARD, cor)

        tb = s2.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), w - Inches(0.6), h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True

        p_num = tf.paragraphs[0]
        p_num.text = num
        p_num.font.size = Pt(36)
        p_num.font.bold = True
        p_num.font.color.rgb = cor

        p_tit = tf.add_paragraph()
        p_tit.text = titulo
        p_tit.font.size = Pt(16)
        p_tit.font.bold = True
        p_tit.font.color.rgb = TEXT_WHITE
        p_tit.space_before = Pt(10)
        p_tit.space_after = Pt(14)

        p_desc = tf.add_paragraph()
        p_desc.text = desc
        p_desc.font.size = Pt(12)
        p_desc.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 3: O SISTEMA É 100% GRATUITO E DEMOCRÁTICO
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_background(s3, BG_DARK)
    add_header(s3, "Compromisso Público • Inclusão Sem Barreiras", "Custo Zero (R$ 0,00): Acesso Universal para Todos")

    # Coluna Esquerda: O Pilar R$ 0,00
    add_card(s3, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8), BG_CARD, GREEN_ACCENT)
    tb_cero = s3.shapes.add_textbox(Inches(1.2), Inches(2.4), Inches(4.8), Inches(4.0))
    tf_c = tb_cero.text_frame
    tf_c.word_wrap = True
    p_zero_tag = tf_c.paragraphs[0]
    p_zero_tag.text = "TOTALMENTE GRATUITO"
    p_zero_tag.font.size = Pt(12)
    p_zero_tag.font.bold = True
    p_zero_tag.font.color.rgb = GREEN_ACCENT

    p_zero_num = tf_c.add_paragraph()
    p_zero_num.text = "R$ 0,00"
    p_zero_num.font.size = Pt(48)
    p_zero_num.font.bold = True
    p_zero_num.font.color.rgb = TEXT_WHITE
    p_zero_num.space_after = Pt(10)

    p_zero_desc = tf_c.add_paragraph()
    p_zero_desc.text = "Nenhuma família em Cruzeiro do Sul paga um único centavo para usar o aplicativo. Não existem assinaturas premium, paywalls ou anúncios invasivos.\n\n" \
                       "O sistema foi projetado para rodar em celulares populares com navegadores leves (Chrome, Safari, Edge), consumindo o mínimo de dados e funcionando sem exigir aparelhos caros."
    p_zero_desc.font.size = Pt(13)
    p_zero_desc.font.color.rgb = TEXT_MUTED

    # Coluna Direita: Os 3 Benefícios Diretos da Gratuidade
    beneficios_gratis = [
        ("Equidade Social Plena", "O aluno do bairro mais periférico tem a mesma qualidade de reforço com IA vocal que um estudante de colégio de elite."),
        ("Adoção Imediata na Rede", "Sem necessidade de processos licitatórios burocráticos ou barreiras de orçamento para iniciar projetos-piloto imediatos."),
        ("Soberania Comunitária", "Tecnologia desenvolvida no e para o Acre, valorizando o contexto local, os sotaques e as referências amazônicas.")
    ]

    for i, (btit, bdesc) in enumerate(beneficios_gratis):
        y = Inches(2.0 + i * 1.65)
        add_card(s3, Inches(6.8), y, Inches(5.7), Inches(1.45), BG_CARD)
        tb_b = s3.shapes.add_textbox(Inches(7.1), y + Inches(0.15), Inches(5.1), Inches(1.15))
        tf_b = tb_b.text_frame
        tf_b.word_wrap = True
        pb_t = tf_b.paragraphs[0]
        pb_t.text = f"✔ {btit}"
        pb_t.font.size = Pt(14)
        pb_t.font.bold = True
        pb_t.font.color.rgb = GOLD
        pb_d = tf_b.add_paragraph()
        pb_d.text = bdesc
        pb_d.font.size = Pt(11)
        pb_d.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 4: ARQUITETURA MODULAR & EXPANSIVA
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_background(s4, BG_DARK)
    add_header(s4, "Engenharia de Software • Escalabilidade", "Plataforma Expansiva e 100% Modular")

    modulos = [
        ("NÚCLEO MODULAR", "Multi-Escolas",
         "O Dom Pedro II é a escola âncora, mas a infraestrutura suporta acoplar o Colégio Craveiro Costa, Hugo Carneiro, Padre Trindade e escolas de municípios vizinhos em instâncias dedicadas.",
         RED_IMPERIAL),
        ("CONTEÚDO DINÂMICO", "Novas Disciplinas",
         "De História e Geografia do Acre a Física Quântica e Redação do ENEM. Os módulos pedagógicos são injetados sem alterar a estrutura base do sistema.",
         GOLD),
        ("VOZ & MULTIMÍDIA", "Banco de Vozes Reais",
         "Capacidade de clonar e integrar a voz de qualquer professor homenageado pela escola, mantendo familiaridade e afeto no processo de estudo.",
         CYAN_ACCENT),
        ("INTEGRAÇÕES", "APIs & Sistemas Públicos",
         "Pronto para conectar ao SIGE (Sistema de Gestão Escolar), plataformas da SEE/AC e serviços de acolhimento social do município.",
         GREEN_ACCENT)
    ]

    for i, (tag, titulo, desc, cor) in enumerate(modulos):
        x = Inches(0.8 + i * 2.95)
        y = Inches(2.0)
        w = Inches(2.8)
        h = Inches(4.8)
        add_card(s4, x, y, w, h, BG_CARD, cor)

        tb = s4.shapes.add_textbox(x + Inches(0.2), y + Inches(0.25), w - Inches(0.4), h - Inches(0.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p_tag = tf.paragraphs[0]
        p_tag.text = tag
        p_tag.font.size = Pt(9.5)
        p_tag.font.bold = True
        p_tag.font.color.rgb = cor

        p_tit = tf.add_paragraph()
        p_tit.text = titulo
        p_tit.font.size = Pt(15)
        p_tit.font.bold = True
        p_tit.font.color.rgb = TEXT_WHITE
        p_tit.space_before = Pt(8)
        p_tit.space_after = Pt(12)

        p_desc = tf.add_paragraph()
        p_desc.text = desc
        p_desc.font.size = Pt(11)
        p_desc.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 5: REFORÇO ESCOLAR HUMANIZADO COM A VOZ REAL DA PROFESSORA
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_background(s5, BG_DARK)
    add_header(s5, "Pedagogia do Afeto • Sintonia Vocal", "Reforço Escolar com Voz Real: Quebrando a Frieza Digital")

    # Card Esquerdo: A Metodologia de Voz
    add_card(s5, Inches(0.8), Inches(2.0), Inches(5.8), Inches(4.8), BG_CARD, GOLD)
    tb_voz = s5.shapes.add_textbox(Inches(1.1), Inches(2.3), Inches(5.2), Inches(4.2))
    tf_v = tb_voz.text_frame
    tf_v.word_wrap = True

    pv_1 = tf_v.paragraphs[0]
    pv_1.text = "O IMPACTO DO REFORÇO POR VOZ REAL"
    pv_1.font.size = Pt(12)
    pv_1.font.bold = True
    pv_1.font.color.rgb = GOLD

    pv_2 = tf_v.add_paragraph()
    pv_2.text = "Professora Naira: A Presença que Ensina e Acolhe"
    pv_2.font.size = Pt(18)
    pv_2.font.bold = True
    pv_2.font.color.rgb = TEXT_WHITE
    pv_2.space_before = Pt(6)
    pv_2.space_after = Pt(12)

    pv_3 = tf_v.add_paragraph()
    pv_3.text = "• Chatbots puramente de texto geram distanciamento e desinteresse em jovens do ensino fundamental e médio.\n\n" \
                "• A voz da Profª Naira clonada com síntese neural de altíssima fidelidade devolve o calor humano, a entonação motivadora e o orgulho cívico do Colégio Militar Dom Pedro II.\n\n" \
                "• O aluno fala naturalmente suas dúvidas e recebe explicações orais sob medida, estimulando a oratória, a pronúncia correta e a fixação auditiva."
    pv_3.font.size = Pt(12)
    pv_3.font.color.rgb = TEXT_MUTED

    # Card Direito: Métricas de Aprendizado
    if os.path.exists(campus_path):
        s5.shapes.add_picture(campus_path, Inches(7.0), Inches(2.0), Inches(5.5), Inches(2.8))

    add_card(s5, Inches(7.0), Inches(5.0), Inches(5.5), Inches(1.8), BG_CARD, CYAN_ACCENT)
    tb_m = s5.shapes.add_textbox(Inches(7.2), Inches(5.1), Inches(5.1), Inches(1.6))
    tf_m = tb_m.text_frame
    tf_m.word_wrap = True
    pm_t = tf_m.paragraphs[0]
    pm_t.text = "DIFERENCIAIS PEDAGÓGICOS COMPROVADOS"
    pm_t.font.size = Pt(11)
    pm_t.font.bold = True
    pm_t.font.color.rgb = CYAN_ACCENT
    pm_d = tf_m.add_paragraph()
    pm_d.text = "• Repetição paciente sem cansaço: o aluno pode perguntar 10 vezes até compreender.\n" \
                "• Estímulo ao estudo noturno e de fins de semana com tutor disponível 24h.\n" \
                "• Linguagem adaptada ao nível da turma (sem termos técnicos vazios)."
    pm_d.font.size = Pt(10.5)
    pm_d.font.color.rgb = TEXT_WHITE

    # =========================================================================
    # SLIDE 6: ALÉM DA GRADE: SUPORTE SOCIOEMOCIONAL ("LUGAR DE FALAR")
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_background(s6, BG_DARK)
    add_header(s6, "Apoio Emocional • Saúde Mental Juvenil", "Não Apenas Matérias: Acolhimento Socioemocional Real")

    cards_emo = [
        ("01", "Espaço 'Lugar de Falar'",
         "Uma aba dedicada onde o aluno não precisa falar de notas ou deveres. É um canal de desabafo protegido para expressar medos, ansiedade com provas, conflitos de amizade e inseguranças.",
         CYAN_ACCENT),
        ("02", "Validação e Escuta Ativa",
         "A IA responde com respeito e acolhimento humano, sem julgamentos moralistas ou respostas automáticas frias, fortalecendo a resiliência psicológica do estudante.",
         GREEN_ACCENT),
        ("03", "Descompressão & Respiração Guiada",
         "Exercícios rápidos de alívio de estresse e ancoragem emocional antes de avaliações decisivas ou momentos de sobrecarga psicológica dos cadetes.",
         GOLD)
    ]

    for i, (n, tit, desc, cor) in enumerate(cards_emo):
        x = Inches(0.8 + i * 4.0)
        y = Inches(2.0)
        w = Inches(3.7)
        h = Inches(4.8)
        add_card(s6, x, y, w, h, BG_CARD, cor)

        tb = s6.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), w - Inches(0.6), h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True

        pn = tf.paragraphs[0]
        pn.text = n
        pn.font.size = Pt(36)
        pn.font.bold = True
        pn.font.color.rgb = cor

        pt = tf.add_paragraph()
        pt.text = tit
        pt.font.size = Pt(16)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(8)
        pt.space_after = Pt(12)

        pd = tf.add_paragraph()
        pd.text = desc
        pd.font.size = Pt(12)
        pd.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 7: BIOMETRIA VOCAL & O PODER DE SALVAR VIDAS
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_background(s7, BG_DARK)
    add_header(s7, "Segurança Máxima • Prevenção Proativa", "Biometria Vocal: O Poder de Antecipar Sinais e Evitar Tragédias", RED_IMPERIAL)

    # Card Central em Destaque Vermelho
    add_card(s7, Inches(0.8), Inches(2.0), Inches(6.0), Inches(4.8), BG_CARD, RED_IMPERIAL)
    tb_bio = s7.shapes.add_textbox(Inches(1.1), Inches(2.3), Inches(5.4), Inches(4.2))
    tf_bio = tb_bio.text_frame
    tf_bio.word_wrap = True

    pb_tag = tf_bio.paragraphs[0]
    pb_tag.text = "ANÁLISE ACÚSTICA PREVENTIVA"
    pb_tag.font.size = Pt(12)
    pb_tag.font.bold = True
    pb_tag.font.color.rgb = RED_IMPERIAL

    pb_tit = tf_bio.add_paragraph()
    pb_tit.text = "O que as Palavras Não Dizem, a Voz Revela"
    pb_tit.font.size = Pt(18)
    pb_tit.font.bold = True
    pb_tit.font.color.rgb = TEXT_WHITE
    pb_tit.space_before = Pt(6)
    pb_tit.space_after = Pt(12)

    pb_txt = tf_bio.add_paragraph()
    pb_txt.text = "• A análise do sinal de áudio identifica modulações involuntárias de pânico, choro contido, tremor vocal e sussurros de perigo iminente.\n\n" \
                  "• Sinais de autoflagelação, ideação de autoagressão, bullying severo ou violência doméstica são detectados por padrões de tom e vocabulário crítico.\n\n" \
                  "• Alertas discretos são enviados à orientação pedagógica da escola antes que o sofrimento resulte em tragédia irreparável."
    pb_txt.font.size = Pt(12)
    pb_txt.font.color.rgb = TEXT_MUTED

    # Lado Direito: Central SOS Imediata
    add_card(s7, Inches(7.2), Inches(2.0), Inches(5.3), Inches(4.8), BG_CARD, GOLD)
    tb_sos = s7.shapes.add_textbox(Inches(7.5), Inches(2.3), Inches(4.7), Inches(4.2))
    tf_sos = tb_sos.text_frame
    tf_sos.word_wrap = True

    ps_tag = tf_sos.paragraphs[0]
    ps_tag.text = "CENTRAL SOS INTEGRADA DE EMERGÊNCIA"
    ps_tag.font.size = Pt(12)
    ps_tag.font.bold = True
    ps_tag.font.color.rgb = GOLD

    ps_tit = tf_sos.add_paragraph()
    ps_tit.text = "Acionamento em 1 Toque Disponível 24/7"
    ps_tit.font.size = Pt(16)
    ps_tit.font.bold = True
    ps_tit.font.color.rgb = TEXT_WHITE
    ps_tit.space_before = Pt(6)
    ps_tit.space_after = Pt(14)

    sos_numeros = [
        ("193", "Corpo de Bombeiros Militar do Acre (Socorro & Resgate)"),
        ("190", "Polícia Militar (Prevenção de Agressões & Emergências)"),
        ("192", "SAMU (Atendimento Médico de Urgência)"),
        ("100", "Disque Direitos Humanos (Proteção da Criança e Adolescente)")
    ]

    for num, rotulo in sos_numeros:
        p_item = tf_sos.add_paragraph()
        p_item.text = f"🚨 {num} — {rotulo}"
        p_item.font.size = Pt(11)
        p_item.font.color.rgb = TEXT_WHITE
        p_item.space_before = Pt(6)

    # =========================================================================
    # SLIDE 8: CONTROLE PEDAGÓGICO & MELHORIA CONTÍNUA DO CURRÍCULO
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_background(s8, BG_DARK)
    add_header(s8, "Gestão de Dados Educacionais", "Painel da Equipe: Inteligência para Evolução Curricular")

    recursos_painel = [
        ("01. Mapa de Calor de Dúvidas",
         "O corpo docente acessa relatórios em tempo real de quais questões e tópicos geraram mais dúvidas durante a semana, direcionando o planejamento pedagógico.",
         CYAN_ACCENT),
        ("02. Detecção de Falhas Curriculares",
         "Se 80% dos alunos travaram em 'Funções do 2º Grau' ou 'História da Revolução Acreana', o professor sabe exatamente onde aprofundar na aula seguinte.",
         GOLD),
        ("03. Gestão Sem Burocracia",
         "Acesso simplificado com credenciais da equipe (`admin / admin / admin`), permitindo atualização ágil de avisos, materiais e parametrização de respostas.",
         GREEN_ACCENT),
        ("04. Respeito à Privacidade (LGPD)",
         "Os dados de voz e históricos de perguntas são processados com segurança estrita, sem exposição pública ou comercialização de dados dos estudantes.",
         TEXT_WHITE)
    ]

    for i, (tit, desc, cor) in enumerate(recursos_painel):
        col = i % 2
        row = i // 2
        x = Inches(0.8 + col * 6.0)
        y = Inches(2.0 + row * 2.45)
        w = Inches(5.7)
        h = Inches(2.25)

        add_card(s8, x, y, w, h, BG_CARD, cor)
        tb = s8.shapes.add_textbox(x + Inches(0.3), y + Inches(0.2), w - Inches(0.6), h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        ptit = tf.paragraphs[0]
        ptit.text = tit
        ptit.font.size = Pt(14)
        ptit.font.bold = True
        ptit.font.color.rgb = cor

        pdesc = tf.add_paragraph()
        pdesc.text = desc
        pdesc.font.size = Pt(11.5)
        pdesc.font.color.rgb = TEXT_MUTED
        pdesc.space_before = Pt(6)

    # =========================================================================
    # SLIDE 9: IMPACTO NO DESENVOLVIMENTO DE CRUZEIRO DO SUL & DO JURUÁ
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_background(s9, BG_DARK)
    add_header(s9, "Transformação Social & Futuro", "Impacto Estratégico no Desenvolvimento de Cruzeiro do Sul")

    impactos = [
        ("Pioneirismo Tecnológico da Amazônia",
         "Coloca Cruzeiro do Sul no radar nacional como modelo inovador de IA pública e humanizada aplicada à educação cívico-militar.",
         GOLD),
        ("Redução Drástica da Evasão Escolar",
         "O acompanhamento contínuo impede que o estudante desista da escola por se sentir incapaz ou desamparado pedagogicamente.",
         CYAN_ACCENT),
        ("Formação de Cidadãos Conscientes",
         "Une rigor militar, disciplina de estudos e sensibilidade humana, preparando futuros líderes para o estado do Acre e para o Brasil.",
         GREEN_ACCENT)
    ]

    for i, (tit, desc, cor) in enumerate(impactos):
        x = Inches(0.8 + i * 4.0)
        y = Inches(2.0)
        w = Inches(3.7)
        h = Inches(4.8)
        add_card(s9, x, y, w, h, BG_CARD, cor)

        tb = s9.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), w - Inches(0.6), h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True

        ptit = tf.paragraphs[0]
        ptit.text = f"0{i+1}"
        ptit.font.size = Pt(36)
        ptit.font.bold = True
        ptit.font.color.rgb = cor

        ptit2 = tf.add_paragraph()
        ptit2.text = tit
        ptit2.font.size = Pt(16)
        ptit2.font.bold = True
        ptit2.font.color.rgb = TEXT_WHITE
        ptit2.space_before = Pt(8)
        ptit2.space_after = Pt(12)

        pdesc = tf.add_paragraph()
        pdesc.text = desc
        pdesc.font.size = Pt(12)
        pdesc.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 10: CONCLUSÃO, HOMOLOGAÇÃO & OPORTUNIDADE DE PARCERIA
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_background(s10, BG_DARK)
    add_header(s10, "Visão de Futuro • Próximos Passos", "Uma Conquista Real para a Nossa Comunidade Escolar")

    add_card(s10, Inches(0.8), Inches(2.0), Inches(7.5), Inches(4.8), BG_CARD, GOLD)
    tb_concl = s10.shapes.add_textbox(Inches(1.2), Inches(2.3), Inches(6.8), Inches(4.2))
    tf_cc = tb_concl.text_frame
    tf_cc.word_wrap = True

    pc_tag = tf_cc.paragraphs[0]
    pc_tag.text = "PROJETO PILOTO TOTALMENTE OPERACIONAL"
    pc_tag.font.size = Pt(12)
    pc_tag.font.bold = True
    pc_tag.font.color.rgb = GOLD

    pc_tit = tf_cc.add_paragraph()
    pc_tit.text = "Pronto para Validação com Cadetes e Professores"
    pc_tit.font.size = Pt(20)
    pc_tit.font.bold = True
    pc_tit.font.color.rgb = TEXT_WHITE
    pc_tit.space_before = Pt(6)
    pc_tit.space_after = Pt(12)

    pc_txt = tf_cc.add_paragraph()
    pc_txt.text = "✔ Plataforma Web responsiva em produção no Render (acesso instantâneo).\n\n" \
                  "✔ Perfil 'Aluno Teste' persistente para experimentação sem risco de perda de dados.\n\n" \
                  "✔ Áudio orquestral de abertura em 32-bit estéreo com o Hino da Independência.\n\n" \
                  "✔ Login administrativo simplificado para acompanhamento da direção e coordenação.\n\n" \
                  "✔ Convite aberto para homologação oficial junto ao Corpo de Bombeiros Militar e Secretaria de Educação."
    pc_txt.font.size = Pt(12.5)
    pc_txt.font.color.rgb = TEXT_MUTED

    # Card da Direita: Lema Cívico e Chamada para Ação
    add_card(s10, Inches(8.7), Inches(2.0), Inches(3.8), Inches(4.8), RED_IMPERIAL)
    tb_lema = s10.shapes.add_textbox(Inches(9.0), Inches(2.3), Inches(3.2), Inches(4.2))
    tf_l = tb_lema.text_frame
    tf_l.word_wrap = True

    pl_1 = tf_l.paragraphs[0]
    pl_1.text = "LEMA CÍVICO"
    pl_1.font.size = Pt(11)
    pl_1.font.bold = True
    pl_1.font.color.rgb = GOLD

    pl_2 = tf_l.add_paragraph()
    pl_2.text = "« Ou ficar a Pátria livre,\nou morrer pelo Brasil! »"
    pl_2.font.size = Pt(18)
    pl_2.font.bold = True
    pl_2.font.color.rgb = TEXT_WHITE
    pl_2.space_before = Pt(14)
    pl_2.space_after = Pt(14)

    pl_3 = tf_l.add_paragraph()
    pl_3.text = "Educando com disciplina, acolhendo com afeto e protegendo cada vida da juventude de Cruzeiro do Sul."
    pl_3.font.size = Pt(12)
    pl_3.font.color.rgb = RGBColor(255, 235, 238)

    # Salvar nos destinos
    output_dirs = [
        r"C:\Users\junio\catalogo-cruzeiro\dom-pedro-ii\downloads",
        r"C:\Users\junio\Desktop"
    ]
    
    file_name = "Apresentacao_Dom_Pedro_II_Voice.pptx"
    saved_paths = []

    for d in output_dirs:
        try:
            os.makedirs(d, exist_ok=True)
            out_path = os.path.join(d, file_name)
            prs.save(out_path)
            saved_paths.append(out_path)
            print(f"Deck salvo com sucesso em: {out_path}")
        except Exception as e:
            print(f"Erro ao salvar em {d}: {e}")

    return saved_paths

if __name__ == "__main__":
    paths = create_deck()
    print("Processamento concluído. Slides criados com sucesso.")
