export const NERD_TEAM = {
  sprite: {
    name: "Pixo FX",
    focus: "sprites, neon e efeitos",
    task: "transformar bonecos provisórios em sprites animáveis"
  },
  avatar: {
    name: "Gabi Avatar",
    focus: "avatar, acessórios e silhueta",
    task: "separar corpo, roupa e equipamento para evolução visual"
  },
  physics: {
    name: "Otto Physics",
    focus: "movimento, clique e colisão",
    task: "deixar a navegação do salão confiável e gostosa de usar"
  },
  hud: {
    name: "Beto HUD",
    focus: "HUD, orientações e leitura rápida",
    task: "fazer objetivo, saldo e ações aparecerem sem poluir a tela"
  },
  qa: {
    name: "Tami QA",
    focus: "teste de jogo e atritos",
    task: "validar clique, tecla Entrar, troca de cena, painel e responsividade"
  },
  engine: {
    name: "Zed Engine",
    focus: "estado, cenas e estabilidade",
    task: "manter a migração modular sem voltar ao monolito"
  }
};

export const NERD_SPRINT_ORDER = [
  NERD_TEAM.sprite,
  NERD_TEAM.avatar,
  NERD_TEAM.physics,
  NERD_TEAM.hud,
  NERD_TEAM.engine,
  NERD_TEAM.qa
];

export function formatNerdAgent(agent) {
  return `${agent.name}: ${agent.focus}`;
}
